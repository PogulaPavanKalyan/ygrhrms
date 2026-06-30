import os
import sys
import django

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrpanel.settings')
django.setup()

from django.test import Client
from django.test.utils import override_settings
from django.contrib.auth import get_user_model
User = get_user_model()

@override_settings(ALLOWED_HOSTS=['*'])
def run_tests():
    c = Client()
    
    # Check what users exist and passwords
    user_emp = User.objects.filter(emp_id__iexact='EMP001').first()
    if user_emp:
        print(f"EMP001 user found. Username: {user_emp.username}, check_password('password123'): {user_emp.check_password('password123')}")
    else:
        print("EMP001 user NOT found!")

    print("Testing GET '/' (unified login page)...")
    response = c.get('/')
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    print("[OK] GET '/' succeeded.")

    print("\nTesting POST '/' login as Employee...")
    response = c.post('/', {'username': 'EMP001', 'password': 'password123'})
    if response.status_code == 200:
        from django.contrib.messages import get_messages
        msgs = list(get_messages(response.wsgi_request))
        print("Login failed with messages:")
        for msg in msgs:
            print(f"- {msg}")
    assert response.status_code == 302, f"Expected 302 redirect, got {response.status_code}"
    redirect_target = response.url
    print(f"[OK] Login succeeded. Redirected to: {redirect_target}")
    assert 'employee_dashboard' in redirect_target or 'attendance' in redirect_target or 'check-in' in redirect_target, f"Unexpected redirect target: {redirect_target}"

    # Verify Cache-Control header is present to prevent back button caching
    assert response.wsgi_request.user.is_authenticated, "User should be authenticated"
    protected_resp = c.get('/employee_dashboard/')
    assert protected_resp.get('Cache-Control') == 'no-cache, no-store, must-revalidate, max-age=0', f"Expected cache headers, got: {protected_resp.get('Cache-Control')}"
    print("[OK] Cache-Control header verification passed.")

    print("\nTesting Employee role-based access control...")
    # Attempt to access '/hr/home' while logged in as Employee
    response = c.get('/hr/home')
    assert response.status_code == 403, f"Expected 403 Forbidden for Employee, got {response.status_code}"
    print("[OK] Employee access to '/hr/home' blocked with 403.")

    # Attempt to access '/manager/profile/' or similar
    response2 = c.get('/dashboard/')
    assert response2.status_code == 403, f"Expected 403 Forbidden for Employee on manager dashboard, got {response2.status_code}"
    print("[OK] Employee access to '/dashboard/' blocked with 403.")

    # Attempt to access '/tl_dashboard/'
    response3 = c.get('/tl_dashboard/')
    assert response3.status_code == 403, f"Expected 403 Forbidden for Employee on tl dashboard, got {response3.status_code}"
    print("[OK] Employee access to '/tl_dashboard/' blocked with 403.")

    print("\nLogging out employee...")
    c.logout()

    # Verify unauthenticated redirects
    print("\nTesting unauthenticated redirects...")
    response_unauth = c.get('/employee_dashboard/')
    assert response_unauth.status_code == 302, f"Expected 302 redirect for unauthenticated user, got {response_unauth.status_code}"
    assert response_unauth.url == '/', f"Expected redirect to '/', got {response_unauth.url}"
    print("[OK] Unauthenticated redirect to '/' verified.")

    print("\nTesting POST '/' login as HR...")
    response = c.post('/', {'username': 'HR001', 'password': 'password123'})
    assert response.status_code == 302, f"Expected 302 redirect, got {response.status_code}"
    redirect_target = response.url
    print(f"[OK] HR Login succeeded. Redirected to: {redirect_target}")
    assert 'home' in redirect_target, f"Unexpected redirect target: {redirect_target}"

    print("\nLogging out HR...")
    c.logout()

    print("\nTesting POST '/' login as MD...")
    response = c.post('/', {'username': 'MD001', 'password': 'password123'})
    assert response.status_code == 302, f"Expected 302 redirect, got {response.status_code}"
    redirect_target = response.url
    print(f"[OK] MD Login succeeded. Redirected to: {redirect_target}")
    assert 'md_dashboard' in redirect_target, f"Unexpected redirect target: {redirect_target}"

    print("\nAll tests completed successfully!")

if __name__ == '__main__':
    run_tests()
