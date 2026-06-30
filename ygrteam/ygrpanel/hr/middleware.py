from django.http import HttpResponseForbidden
from django.shortcuts import redirect
from django.urls import resolve, Resolver404

class HRMSAccessControlMiddleware:
    """
    Enforces Role-Based Access Control and authentication routing:
    1. Redirects unauthenticated users to the unified login page (/).
    2. Restricts 'Employee' users from accessing administrative areas (/hr, /md, /manager, /teamleader, etc.).
    3. Prevents browser back-button caching for authenticated sessions.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path
        
        # Bypass for static, media, and api files
        if path.startswith('/static/') or path.startswith('/media/') or path.startswith('/api/'):
            return self.get_response(request)
            
        # Resolve URL name to identify the view
        try:
            resolver_match = resolve(request.path_info)
            url_name = resolver_match.url_name
        except Resolver404:
            url_name = None
            
        # Public views that don't require authentication
        public_url_names = {
            'viewlogins', 'hr_login', 'tl_login', 'employee_login', 
            'manager_login', 'login', 'exam_login', 'exam_register'
        }
        
        is_public = (
            url_name in public_url_names or 
            (url_name and url_name.startswith('admin:')) or 
            path == '/'
        )
        
        # 1. Route Protection: Redirect unauthenticated users to unified login
        if not request.user.is_authenticated:
            if not is_public:
                return redirect('viewlogins')
        else:
            # Track user presence and activity
            try:
                from .models import UserPresence
                presence, created = UserPresence.objects.get_or_create(user=request.user)
                if created or presence.status == 'Offline':
                    presence.status = 'Online'
                presence.save()  # Auto-updates last_activity because of auto_now=True
            except Exception:
                pass

            # 2. Route Protection: Prevent Employee from accessing admin paths
            if request.user.role == 'Employee':
                path_lower = path.lower()
                if (
                    path_lower.startswith('/hr') or 
                    path_lower.startswith('/md') or 
                    path_lower.startswith('/manager') or 
                    path_lower.startswith('/teamleader') or 
                    path_lower.startswith('/teamlead') or 
                    path_lower.startswith('/tl') or 
                    path_lower.startswith('/dashboard') or
                    url_name in {'home', 'md_dashboard', 'index', 'tl_dashboard'}
                ):
                    return HttpResponseForbidden("403 Forbidden: Employees are not allowed to access administrative areas.")
                    
        response = self.get_response(request)
        
        # 3. Disable browser back-button cache for authenticated pages
        if request.user.is_authenticated:
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate, max-age=0'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            
        return response

