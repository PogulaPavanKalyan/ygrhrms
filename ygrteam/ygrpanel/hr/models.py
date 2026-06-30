from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

from django.contrib.auth.models import BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, username, email=None, password=None, **extra_fields):
        if not username:
            raise ValueError("The Username must be set")
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        extra_fields.setdefault("role", "MD")  

        if extra_fields.get("is_staff") is not True:
            raise ValueError("Superuser must have is_staff=True.")
        if extra_fields.get("is_superuser") is not True:
            raise ValueError("Superuser must have is_superuser=True.")
        return self.create_user(username, email, password, **extra_fields)




from django.contrib.auth.models import AbstractUser
from django.db import models
 
class User(AbstractUser):
    ROLE_CHOICES = [
        ('MD', 'MD'),
        ('HR', 'HR'),
        ('Manager', 'Manager'),
        ('TeamLead', 'Team Lead'),
        ('Employee', 'Employee'),
    ]
    
    DEPARTMENT = [
    ('python_dev', 'Python Developer'),
    ('java_dev', 'Java Developer'),
    ('frontend_dev', 'Front-End Developer'),
    ('backend_dev', 'Back-End Developer'),
    ('fullstack_dev', 'Full Stack Developer'),
    ('testing', 'Testing / QA'),
    ('devops', 'DevOps Engineer'),
    ('data_analyst', 'Data Analyst'),
    ('data_scientist', 'Data Scientist'),
    ('ai_ml', 'AI / ML Engineer'),
    ('cyber_security', 'Cyber Security'),
    ('cloud_engineer', 'Cloud Engineer'),
    ('digital_marketing', 'Digital Marketing'),
    ('ui_ux', 'UI / UX Designer'),
    ('mobile_dev', 'Mobile App Developer'),
]

    GENDER_CHOICES = [
        ('Male', 'Male'),
        ('Female', 'Female'),
        ('Other', 'Other'),
    ]

    objects = UserManager()

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Employee')
    profile_pic = models.ImageField(upload_to='profile_pics/', blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=15, blank=True, null=True)
    salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    emp_id = models.CharField(max_length=20, unique=True, editable=False, blank=True, null=True)
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True, null=True)
    date_of_birth = models.DateField(blank=True, null=True)
    date_of_joining = models.DateField(blank=True, null=True)
    status = models.CharField(max_length=20, default='Fresher')
    experience_years = models.PositiveIntegerField(blank=True, null=True)
    previous_company = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField( max_length=100, choices=DEPARTMENT, default='python_dev' )
    team_name = models.CharField(max_length=100, null=True, blank=True)
    document = models.FileField(upload_to='employee_docs/', blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)
    aadhaar = models.CharField(max_length=12, blank=True, null=True)
    reporting_manager = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subordinates'
    )

    def save(self, *args, **kwargs):
        if not self.emp_id:
            # prefix based on assigned role
            prefix = {
                "MD": "YGRMD",
                "HR": "YGRHR",
                "Manager": "YGRMAN",
                "TeamLead": "YGRTLD",
                "Employee": "YGREMP",
            }.get(self.role, "YGRUSR")

            last_user = User.objects.filter(emp_id__startswith=prefix).order_by('-id').first()
            num = int(last_user.emp_id.replace(prefix, "")) if last_user and last_user.emp_id else 1000
            self.emp_id = f"{prefix}{num + 1}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"



class Project(models.Model):
    project_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=200)
    description = models.TextField()
    startdate = models.DateField(null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)

    # HR â†’ Manager
    assigned_manager = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_projects",
        limit_choices_to={"role": "Manager"}
    )

    # Manager â†’ Team
    assigned_team = models.ForeignKey(
        "Team",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="projects"
    )

    document = models.FileField(
        upload_to="projects/",
        null=True,
        blank=True
    )


    status = models.CharField(
        max_length=20,
        choices=[
            ("Pending", "Pending"),
            ("Assigned to Manager", "Assigned to Manager"),
            ("Assigned to Team", "Assigned to Team"),
            ("Completed", "Completed"),
            ("Rejected", "Rejected"),
        ],
        default="Pending"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project_id} - {self.name}"




