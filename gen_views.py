import pathlib
lines = []
lines.append("from django.shortcuts import render, redirect, get_object_or_404")
lines.append("from django.http import JsonResponse")
lines.append("from django.contrib.auth import login, logout, authenticate")
lines.append("from django.contrib.auth.decorators import login_required")
lines.append("from django.contrib.auth.models import User")
lines.append("from .models import ChatMessage, ChatSession")
lines.append("import random")
lines.append("from langdetect import detect")
lines.append("import datetime")
lines.append("")
lines.append("@login_required(login_url='login')")
lines.append("def home(request):")
lines.append("    sessions = ChatSession.objects.filter(user=request.user)")
lines.append("    active_session = None")
lines.append("    session_id = request.GET.get('session')")
lines.append("    if session_id