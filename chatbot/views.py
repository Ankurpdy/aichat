from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from .models import ChatMessage, ChatSession
import random
from langdetect import detect
import datetime


@login_required(login_url='login')
def home(request):
    sessions = ChatSession.objects.filter(user=request.user)
    active_session = None
    session_id = request.GET.get('session')
    if session_id:
        active_session = get_object_or_404(ChatSession, id=session_id, user=request.user)
    else:
        active_session = sessions.first()
    messages = []
    if active_session:
        messages = active_session.messages.all()
    return render(request, 'chatbot/home.html', {
        'sessions': sessions,
        'active_session': active_session,
        'messages': messages,
    })


def get_bot_response(user_message):
    from openai import OpenAI
    try:
        detected_lang = detect(user_message)
    except Exception:
        detected_lang = "en"
    user_message_lower = user_message.lower()
    time_keywords_en = ["what is the time", "current time", "time now", "today date"]
    date_keywords_en = ["what is the date", "today's date", "date today"]
    time_keywords_hi = ["कितने बजे", "अभी समय", "समय", "बजे", "समय क्या है", "अब कितने बजे"]
    date_keywords_hi = ["आज की तारीख", "तारीख", "आज कौन सी तारीख है", "तारीख क्या है"]
    if detected_lang == "en":
        if any(keyword in user_message_lower for keyword in time_keywords_en):
            current_time = datetime.datetime.now().strftime("%I:%M %p")
            return f"The current time is {current_time}."
        if any(keyword in user_message_lower for keyword in date_keywords_en):
            current_date = datetime.datetime.now().strftime("%A, %B %d, %Y")
            return f"Today's date is {current_date}."
    if detected_lang == "hi":
        if any(keyword in user_message_lower for keyword in time_keywords_hi):
            current_time = datetime.datetime.now().strftime("%I:%M %p")
            return f"अभी समय है {current_time}।"
        if any(keyword in user_message_lower for keyword in date_keywords_hi):
            current_date = datetime.datetime.now().strftime("%A, %d %B %Y")
            return f"आज की तारीख है {current_date}।"
    try:
        client = OpenAI(
            base_url="https://router.huggingface.co/v1",
            api_key="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",
        )
        completion = client.chat.completions.create(
            model="moonshotai/Kimi-K2-Instruct:novita",
            messages=[{"role": "user", "content": user_message}],
        )
        return completion.choices[0].message.content
    except Exception as e:
        return random.choice([
            "I'm having trouble connecting to my brain right now. Please try again later.",
            "Sorry, I encountered an error while processing your request.",
            "My neural networks are experiencing some issues. Could you try again?"
        ])


def login_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        user = authenticate(request, username=username, password=password)
        if user:
            login(request, user)
            return redirect('home')
        return render(request, 'chatbot/login.html', {'error': 'Invalid credentials'})
    return render(request, 'chatbot/login.html')


def register_view(request):
    if request.method == 'POST':
        username = request.POST['username']
        password = request.POST['password']
        confirm = request.POST['confirm_password']
        if password != confirm:
            return render(request, 'chatbot/register.html', {'error': 'Passwords do not match'})
        if User.objects.filter(username=username).exists():
            return render(request, 'chatbot/register.html', {'error': 'Username already taken'})
        user = User.objects.create_user(username=username, password=password)
        login(request, user)
        return redirect('home')
    return render(request, 'chatbot/register.html')


def logout_view(request):
    logout(request)
    return redirect('login')


@login_required
def new_session(request):
    session = ChatSession.objects.create(user=request.user)
    return redirect(f'/?session={session.id}')


@login_required
def delete_session(request, session_id):
    session = get_object_or_404(ChatSession, id=session_id, user=request.user)
    session.delete()
    return redirect('home')


@login_required
def rename_session(request, session_id):
    if request.method == 'POST':
        session = get_object_or_404(ChatSession, id=session_id, user=request.user)
        session.title = request.POST.get('title', session.title)
        session.save()
    return redirect(f'/?session={session_id}')


def chat_ajax(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Login required'}, status=401)
    if request.method == 'POST':
        user_message = request.POST.get('user_message', '')
        session_id = request.POST.get('session_id')
        if user_message:
            if not session_id:
                session = ChatSession.objects.create(user=request.user)
                session_id = session.id
            session = get_object_or_404(ChatSession, id=session_id, user=request.user)
            bot_response = get_bot_response(user_message)
            if session.title == 'New Chat':
                session.title = user_message[:50] + ('...' if len(user_message) > 50 else '')
                session.save()
            ChatMessage.objects.create(
                session=session,
                user_message=user_message,
                bot_response=bot_response
            )
            return JsonResponse({
                'bot_response': bot_response,
                'session_id': session.id,
                'session_title': session.title,
            })
    return JsonResponse({'error': 'Invalid request'}, status=400)
