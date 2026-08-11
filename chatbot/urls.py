from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
    path('logout/', views.logout_view, name='logout'),
    path('chat/ajax', views.chat_ajax, name='chat_ajax'),
    path('session/new/', views.new_session, name='new_session'),
    path('session/delete/<int:session_id>/', views.delete_session, name='delete_session'),
    path('session/rename/<int:session_id>/', views.rename_session, name='rename_session'),
]