from django.conf import settings
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatMessage(models.Model):
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_chats"
    )
    receiver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="received_chats"
    )

    text = models.TextField(blank=True)
    file = models.FileField(upload_to="chat_files/", blank=True, null=True)

    # DELETE LOGIC
    deleted_for = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="hidden_messages",
        blank=True
    )

    deleted_for_everyone = models.BooleanField(default=False)

    deleted_by_user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="deleted_messages_by_user"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    is_read = models.BooleanField(default=False)
    is_delivered = models.BooleanField(default=False)
    
    # Unified chat extensions
    reply_to = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="replies"
    )
    edited = models.BooleanField(default=False)
    reactions = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.sender} → {self.receiver}"


class ChatRoom(models.Model):
    name = models.CharField(max_length=100)
    users = models.ManyToManyField(settings.AUTH_USER_MODEL, blank=True)
    
    # Unified chat extensions
    room_type = models.CharField(
        max_length=20,
        choices=[('channel', 'Channel'), ('team', 'Team')],
        default='channel'
    )
    description = models.TextField(blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    is_announcement_only = models.BooleanField(default=False)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_rooms"
    )
    admins = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name="admin_rooms"
    )
    icon = models.ImageField(upload_to="room_icons/", blank=True, null=True)

    def __str__(self):
        return self.name


class GroupMessage(models.Model):
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    text = models.TextField(blank=True)   # 🔹 allow empty after delete
    is_deleted = models.BooleanField(default=False)

    deleted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="deleted_group_messages"
    )
    

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Unified chat extensions
    reply_to = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="replies"
    )
    edited = models.BooleanField(default=False)
    reactions = models.JSONField(default=dict, blank=True)
    file = models.FileField(upload_to="group_chat_files/", blank=True, null=True)

    def __str__(self):
        return f"{self.sender} in {self.room}"


class UserPresence(models.Model):
    STATUS_CHOICES = [
        ('Online', 'Online'),
        ('Offline', 'Offline'),
        ('Away', 'Away'),
        ('Busy', 'Busy'),
        ('In Meeting', 'In Meeting'),
        ('Working From Home', 'Working From Home')
    ]
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='presence')
    status = models.CharField(max_length=25, choices=STATUS_CHOICES, default='Offline')
    last_activity = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}: {self.status}"


class CompanyAnnouncement(models.Model):
    ANNOUNCEMENT_TYPES = [
        ('Holiday', 'Holiday Notification'),
        ('Payroll', 'Payroll Released'),
        ('Event', 'Company Event'),
        ('Policy', 'Policy Update'),
        ('Birthday', 'Birthday Wish'),
        ('Festival', 'Festival Wish'),
        ('Emergency', 'Emergency Notification'),
        ('General', 'General Announcement')
    ]
    title = models.CharField(max_length=200)
    content = models.TextField()
    announcement_type = models.CharField(max_length=20, choices=ANNOUNCEMENT_TYPES, default='General')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    
 

    # =============invoce====================
from django.db import models
from django.utils import timezone


class Client(models.Model):
    name = models.CharField(max_length=150)
    business_name = models.CharField(max_length=200, blank=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    address = models.TextField()

    def __str__(self):
        return self.name


class Service(models.Model):
    name = models.CharField(max_length=150)
    amount = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.name} - â‚¹{self.amount}"
    

from django.db import models
from decimal import Decimal
# models.py

