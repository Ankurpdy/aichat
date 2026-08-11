from django.contrib import admin
from .models import ChatMessage, ChatSession

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('session', 'user_message', 'bot_response', 'timestamp')
    list_filter = ('timestamp', 'session')
    search_fields = ('user_message', 'bot_response')

@admin.register(ChatSession)
class ChatSessionAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'created_at', 'updated_at')
    list_filter = ('created_at', 'user')
    search_fields = ('title', 'user__username')