from django import forms
from .models import User

from django import forms
from django.contrib.auth import get_user_model

User = get_user_model()

class UserForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)
    confirm_password = forms.CharField(widget=forms.PasswordInput)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'phone', 'role',
            'department', 'status', 'experience_years',
            'previous_company', 'gender', 'date_of_birth',
            'date_of_joining', 'address', 'salary',
            'profile_pic', 'document'
        ]

    def clean(self):
        cleaned = super().clean()
        if cleaned.get("password") != cleaned.get("confirm_password"):
            raise forms.ValidationError("Passwords do not match")
        return cleaned

    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
        return user





from django.forms import inlineformset_factory
from .models import Invoice, InvoiceItem

class InvoiceForm(forms.ModelForm):
    class Meta:
        model = Invoice
        fields = ['client', 'note','discount_percent']

       

class InvoiceItemForm(forms.ModelForm):
    class Meta:
        model = InvoiceItem
        fields = ['service']

InvoiceItemFormSet = inlineformset_factory(
    Invoice, InvoiceItem, form=InvoiceItemForm, extra=1, can_delete=True
)


# forms.py
from django import forms
from .models import Client, Service

class ClientForm(forms.ModelForm):
    class Meta:
        model = Client
        fields = '__all__'

class ServiceForm(forms.ModelForm):
    class Meta:
        model = Service
        fields = '__all__'

from django import forms

class LoginForm(forms.Form):
    identifier = forms.CharField(max_length=150, label="Username / Email / Employee ID")
    password = forms.CharField(widget=forms.PasswordInput, label="Password")



# hr/forms.py
from django import forms
from .models import EmpUpdate

class EmpUpdateForm(forms.ModelForm):
    class Meta:
        model = EmpUpdate
        fields = ['date', 'time', 'work_status']
        widgets = {
            'date': forms.DateInput(attrs={'type': 'date'}),
            'time': forms.TimeInput(attrs={'type': 'time'}),
            'work_status': forms.Textarea(attrs={'rows':3}),
        }



from django import forms
from .models import DailyReport

class DailyReportForm(forms.ModelForm):
    class Meta:
        model = DailyReport
        fields = [
            "project",
            "tasks_completed",
            "tasks_in_progress",
            "issues",
            "plan_for_tomorrow",
            "document",
            "deadline",
        ]
        widgets = {
            "tasks_completed": forms.Textarea(attrs={"rows": 3, "class": "form-control"}),
            "tasks_in_progress": forms.Textarea(attrs={"rows": 3, "class": "form-control"}),
            "issues": forms.Textarea(attrs={"rows": 3, "class": "form-control"}),
            "plan_for_tomorrow": forms.Textarea(attrs={"rows": 3, "class": "form-control"}),
            "document": forms.ClearableFileInput(attrs={"class": "form-control"}),  # ✅ change here
            "project": forms.Select(attrs={"class": "form-control"}),
            "deadline": forms.DateInput(attrs={"type": "date", "class": "form-control"}),
        }