class Invoice(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    note = models.TextField(blank=True, null=True)

    gst_percent = models.FloatField(default=18)
    discount_percent = models.FloatField(default=0, blank=True, null=True)

    invoice_number = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Auto invoice numbering
        if not self.invoice_number:
            last_invoice = Invoice.objects.order_by('id').last()
            if last_invoice and last_invoice.invoice_number:
                try:
                    last_number = int(last_invoice.invoice_number.split('-')[-1])
                except ValueError:
                    last_number = 0
            else:
                last_number = 0
            self.invoice_number = f"YGR-{last_number+1:04d}"

        super().save(*args, **kwargs)

    # -------------------------------------
    # Required properties for your template
    # -------------------------------------

    @property
    def subtotal(self):
        """Sum of item amounts before discount and GST."""
        return sum(item.amount for item in self.items.all())

    @property
    def discount_amount(self):
        """Discount applied on subtotal."""
        if not self.discount_percent:
            return 0
        return Decimal(self.subtotal) * Decimal(self.discount_percent) / Decimal(100)

    @property
    def gst(self):
        """GST on amount after discount."""
        amount_after_discount = Decimal(self.subtotal) - Decimal(self.discount_amount)
        return amount_after_discount * Decimal(self.gst_percent) / Decimal(100)

    @property
    def grand_total(self):
        """Final invoice amount."""
        amount_after_discount = Decimal(self.subtotal) - Decimal(self.discount_amount)
        return amount_after_discount + Decimal(self.gst)

    def _str_(self):
        return f"Invoice {self.invoice_number}"


class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    service = models.ForeignKey('Service', on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_percent = models.FloatField(default=0, blank=True, null=True  )

    def save(self, *args, **kwargs):
        # Set amount from service if not manually specified
        if not self.amount and self.service:
            self.amount = self.service.amount
        super().save(*args, **kwargs)

    @property
    def gst_amount(self):
        return Decimal(self.amount) * Decimal(self.invoice.gst_percent) / Decimal(100)

    @property
    def total_amount(self):
        return Decimal(self.amount) + self.gst_amount

    def __str__(self):
        return f"{self.service.name} - {self.amount}"
    



    
    # manger models*****************


class Team(models.Model):
    name = models.CharField(max_length=150)

    # ðŸ”‘ Team Lead (User with role='TeamLead')
    lead = models.ForeignKey(
        'User',
        related_name='leading_teams',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        limit_choices_to={'role': 'TeamLead'}
    )

    # ðŸ‘¥ Team Members (Users with role='Employee')
    members = models.ManyToManyField(
        'User',
        related_name='teams',
        blank=True,
        limit_choices_to={'role': 'Employee'}
    )

    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    

class TeamLead(models.Model):
    employee = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'TeamLead'}
    )
    team_name = models.CharField(max_length=100)
    promotion_date = models.DateTimeField(auto_now_add=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.employee.username} - Team Lead"
    

class ProjectWorkUpdate(models.Model):
    project = models.ForeignKey(
        Project,
        related_name='work_updates',
        on_delete=models.CASCADE
    )

    team_lead = models.ForeignKey(
        'User',
        related_name='teamlead_work_updates',
        on_delete=models.CASCADE,
        limit_choices_to={'role': 'TeamLead'}
    )

    work_details = models.TextField()
    file = models.FileField(upload_to="project_updates/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.project.name} - {self.team_lead.username}"



class ManagerProjectSubmission(models.Model):
    manager = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name="submissions_to_hr",
        limit_choices_to={'role': 'Manager'}
    )

    project = models.ForeignKey(
        Project,
        on_delete=models.CASCADE,
        related_name="manager_submissions"
    )

    details = models.TextField()
    file = models.FileField(upload_to="manager_submissions/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.manager.username} â†’ {self.project.title}"



# tl models***********
    
class Task(models.Model):
    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Submitted", "Submitted"),
        ("Completed", "Completed"),
    ]

    task_name = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    start_date = models.DateField()
    end_date = models.DateField()
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    members = models.ManyToManyField(User, blank=True)
    file = models.FileField(upload_to='tasks/', blank=True, null=True)

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pending"
    )

    def __str__(self):
        return self.task_name



    

    
# hr/models.py
from django.db import models
from django.conf import settings

class EmpUpdate(models.Model):
    employee = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="employee_reports"
    )
    team_lead = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tl_reports"
    )
    date = models.DateField()
    time = models.TimeField()
    work_status = models.TextField()




    def __str__(self):
        return f"{self.employee.username} - {self.date}"


from django.db import models
from django.conf import settings
from hr.models import Project

