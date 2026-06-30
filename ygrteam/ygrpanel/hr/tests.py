from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from .models import ChatRoom, ChatMessage, GroupMessage, UserPresence, CompanyAnnouncement
from django.utils import timezone
from datetime import timedelta
import json

User = get_user_model()

class CollaborationChatTests(TestCase):
    def setUp(self):
        # Create users with different roles
        self.md_user = User.objects.create_user(
            username='md_user',
            password='testpassword',
            role='MD',
            email='md@test.com'
        )
        self.hr_user = User.objects.create_user(
            username='hr_user',
            password='testpassword',
            role='HR',
            email='hr@test.com'
        )
        self.emp_user1 = User.objects.create_user(
            username='emp_user1',
            password='testpassword',
            role='Employee',
            email='emp1@test.com'
        )
        self.emp_user2 = User.objects.create_user(
            username='emp_user2',
            password='testpassword',
            role='Employee',
            email='emp2@test.com'
        )

        # Clients for each user
        self.md_client = Client()
        self.md_client.login(username='md_user', password='testpassword')
        
        self.hr_client = Client()
        self.hr_client.login(username='hr_user', password='testpassword')
        
        self.emp1_client = Client()
        self.emp1_client.login(username='emp_user1', password='testpassword')

        self.emp2_client = Client()
        self.emp2_client.login(username='emp_user2', password='testpassword')

    def test_communication_page_self_seeds_channels(self):
        # Check that opening the communication page self-seeds standard channels
        self.assertEqual(ChatRoom.objects.filter(room_type='channel').count(), 0)
        
        response = self.emp1_client.get(reverse('communication'))
        self.assertEqual(response.status_code, 200)
        
        # Verify that channels like 'General' and 'Announcements' were created
        self.assertTrue(ChatRoom.objects.filter(room_type='channel', name='General').exists())
        self.assertTrue(ChatRoom.objects.filter(room_type='channel', name='Announcements').exists())
        self.assertEqual(ChatRoom.objects.filter(room_type='channel').count(), 8)

    def test_direct_message_flow(self):
        # Send direct message from emp1 to emp2
        response = self.emp1_client.post(reverse('send_chat_message'), {
            'receiver_id': self.emp_user2.id,
            'text': 'Hello emp2!'
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['message']['text'], 'Hello emp2!')
        
        # Fetch history from emp2 perspective and verify message is retrieved
        response = self.emp2_client.get(reverse('get_chat_history'), {
            'user_id': self.emp_user1.id
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['messages']), 1)
        self.assertEqual(data['messages'][0]['text'], 'Hello emp2!')
        self.assertFalse(data['messages'][0]['is_group'])

    def test_announcements_channel_read_only_for_employees(self):
        # Ensure Announcements channel is seeded
        self.emp1_client.get(reverse('communication'))
        ann_room = ChatRoom.objects.get(room_type='channel', name='Announcements')
        
        # Employee tries to post to announcements channel and should be denied
        response = self.emp1_client.post(reverse('send_chat_message'), {
            'room_id': ann_room.id,
            'text': 'Breaking news!'
        })
        self.assertEqual(response.status_code, 403)
        
        # MD posts to announcements channel and should succeed
        response = self.md_client.post(reverse('send_chat_message'), {
            'room_id': ann_room.id,
            'text': 'Welcome to YGR Team!'
        })
        self.assertEqual(response.status_code, 200)

    def test_team_group_creation_and_access(self):
        # HR creates a team group with emp1
        response = self.hr_client.post(reverse('create_team_group'), {
            'name': 'Dev Python Team',
            'description': 'Working on Python',
            'users': [self.emp_user1.id]
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        room_id = data['room']['id']

        # emp1 (member) fetches history and succeeds
        response = self.emp1_client.get(reverse('get_chat_history'), {'room_id': room_id})
        self.assertEqual(response.status_code, 200)

        # emp2 (non-member) fetches history and is denied (403)
        response = self.emp2_client.get(reverse('get_chat_history'), {'room_id': room_id})
        self.assertEqual(response.status_code, 403)

    def test_message_editing_time_limit(self):
        # Create private message
        msg = ChatMessage.objects.create(
            sender=self.emp_user1,
            receiver=self.emp_user2,
            text='Original Text'
        )

        # Edit text succeeds within 10 minutes
        response = self.emp1_client.post(reverse('edit_chat_message'), json.dumps({
            'message_id': msg.id,
            'is_group': False,
            'text': 'Edited Text'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        msg.refresh_from_db()
        self.assertEqual(msg.text, 'Edited Text')
        self.assertTrue(msg.edited)

        # Change created_at to 15 minutes ago
        msg.created_at = timezone.now() - timedelta(minutes=15)
        msg.save()

        # Edit text fails after 10 minutes
        response = self.emp1_client.post(reverse('edit_chat_message'), json.dumps({
            'message_id': msg.id,
            'is_group': False,
            'text': 'New Edited Text'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 400)
        msg.refresh_from_db()
        self.assertEqual(msg.text, 'Edited Text')

    def test_reactions(self):
        msg = ChatMessage.objects.create(
            sender=self.emp_user1,
            receiver=self.emp_user2,
            text='A reactive post!'
        )

        # emp2 reacts with thumbs up
        response = self.emp2_client.post(reverse('toggle_reaction'), json.dumps({
            'message_id': msg.id,
            'is_group': False,
            'emoji': '👍'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('👍', data['reactions'])
        self.assertIn(self.emp_user2.id, data['reactions']['👍']['users'])

        # emp2 toggles reaction (removes thumbs up)
        response = self.emp2_client.post(reverse('toggle_reaction'), json.dumps({
            'message_id': msg.id,
            'is_group': False,
            'emoji': '👍'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertNotIn('👍', data['reactions'])

    def test_presence_update(self):
        # Verify initial offline or empty status
        presence = UserPresence.objects.filter(user=self.emp_user1).first()
        self.assertTrue(presence is None or presence.status == 'Offline')

        # emp1 updates presence to Away
        response = self.emp1_client.post(reverse('update_presence'), json.dumps({
            'status': 'Away'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        presence = UserPresence.objects.get(user=self.emp_user1)
        self.assertEqual(presence.status, 'Away')

    def test_call_signal_initiate_accept_reject_end(self):
        # 1. Initiate call from HR to Employee (allowed)
        response = self.hr_client.post(reverse('call_signal'), json.dumps({
            'action': 'initiate',
            'receiver_id': self.emp_user1.id,
            'call_type': 'video',
            'sdp': '{"type":"offer","sdp":"..."}'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        session_id = data['session_id']

        # 2. Employee polls and finds incoming call
        response = self.emp1_client.post(reverse('call_signal'), json.dumps({
            'action': 'poll'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn('incoming_call', data)
        self.assertEqual(data['incoming_call']['session_id'], session_id)

        # 3. Employee accepts call
        response = self.emp1_client.post(reverse('call_signal'), json.dumps({
            'action': 'accept',
            'session_id': session_id,
            'sdp': '{"type":"answer","sdp":"..."}'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)

        # 4. Employee ends call
        response = self.emp1_client.post(reverse('call_signal'), json.dumps({
            'action': 'end',
            'session_id': session_id
        }), content_type='application/json')
        self.assertEqual(response.status_code, 200)

    def test_call_signal_employee_cannot_call_md(self):
        # Employee tries to call MD directly and should be rejected with 403 Forbidden
        response = self.emp1_client.post(reverse('call_signal'), json.dumps({
            'action': 'initiate',
            'receiver_id': self.md_user.id,
            'call_type': 'voice',
            'sdp': '{"type":"offer","sdp":"..."}'
        }), content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_schedule_meeting(self):
        # Schedule meeting from HR user
        response = self.hr_client.post(reverse('schedule_meeting'), {
            'title': 'Sprint Planning',
            'description': 'Sprint 2 planning session',
            'scheduled_time': (timezone.now() + timedelta(days=1)).isoformat(),
            'duration_minutes': '45',
            'users': [self.emp_user1.id, self.emp_user2.id],
            'recurrence': 'none',
            'waiting_room': 'true'
        })
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertEqual(data['meeting']['title'], 'Sprint Planning')
        
        # Verify a DM notification was sent to invited users
        from .models import ChatMessage
        notifications = ChatMessage.objects.filter(sender=self.hr_user, receiver=self.emp_user1)
        self.assertTrue(notifications.exists())
        self.assertIn("Sprint Planning", notifications.first().text)

        # Retrieve scheduled meetings list for Employee 1
        response = self.emp1_client.get(reverse('schedule_meeting'))
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data['status'], 'success')
        self.assertTrue(len(data['meetings']) > 0)
        self.assertEqual(data['meetings'][0]['title'], 'Sprint Planning')

