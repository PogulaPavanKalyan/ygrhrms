import os
import sys
import django

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrpanel.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print("Existing Users:")
for u in User.objects.all():
    print(f"Username: {u.username} | Email: {u.email} | Emp ID: {u.emp_id} | Role: {u.role} | Active: {u.is_active}")