class DailyReport(models.Model):
    # Who submitted the report
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="daily_reports"
    )

    # Project for which the report is submitted
    project = models.ForeignKey(
        Project,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="daily_reports"
    )

    tasks_completed = models.TextField()
    tasks_in_progress = models.TextField(blank=True)
    issues = models.TextField(blank=True)
    plan_for_tomorrow = models.TextField(blank=True)
    document = models.FileField(upload_to='documents/', blank=True, null=True)
    deadline = models.DateField(null=True, blank=True)

    # Recipient role of this report (TeamLead, Manager, HR, etc.)
    recipient_role = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Role to which this report is sent"
    )

    # When the report was submitted
    report_date = models.DateField(auto_now_add=True)

    class Meta:
        ordering = ["-report_date"]

    def __str__(self):
        recipient = self.recipient_role if self.recipient_role else "Unknown"
        return f"{self.user} -> {recipient} ({self.report_date})"



# ------------------leave--section-----
# models.py
# hr/models.py
from django.db import models
from django.conf import settings

class Leave(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    from_date = models.DateField()
    to_date = models.DateField()
    reason = models.TextField()

    LEAVE_TYPES = [
        ('Paid', 'Paid Leave'),
        ('Unpaid', 'Unpaid Leave'),
    ]
    leave_type = models.CharField(max_length=20, choices=LEAVE_TYPES, default='Paid')

    approved_tl = models.BooleanField(default=False)
    approved_manager = models.BooleanField(default=False)
    approved_hr = models.BooleanField(default=False)
    approved_md = models.BooleanField(default=False)

    status = models.CharField(max_length=50, default="Pending TeamLead Approval")
    created_at = models.DateTimeField(auto_now_add=True)
    def __str__(self):
        return f"{self.user.username} - {self.status}"
    
    


from datetime import time
from django.utils import timezone
from django.db import models

class Attendance(models.Model):
    user = models.ForeignKey('User', on_delete=models.CASCADE)
    date = models.DateField(default=timezone.now)
    check_in_time = models.DateTimeField(null=True, blank=True)
    check_out_time = models.DateTimeField(null=True, blank=True)
    check_in_photo = models.ImageField(upload_to='attendance/checkin/', null=True, blank=True)
    check_out_photo = models.ImageField(upload_to='attendance/checkout/', null=True, blank=True)

    total_hours = models.FloatField(null=True, blank=True)
    status = models.CharField(max_length=50, blank=True)
    is_late = models.BooleanField(default=False)
    left_early = models.BooleanField(default=False)
    remarks = models.TextField(blank=True, default='')

    def calculate_status(self):
        office_start = time(9, 30)
        office_end = time(18, 30)

        if self.date.weekday() == 6:  # Sunday
            self.status = "Off Day"
            self.total_hours = 0
            self.is_late = False
            self.left_early = False
        elif self.check_in_time and self.check_out_time:
            hours = (self.check_out_time - self.check_in_time).total_seconds() / 3600
            self.total_hours = round(hours, 2)

            if hours >= 9:
                self.status = "Present"
            elif hours >= 4.5:
                self.status = "Half Day"
            else:
                self.status = "Absent"

            # Late & Early Flags
            self.is_late = self.check_in_time.time() > office_start
            self.left_early = self.check_out_time.time() < office_end

            if self.is_late:
                self.status += " (Late)"
            if self.left_early:
                self.status += " (Left Early)"
        else:
            self.status = "Absent"
            self.total_hours = 0
            self.is_late = False
            self.left_early = False

        self.save()

    def __str__(self):
        return f"{self.employee} - {self.date}"
        
        

# exam user models

# models.py
from django.db import models


# models.py
from django.db import models

SELECT_TYPE = [
    ('python', 'Python'),
    ('java', 'Java'),
    ('testing', 'Testing'),
    ('php', 'PHP'),
    ('react', 'React JS'),
    ('digital_marketing', 'Digital Marketing'),
    ('ui_ux', 'UI/UX'),
    ('flutter', 'Flutter'),
    ('basic_test','basic_test'),
]

class Examuser(models.Model):
    username = models.CharField(max_length=100)
    email = models.EmailField(max_length=50, unique=True)
    phone_no = models.CharField(max_length=15, blank=True, null=True)
    role = models.CharField(max_length=50, choices=SELECT_TYPE)
    password = models.CharField(max_length=100)
    

    def __str__(self):
        return self.username


class Question(models.Model):
  
    language = models.CharField(max_length=20, choices=SELECT_TYPE)
    question_text = models.TextField()
    option_a = models.CharField(max_length=255)
    option_b = models.CharField(max_length=255)
    option_c = models.CharField(max_length=255)
    option_d = models.CharField(max_length=255)
    correct_option = models.CharField(max_length=1)

    def _str_(self):
        return f"{self.language} - {self.question_text[:50]}"


from django.db import models


 

# ---------------- EXAM SESSION MODEL ----------------
class ExamSession(models.Model):
    user = models.ForeignKey(Examuser, on_delete=models.CASCADE)
    language = models.CharField(max_length=20, choices=SELECT_TYPE)

    start_time = models.DateTimeField(auto_now_add=True)
    is_completed = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} - {self.language}"
    
 

