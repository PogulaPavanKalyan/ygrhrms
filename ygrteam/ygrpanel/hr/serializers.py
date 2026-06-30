from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Attendance, Payslip, Task, Project, AttendanceCorrection, Leave, Holiday, SalaryStructure, DailyReport, HRSettings, ChatMessage, ChatRoom, GroupMessage, CallSession, Client, Service, Invoice, InvoiceItem, Question, Examuser, ExamSession, Result

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    reporting_manager_name = serializers.SerializerMethodField()
    department_display = serializers.SerializerMethodField()
    profile_pic_url = serializers.SerializerMethodField()
    team_leader_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id',
            'username',
            'email',
            'first_name',
            'last_name',
            'role',
            'profile_pic',
            'profile_pic_url',
            'emp_id',
            'phone',
            'designation',
            'department',
            'department_display',
            'team_name',
            'address',
            'date_of_birth',
            'gender',
            'salary',
            'date_of_joining',
            'status',
            'experience_years',
            'previous_company',
            'aadhaar',
            'reporting_manager_name',
            'team_leader_name',
        ]

    def get_reporting_manager_name(self, obj):
        if obj.reporting_manager:
            full = f"{obj.reporting_manager.first_name} {obj.reporting_manager.last_name}".strip()
            return full or obj.reporting_manager.username
        return None

    def get_team_leader_name(self, obj):
        from .models import Team
        team = Team.objects.filter(members=obj).first()
        if team and team.lead:
            full = f"{team.lead.first_name} {team.lead.last_name}".strip()
            return full or team.lead.username
        return None

    def get_department_display(self, obj):
        """Return the human-readable label for the department code."""
        return obj.get_department_display() if obj.department else None

    def get_profile_pic_url(self, obj):
        """Return an absolute URL for the profile picture, or None."""
        if not (obj.profile_pic and obj.profile_pic.name):
            return None
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(obj.profile_pic.url)
        # Fallback: return relative URL
        return obj.profile_pic.url

class AttendanceSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id',
            'date',
            'check_in_time',
            'check_out_time',
            'total_hours',
            'status',
            'is_late',
            'left_early',
            'remarks',
            'user',
            'check_in_photo',
            'check_out_photo',
        ]

class ProjectSerializer(serializers.ModelSerializer):
    project_name = serializers.ReadOnlyField(source='name')

    class Meta:
        model = Project
        fields = ['id', 'project_name', 'description']

class TaskSerializer(serializers.ModelSerializer):
    project = ProjectSerializer(read_only=True)
    class Meta:
        model = Task
        fields = [
            'id',
            'task_name',
            'description',
            'start_date',
            'end_date',
            'status',
            'project',
        ]

class PayslipSerializer(serializers.ModelSerializer):
    net_salary = serializers.ReadOnlyField()
    month_name = serializers.ReadOnlyField()

    class Meta:
        model = Payslip
        fields = [
            'id',
            'employee',
            'month',
            'year',
            'basic_salary',
            'hra',
            'transport_allowance',
            'medical_allowance',
            'special_allowance',
            'bonus',
            'pf_deduction',
            'esi_deduction',
            'professional_tax',
            'tds',
            'loan_deduction',
            'other_deductions',
            'working_days',
            'days_present',
            'days_absent',
            'leaves_taken',
            'status',
            'payment_date',
            'is_published',
            'payslip_pdf',
            'employee_name',
            'designation',
            'department',
            'bank_name',
            'account_number',
            'ifsc_code',
            'pan',
            'uan',
            'aadhaar',
            'is_locked',
            'loss_of_pay',
            'needs_recalculation',
            'generated_at',
            'net_salary',
            'month_name',
        ]


class AttendanceCorrectionSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='attendance.user.username')
    date = serializers.ReadOnlyField(source='attendance.date')
    
    class Meta:
        model = AttendanceCorrection
        fields = '__all__'


class LeaveSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    user_full_name = serializers.SerializerMethodField()

    class Meta:
        model = Leave
        fields = '__all__'

    def get_user_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class HolidaySerializer(serializers.ModelSerializer):
    class Meta:
        model = Holiday
        fields = '__all__'


class SalaryStructureSerializer(serializers.ModelSerializer):
    employee_name = serializers.ReadOnlyField(source='employee.username')
    employee_full_name = serializers.SerializerMethodField()

    class Meta:
        model = SalaryStructure
        fields = '__all__'

    def get_employee_full_name(self, obj):
        return obj.employee.get_full_name() or obj.employee.username


class DailyReportSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    user_full_name = serializers.SerializerMethodField()
    project_name = serializers.ReadOnlyField(source='project.name')

    class Meta:
        model = DailyReport
        fields = '__all__'

    def get_user_full_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class HRSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = HRSettings
        fields = '__all__'


class ChatRoomSerializer(serializers.ModelSerializer):
    users = UserSerializer(many=True, read_only=True)
    created_by_name = serializers.ReadOnlyField(source='created_by.username')

    class Meta:
        model = ChatRoom
        fields = '__all__'


class ChatMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.username')
    sender_full_name = serializers.SerializerMethodField()
    receiver_name = serializers.ReadOnlyField(source='receiver.username')
    receiver_full_name = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = '__all__'

    def get_sender_full_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.username

    def get_receiver_full_name(self, obj):
        return obj.receiver.get_full_name() or obj.receiver.username


class GroupMessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.ReadOnlyField(source='sender.username')
    sender_full_name = serializers.SerializerMethodField()

    class Meta:
        model = GroupMessage
        fields = '__all__'

    def get_sender_full_name(self, obj):
        return obj.sender.get_full_name() or obj.sender.username


class CallSessionSerializer(serializers.ModelSerializer):
    caller_name = serializers.ReadOnlyField(source='caller.username')
    caller_full_name = serializers.SerializerMethodField()
    receiver_name = serializers.ReadOnlyField(source='receiver.username')
    receiver_full_name = serializers.SerializerMethodField()

    class Meta:
        model = CallSession
        fields = '__all__'

    def get_caller_full_name(self, obj):
        return obj.caller.get_full_name() or obj.caller.username

    def get_receiver_full_name(self, obj):
        return obj.receiver.get_full_name() or obj.receiver.username


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = '__all__'


class InvoiceItemSerializer(serializers.ModelSerializer):
    service_name = serializers.ReadOnlyField(source='service.name')
    service_amount = serializers.ReadOnlyField(source='service.amount')

    class Meta:
        model = InvoiceItem
        fields = '__all__'


class InvoiceSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='client.name')
    client_business_name = serializers.ReadOnlyField(source='client.business_name')
    items = InvoiceItemSerializer(many=True, read_only=True)
    subtotal = serializers.ReadOnlyField()
    discount_amount = serializers.ReadOnlyField()
    gst = serializers.ReadOnlyField()
    grand_total = serializers.ReadOnlyField()

    class Meta:
        model = Invoice
        fields = '__all__'


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'


class ExamuserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Examuser
        fields = '__all__'


class ExamSessionSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = ExamSession
        fields = '__all__'


class ResultSerializer(serializers.ModelSerializer):
    exam_language = serializers.ReadOnlyField(source='exam.language')
    exam_user_name = serializers.ReadOnlyField(source='exam.user.username')

    class Meta:
        model = Result
        fields = '__all__'












