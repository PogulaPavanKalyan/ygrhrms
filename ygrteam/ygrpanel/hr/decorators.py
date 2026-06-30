from django.shortcuts import redirect
from django.contrib import messages

def manager_required(view_func):
    def wrapper(request, *args, **kwargs):
        if request.user.role != "Manager":
            messages.error(request, "Managers only.")
            return redirect("main:login")
        return view_func(request, *args, **kwargs)
    return wrapper