# ---------------- USER ANSWER MODEL ----------------
class UserAnswer(models.Model):
    exam = models.ForeignKey(ExamSession, on_delete=models.CASCADE)
    question = models.ForeignKey(Question, on_delete=models.CASCADE)

    selected_option = models.CharField(max_length=1)  # A/B/C/D
    is_correct = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.exam.user.username} - Q{self.question.id}"
    

# ---------------- RESULT MODEL ----------------
class Result(models.Model):
    exam = models.OneToOneField(ExamSession, on_delete=models.CASCADE)

    total_questions = models.IntegerField()
    correct_answers = models.IntegerField()
    score_percentage = models.FloatField()

    completed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.exam.user.username} - Result"


# ==================== PAYSLIP MODULE ====================

MONTH_CHOICES = [
    (1, 'January'), (2, 'February'), (3, 'March'), (4, 'April'),
    (5, 'May'), (6, 'June'), (7, 'July'), (8, 'August'),
    (9, 'September'), (10, 'October'), (11, 'November'), (12, 'December'),
]

class Payslip(models.Model):
    STATUS_CHOICES = [
        ('Draft', 'Draft'),
        ('Generated', 'Generated'),
        ('Pending Approval', 'Pending Approval'),
        ('Approved', 'Approved'),
        ('Paid', 'Paid'),
        ('Cancelled', 'Cancelled'),
    ]

    employee = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='payslips',
        limit_choices_to={'role__in': ['Employee', 'TeamLead', 'Manager']}
    )

    month = models.PositiveSmallIntegerField(choices=MONTH_CHOICES)
    year = models.PositiveIntegerField()

    # Earnings
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    hra = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="HRA")
    transport_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    medical_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    special_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bonus = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Deductions
    pf_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="PF")
    esi_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="ESI")
    professional_tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tds = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name="TDS")
    loan_deduction = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Attendance
    working_days = models.PositiveSmallIntegerField(default=26)
    days_present = models.PositiveSmallIntegerField(default=26)
    days_absent = models.PositiveSmallIntegerField(default=0)
    leaves_taken = models.PositiveSmallIntegerField(default=0)

    # Status & Payment
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')
    payment_date = models.DateField(null=True, blank=True)
    is_published = models.BooleanField(default=False)

    # Optional PDF upload
    payslip_pdf = models.FileField(upload_to='payslips/', null=True, blank=True)

    # Historical copy of details
    employee_name = models.CharField(max_length=150, blank=True, null=True)
    designation = models.CharField(max_length=100, blank=True, null=True)
    department = models.CharField(max_length=100, blank=True, null=True)
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    ifsc_code = models.CharField(max_length=20, blank=True, null=True)
    pan = models.CharField(max_length=20, blank=True, null=True)
    uan = models.CharField(max_length=20, blank=True, null=True)
    aadhaar = models.CharField(max_length=12, blank=True, null=True)

    # Lock status
    is_locked = models.BooleanField(default=False)

    # Automated workflow fields
    loss_of_pay = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    needs_recalculation = models.BooleanField(default=False)
    generated_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='generated_payslips')
    generated_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_payslips')
    approved_at = models.DateTimeField(null=True, blank=True)
    recalculated_by = models.ForeignKey('User', on_delete=models.SET_NULL, null=True, blank=True, related_name='recalculated_payslips')
    recalculated_at = models.DateTimeField(null=True, blank=True)

    # Detailed Attendance Metrics
    unpaid_leave_days = models.PositiveSmallIntegerField(default=0)
    half_days = models.PositiveSmallIntegerField(default=0)
    holidays = models.PositiveSmallIntegerField(default=0)
    week_offs = models.PositiveSmallIntegerField(default=0)
    sandwich_leave_days = models.PositiveSmallIntegerField(default=0, verbose_name="Sandwich Leave Days")

    # Audit
    created_by = models.ForeignKey(
        'User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='payslips_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    notes = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('employee', 'month', 'year')
        ordering = ['-year', '-month']

    @property
    def gross_salary(self):
        from decimal import Decimal
        return (
            self.basic_salary + self.hra + self.transport_allowance +
            self.medical_allowance + self.special_allowance + self.bonus
        )

    @property
    def total_deductions(self):
        return (
            self.pf_deduction + self.esi_deduction + self.professional_tax +
            self.tds + self.loan_deduction + self.other_deductions
        )

    @property
    def net_salary(self):
        from decimal import Decimal
        val = self.gross_salary - self.total_deductions
        return max(val, Decimal('0.00'))

    @property
    def month_name(self):
        import calendar
        return calendar.month_name[self.month]

    def __str__(self):
        return f"{self.employee.get_full_name() or self.employee.username} - {self.month_name} {self.year}"


class PayslipDownloadLog(models.Model):
    payslip = models.ForeignKey(Payslip, on_delete=models.CASCADE, related_name='download_logs')
    downloaded_by = models.ForeignKey('User', on_delete=models.CASCADE)
    downloaded_at = models.DateTimeField(auto_now_add=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)

    def __str__(self):
        return f"{self.downloaded_by.username} downloaded {self.payslip} at {self.downloaded_at}"


class Holiday(models.Model):
    """
    Company Holiday with full approval workflow.
    Only Approved holidays affect payroll and attendance.
    """
    HOLIDAY_TYPE_CHOICES = [
        ('National', 'National Holiday'),
        ('Festival', 'Festival Holiday'),
        ('Company',  'Company Holiday'),
        ('Optional', 'Optional Holiday'),
        ('Regional', 'Regional Holiday'),
    ]
    STATUS_CHOICES = [
        ('Draft',     'Draft'),
        ('Pending',   'Pending Approval'),
        ('Approved',  'Approved'),
        ('Rejected',  'Rejected'),
        ('Cancelled', 'Cancelled'),
    ]

    # Core details
    name         = models.CharField(max_length=150)
    date         = models.DateField()                    # no longer unique – multiple branches allowed
    holiday_type = models.CharField(max_length=20, choices=HOLIDAY_TYPE_CHOICES, default='Company')
    description  = models.TextField(blank=True, null=True)
    branch       = models.CharField(max_length=100, default='All Branches')
    department   = models.CharField(max_length=100, blank=True, null=True,
                                    help_text="Leave blank to apply to all departments")
    year         = models.PositiveSmallIntegerField(blank=True, null=True)

    # Workflow status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Draft')

    # Audit trail
    created_by    = models.ForeignKey('User', related_name='created_holidays',
                                      on_delete=models.SET_NULL, null=True)
    created_at    = models.DateTimeField(auto_now_add=True)

    submitted_by  = models.ForeignKey('User', related_name='submitted_holidays',
                                      on_delete=models.SET_NULL, null=True, blank=True)
    submitted_at  = models.DateTimeField(null=True, blank=True)

    approved_by   = models.ForeignKey('User', related_name='approved_holidays',
                                      on_delete=models.SET_NULL, null=True, blank=True)
    approved_at   = models.DateTimeField(null=True, blank=True)

    rejected_by   = models.ForeignKey('User', related_name='rejected_holidays',
                                      on_delete=models.SET_NULL, null=True, blank=True)
    rejected_at   = models.DateTimeField(null=True, blank=True)

    cancelled_by  = models.ForeignKey('User', related_name='cancelled_holidays',
                                      on_delete=models.SET_NULL, null=True, blank=True)
    cancelled_at  = models.DateTimeField(null=True, blank=True)

    remarks           = models.TextField(blank=True, null=True)
    last_modified_by  = models.ForeignKey('User', related_name='modified_holidays',
                                          on_delete=models.SET_NULL, null=True, blank=True)
    last_modified_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.name} ({self.date}) [{self.status}]"

    @property
    def is_editable_by_hr(self):
        """HR may only edit Draft or Pending holidays."""
        return self.status in ('Draft', 'Pending')

    @property
    def type_color(self):
        """Returns a CSS colour class for the holiday type badge."""
        return {
            'National': 'badge-national',
            'Festival': 'badge-festival',
            'Company':  'badge-company',
            'Optional': 'badge-optional',
            'Regional': 'badge-regional',
        }.get(self.holiday_type, 'badge-company')


