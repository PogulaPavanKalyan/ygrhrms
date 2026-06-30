from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/chat_call/$', consumers.ChatCallConsumer.as_asgi()),
]
