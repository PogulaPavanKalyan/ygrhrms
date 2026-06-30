import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async

class ChatCallConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        
        if not self.user or self.user.is_anonymous:
            await self.close()
            return
            
        self.user_group = f"user_{self.user.id}"
        self.presence_group = "presence_group"
        
        # Join user-specific group
        await self.channel_layer.group_add(self.user_group, self.channel_name)
        
        # Join global presence group
        await self.channel_layer.group_add(self.presence_group, self.channel_name)
        
        await self.accept()
        
        # Mark as Online on connect
        await self.update_presence("Online")
        
        # Broadcast presence change to other users
        await self.channel_layer.group_send(
            self.presence_group,
            {
                "type": "presence_broadcast",
                "user_id": self.user.id,
                "status": "Online"
            }
        )

    async def disconnect(self, close_code):
        if hasattr(self, 'user') and not self.user.is_anonymous:
            # Mark as Offline on disconnect
            await self.update_presence("Offline")
            
            # Broadcast offline state
            await self.channel_layer.group_send(
                self.presence_group,
                {
                    "type": "presence_broadcast",
                    "user_id": self.user.id,
                    "status": "Offline"
                }
            )
            
            # Discard groups
            await self.channel_layer.group_discard(self.user_group, self.channel_name)
            await self.channel_layer.group_discard(self.presence_group, self.channel_name)

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return
            
        action = data.get("action")
        if not action:
            return
            
        if action == "presence_change":
            status = data.get("status", "Online")
            await self.update_presence(status)
            
            # Broadcast status change
            await self.channel_layer.group_send(
                self.presence_group,
                {
                    "type": "presence_broadcast",
                    "user_id": self.user.id,
                    "status": status
                }
            )
            
        elif action == "subscribe_room":
            room_id = data.get("room_id")
            if room_id:
                await self.channel_layer.group_add(f"room_{room_id}", self.channel_name)
                
        elif action == "unsubscribe_room":
            room_id = data.get("room_id")
            if room_id:
                await self.channel_layer.group_discard(f"room_{room_id}", self.channel_name)

    # Event handlers to forward channel events to client
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "chat_message",
            "message": event["message"]
        }))

    async def room_message(self, event):
        await self.send(text_data=json.dumps({
            "type": "room_message",
            "message": event["message"]
        }))

    async def call_incoming(self, event):
        await self.send(text_data=json.dumps({
            "type": "call_incoming",
            "session_id": event["session_id"],
            "caller_id": event["caller_id"],
            "caller_name": event["caller_name"],
            "caller_avatar": event["caller_avatar"],
            "caller_role": event["caller_role"],
            "caller_dept": event["caller_dept"],
            "call_type": event["call_type"]
        }))

    async def call_state_change(self, event):
        payload = {
            "type": "call_state_change",
            "session_id": event["session_id"],
            "status": event["status"]
        }
        if "receiver_sdp" in event:
            payload["receiver_sdp"] = event["receiver_sdp"]
        await self.send(text_data=json.dumps(payload))

    async def presence_broadcast(self, event):
        await self.send(text_data=json.dumps({
            "type": "presence_broadcast",
            "user_id": event["user_id"],
            "status": event["status"]
        }))

    @database_sync_to_async
    def update_presence(self, status):
        from .models import UserPresence
        presence, created = UserPresence.objects.get_or_create(user=self.user)
        presence.status = status
        presence.save()