class HolidayNotification(models.Model):
    """
    In-app notification generated whenever a holiday changes status.
    """
    NOTIF_TYPE_CHOICES = [
        ('pending',   'Submitted for Approval'),
        ('approved',  'Holiday Approved'),
        ('rejected',  'Holiday Rejected'),
        ('cancelled', 'Holiday Cancelled'),
        ('general',   'General Announcement'),
    ]
    recipient    = models.ForeignKey('User', on_delete=models.CASCADE,
                                     related_name='holiday_notifications')
    holiday      = models.ForeignKey(Holiday, on_delete=models.CASCADE,
                                     related_name='notifications', null=True, blank=True)
    notif_type   = models.CharField(max_length=20, choices=NOTIF_TYPE_CHOICES, default='general')
    message      = models.TextField()
    is_read      = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Notif → {self.recipient.username}: {self.message[:50]}"


class SalaryStructure(models.Model):
    employee = models.OneToOneField('User', on_delete=models.CASCADE, related_name='salary_structure')
    monthly_gross = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Earnings structure (monthly bases)
    basic_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    hra = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    transport_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    medical_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    special_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    bonus = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Deductions settings
    pf_enabled = models.BooleanField(default=True)
    pf_rate = models.DecimalField(max_digits=5, decimal_places=2, default=12.00)  # 12% of Basic
    pf_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)   # flat amount override if non-zero
    
    esi_enabled = models.BooleanField(default=True)
    esi_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.75)   # 0.75% of Gross
    esi_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    pt_enabled = models.BooleanField(default=True)
    pt_amount = models.DecimalField(max_digits=10, decimal_places=2, default=200.00)
    
    tds_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    other_deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Bank & Statutory Details
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    account_number = models.CharField(max_length=50, blank=True, null=True)
    ifsc_code = models.CharField(max_length=20, blank=True, null=True)
    pan = models.CharField(max_length=20, blank=True, null=True)
    uan = models.CharField(max_length=20, blank=True, null=True)
    aadhaar = models.CharField(max_length=12, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Salary Structure - {self.employee.username}"


class PayrollAuditLog(models.Model):
    ACTION_CHOICES = [
        ('GENERATE', 'Payroll Generated'),
        ('REGENERATE', 'Payroll Regenerated'),
        ('LOCK', 'Payslip Locked'),
        ('UNLOCK', 'Payslip Unlocked'),
        ('PAID', 'Salary Marked as Paid'),
        ('EMAIL', 'Payslip Emailed'),
        ('DOWNLOAD', 'Payslip Downloaded'),
    ]
    payslip = models.ForeignKey(Payslip, on_delete=models.CASCADE, related_name='audit_logs', null=True, blank=True)
    performed_by = models.ForeignKey('User', on_delete=models.CASCADE)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    details = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.performed_by.username} - {self.action} - {self.timestamp}"


# ==================== HR COMPANY SETTINGS ====================

class HRSettings(models.Model):
    """
    Company-level HR configuration.
    Only one row should exist (singleton pattern – always use pk=1).
    """
    sandwich_leave_enabled = models.BooleanField(
        default=False,
        verbose_name="Enable Sandwich Leave Policy",
        help_text=(
            "When ON, Weekly Offs and Holidays sandwiched between two consecutive Absent / "
            "Unpaid-Leave days are automatically converted to Absent (Loss of Pay)."
        )
    )

    class Meta:
        verbose_name = "HR Settings"
        verbose_name_plural = "HR Settings"

    @classmethod
    def get_settings(cls):
        """Return (or create) the single settings row."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return "HR Settings"


class AttendanceFinalization(models.Model):
    month = models.PositiveSmallIntegerField(choices=MONTH_CHOICES)
    year = models.PositiveIntegerField()
    is_finalized = models.BooleanField(default=True)
    finalized_by = models.ForeignKey(
        'User', on_delete=models.SET_NULL, null=True, blank=True,
        related_name='finalized_periods'
    )
    finalized_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('month', 'year')
        ordering = ['-year', '-month']

    def __str__(self):
        import calendar
        return f"{calendar.month_name[self.month]} {self.year} - Finalized"


# ==================== ENTERPRISE WEBRTC CALLING & MEETINGS ====================

class CallSession(models.Model):
    CALL_TYPE_CHOICES = [
        ('voice', 'Voice Call'),
        ('video', 'Video Call'),
    ]
    STATUS_CHOICES = [
        ('ringing', 'Ringing'),
        ('active', 'Active'),
        ('ended', 'Ended'),
        ('rejected', 'Rejected'),
        ('missed', 'Missed'),
    ]
    caller = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='initiated_calls')
    receiver = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_calls', null=True, blank=True)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='calls', null=True, blank=True)
    call_type = models.CharField(max_length=10, choices=CALL_TYPE_CHOICES, default='video')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='ringing')
    caller_sdp = models.TextField(blank=True, null=True)
    receiver_sdp = models.TextField(blank=True, null=True)
    caller_ice = models.JSONField(default=list, blank=True)
    receiver_ice = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        if self.room:
            return f"{self.call_type} in {self.room.name} [{self.status}]"
        return f"{self.caller.username} → {self.receiver.username if self.receiver else 'Group'} [{self.status}]"


class ScheduledMeeting(models.Model):
    RECURRENCE_CHOICES = [
        ('none', 'None'),
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
    ]
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    room = models.ForeignKey(ChatRoom, on_delete=models.CASCADE, related_name='scheduled_meetings', null=True, blank=True)
    scheduled_time = models.DateTimeField()
    duration_minutes = models.PositiveIntegerField(default=30)
    creator = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='created_meetings')
    participants = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='invited_meetings')
    recurrence = models.CharField(max_length=10, choices=RECURRENCE_CHOICES, default='none')
    waiting_room_enabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} by {self.creator.username} ({self.scheduled_time})"


from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver(post_save, sender=Attendance)
@receiver(post_delete, sender=Attendance)
def trigger_recalculation_on_attendance_change(sender, instance, **kwargs):
    try:
        from hr.models import Payslip
        date_val = instance.date
        payslips = Payslip.objects.filter(
            employee=instance.user,
            month=date_val.month,
            year=date_val.year
        )
        for payslip in payslips:
            if not payslip.needs_recalculation:
                payslip.needs_recalculation = True
                payslip.save()
    except Exception:
        pass


class AttendanceCorrection(models.Model):
    attendance = models.ForeignKey(Attendance, on_delete=models.CASCADE, related_name='corrections')
    original_check_in = models.DateTimeField(null=True, blank=True)
    original_check_out = models.DateTimeField(null=True, blank=True)
    original_status = models.CharField(max_length=50, blank=True)
    original_total_hours = models.FloatField(null=True, blank=True)
    original_remarks = models.TextField(blank=True, default='')

    new_check_in = models.DateTimeField(null=True, blank=True)
    new_check_out = models.DateTimeField(null=True, blank=True)
    new_status = models.CharField(max_length=50, blank=True)
    new_total_hours = models.FloatField(null=True, blank=True)
    new_remarks = models.TextField(blank=True, default='')

    reason = models.TextField()
    edited_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='edited_corrections')
    status = models.CharField(max_length=20, choices=[
        ('Pending', 'Pending Approval'),
        ('Approved', 'Approved'),
        ('Rejected', 'Rejected')
    ], default='Pending')
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_corrections')
    approved_at = models.DateTimeField(null=True, blank=True)
    md_remarks = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Correction for {self.attendance.user.username} on {self.attendance.date} ({self.status})"