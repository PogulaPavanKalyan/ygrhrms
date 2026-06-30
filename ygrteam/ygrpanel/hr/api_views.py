from django.utils import timezone
from django.contrib.auth import login, logout, get_user_model
from django.db.models import Q
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import UserSerializer, AttendanceSerializer, TaskSerializer, PayslipSerializer, AttendanceCorrectionSerializer, LeaveSerializer, HolidaySerializer, SalaryStructureSerializer, ProjectSerializer, DailyReportSerializer, HRSettingsSerializer, ChatMessageSerializer, ChatRoomSerializer, GroupMessageSerializer, CallSessionSerializer, ClientSerializer, ServiceSerializer, InvoiceItemSerializer, InvoiceSerializer, QuestionSerializer, ExamuserSerializer, ExamSessionSerializer, ResultSerializer
from .models import Attendance, Team, Task, Payslip, DailyReport, Holiday, Project, Leave, AttendanceCorrection, SalaryStructure, HRSettings, ChatMessage, ChatRoom, GroupMessage, CallSession, Client, Service, Invoice, InvoiceItem, Question, Examuser, ExamSession, Result, UserAnswer

User = get_user_model()

class GetCSRFToken(APIView):
    permission_classes = [AllowAny]

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response({"detail": "CSRF cookie set"}, status=status.HTTP_200_OK)


class LoginAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        identifier = request.data.get("username")
        password = request.data.get("password")
        remember_me = request.data.get("remember_me", False)

        if not identifier or not password:
            return Response(
                {"detail": "Please provide both Username/Email/Employee ID and Password."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user_obj = User.objects.filter(
            Q(emp_id__iexact=identifier) |
            Q(email__iexact=identifier) |
            Q(username__iexact=identifier)
        ).first()

        if user_obj and user_obj.check_password(password):
            if not user_obj.is_active:
                return Response(
                    {"detail": "User account is disabled."},
                    status=status.HTTP_403_FORBIDDEN
                )

            login(request, user_obj)
            
            if not remember_me:
                request.session.set_expiry(0)
            else:
                request.session.set_expiry(1209600)  # 2 weeks

            serializer = UserSerializer(user_obj)
            return Response({
                "user": serializer.data,
                "detail": "Successfully logged in."
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {"detail": "Invalid credentials. Please check your username/password."},
                status=status.HTTP_401_UNAUTHORIZED
            )


from django.views.decorators.csrf import csrf_exempt
from rest_framework.authentication import SessionAuthentication

class CsrfExemptSessionAuthentication(SessionAuthentication):
    def enforce_csrf(self, request):
        return  # Bypass CSRF check in DRF SessionAuthentication

@method_decorator(csrf_exempt, name='dispatch')
class LogoutAPIView(APIView):
    authentication_classes = [CsrfExemptSessionAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)


class CurrentUserAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AttendanceStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        attendance = Attendance.objects.filter(user=request.user, date=today).first()
        if attendance:
            serializer = AttendanceSerializer(attendance)
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(None, status=status.HTTP_200_OK)


class CheckInAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        today = timezone.localdate()
        attendance, created = Attendance.objects.get_or_create(
            user=request.user,
            date=today
        )
        if not attendance.check_in_time:
            attendance.check_in_time = timezone.now()
            attendance.save()
            serializer = AttendanceSerializer(attendance)
            return Response({
                "detail": "Checked in successfully.",
                "attendance": serializer.data
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {"detail": "You have already checked in today."},
                status=status.HTTP_400_BAD_REQUEST
            )


class CheckOutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        today = timezone.localdate()
        attendance = Attendance.objects.filter(user=request.user, date=today).first()
        if not attendance:
            return Response(
                {"detail": "No attendance record found for today. Check in first."},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not attendance.check_out_time:
            attendance.check_out_time = timezone.now()
            attendance.calculate_status()
            attendance.save()
            serializer = AttendanceSerializer(attendance)
            return Response({
                "detail": "Checked out successfully.",
                "attendance": serializer.data
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {"detail": "You have already checked out today."},
                status=status.HTTP_400_BAD_REQUEST
            )


class EmployeeDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "Employee":
            return Response({"detail": "Access Denied: Not an Employee."}, status=status.HTTP_403_FORBIDDEN)
            
        # Get team lead and members
        team = Team.objects.filter(members=user).select_related("lead").prefetch_related("members").first()
        team_lead_data = None
        team_members_data = []
        
        if team:
            if team.lead:
                team_lead_data = {
                    "id": team.lead.id,
                    "name": team.lead.get_full_name() or team.lead.username,
                    "emp_id": team.lead.emp_id,
                }
            for member in team.members.exclude(id=user.id):
                team_members_data.append({
                    "id": member.id,
                    "name": member.get_full_name() or member.username,
                    "emp_id": member.emp_id,
                })
                
        # Tasks
        tasks = Task.objects.filter(members=user)
        tasks_serializer = TaskSerializer(tasks, many=True)
        
        # Latest Payslip
        latest_payslip = Payslip.objects.filter(employee=user, is_published=True).order_by('-year', '-month').first()
        payslip_data = PayslipSerializer(latest_payslip).data if latest_payslip else None
        
        return Response({
            "team_lead": team_lead_data,
            "team_members": team_members_data,
            "tasks": tasks_serializer.data,
            "active_tasks_count": tasks.filter(status="Pending").count(),
            "latest_payslip": payslip_data,
        }, status=status.HTTP_200_OK)


class HRDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "HR":
            return Response({"detail": "Access Denied: Not HR."}, status=status.HTTP_403_FORBIDDEN)
            
        from datetime import date
        manager_count = User.objects.filter(role="Manager").count()
        teamlead_count = User.objects.filter(role="TeamLead").count()
        employee_count = User.objects.filter(role="Employee").count()
        total_users = manager_count + teamlead_count + employee_count
        
        today = date.today()
        today_reports_count = DailyReport.objects.filter(report_date=today).count()
        
        holiday_stats = {
            "all": Holiday.objects.count(),
            "pending": Holiday.objects.filter(status='Pending').count(),
            "approved": Holiday.objects.filter(status='Approved').count(),
        }
        
        return Response({
            "total_users": total_users,
            "manager_count": manager_count,
            "teamlead_count": teamlead_count,
            "employee_count": employee_count,
            "today_reports_count": today_reports_count,
            "holiday_stats": holiday_stats,
        }, status=status.HTTP_200_OK)


class TLDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "TeamLead":
            return Response({"detail": "Access Denied: Not a Team Lead."}, status=status.HTTP_403_FORBIDDEN)
            
        team = Team.objects.filter(lead=user).first()
        
        projects_count = 0
        members_count = 0
        projects_list = []
        upcoming_tasks_data = []
        member_status_list = []
        
        if team:
            members = team.members.all()
            members_count = members.count()
            projects = Project.objects.filter(assigned_team=team)
            projects_count = projects.count()
            projects_list = [{"id": p.id, "project_name": p.name, "description": p.description} for p in projects]
            
            # Upcoming tasks
            upcoming_tasks = Task.objects.filter(
                project__assigned_team=team,
                status__in=['Pending', 'Submitted']
            ).select_related("project").order_by("end_date")[:5]
            
            for t in upcoming_tasks:
                upcoming_tasks_data.append({
                    "id": t.id,
                    "task_name": t.task_name,
                    "project_name": t.project.name if t.project else "General",
                    "end_date": str(t.end_date),
                    "status": t.status,
                })
                
            # Member status
            today = timezone.localdate()
            today_attendances = {
                att.user_id: att for att in Attendance.objects.filter(user__in=members, date=today)
            }
            
            for m in members:
                att = today_attendances.get(m.id)
                check_in = att.check_in_time.strftime("%I:%M %p") if att and att.check_in_time else "—"
                att_status = att.status if att else "Absent"
                
                curr_task = Task.objects.filter(members=m, status__in=["Pending", "Submitted"]).order_by("end_date").first()
                task_name = curr_task.task_name if curr_task else "No Active Task"
                task_status = curr_task.status if curr_task else "—"
                
                member_status_list.append({
                    "id": m.id,
                    "name": m.get_full_name() or m.username,
                    "emp_id": m.emp_id,
                    "check_in": check_in,
                    "attendance_status": att_status,
                    "current_task": task_name,
                    "task_status": task_status
                })
                
        return Response({
            "projects_count": projects_count,
            "members_count": members_count,
            "projects": projects_list,
            "upcoming_tasks": upcoming_tasks_data,
            "member_status_list": member_status_list,
        }, status=status.HTTP_200_OK)


class ManagerDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "Manager":
            return Response({"detail": "Access Denied: Not a Manager."}, status=status.HTTP_403_FORBIDDEN)
            
        manager_projects = Project.objects.filter(assigned_manager=user)
        projects_received = manager_projects.filter(assigned_team__isnull=True).count()
        projects_assigned = manager_projects.filter(assigned_team__isnull=False).count()
        projects_completed = manager_projects.filter(status="Completed").count()
        
        employees_count = User.objects.filter(role='Employee').count()
        team_leads_count = User.objects.filter(role='TeamLead').count()
        teams_count = Team.objects.count()
        
        employee_leave_count = Leave.objects.filter(user__role='Employee', status="Pending Manager Approval").count()
        teamlead_leave_count = Leave.objects.filter(user__role='TeamLead', status="Pending Manager Approval").count()
        
        # Recent reports
        daily_reports = DailyReport.objects.filter(
            project__in=manager_projects
        ).select_related("user", "project").order_by("-report_date")[:6]
        
        reports_data = []
        for r in daily_reports:
            reports_data.append({
                "id": r.id,
                "user_name": r.user.get_full_name() or r.user.username,
                "project_name": r.project.name if r.project else "General",
                "report_date": str(r.report_date),
                "tasks_completed": r.tasks_completed,
            })
            
        return Response({
            "projects_received": projects_received,
            "projects_assigned": projects_assigned,
            "projects_completed": projects_completed,
            "employees_count": employees_count,
            "team_leads_count": team_leads_count,
            "teams_count": teams_count,
            "employee_leave_count": employee_leave_count,
            "teamlead_leave_count": teamlead_leave_count,
            "daily_reports": reports_data,
        }, status=status.HTTP_200_OK)


class MDDashboardAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role != "MD":
            return Response({"detail": "Access Denied: Not MD."}, status=status.HTTP_403_FORBIDDEN)
            
        total_hr = User.objects.filter(role='HR').count()
        total_mr = User.objects.filter(role='Manager').count()
        total_tl = User.objects.filter(role='TeamLead').count()
        total_emp = User.objects.filter(role='Employee').count()
        total_project = Project.objects.count()
        total_cmp = total_hr + total_mr + total_tl + total_emp
        
        holiday_stats = {
            "all": Holiday.objects.count(),
            "pending": Holiday.objects.filter(status='Pending').count(),
            "approved": Holiday.objects.filter(status='Approved').count(),
            "draft": Holiday.objects.filter(status='Draft').count(),
        }
        
        pending_corrections_count = AttendanceCorrection.objects.filter(status='Pending').count()
        
        # Active users list for directory panel
        all_users = User.objects.filter(is_active=True).order_by('role', 'username')
        users_data = []
        for u in all_users:
            users_data.append({
                "id": u.id,
                "username": u.username,
                "name": u.get_full_name() or u.username,
                "role": u.role,
                "emp_id": u.emp_id,
                "department": u.department,
            })
            
        return Response({
            "total_hr": total_hr,
            "total_mr": total_mr,
            "total_tl": total_tl,
            "total_emp": total_emp,
            "total_project": total_project,
            "total_cmp": total_cmp,
            "holiday_stats": holiday_stats,
            "pending_corrections_count": pending_corrections_count,
            "all_users": users_data,
        }, status=status.HTTP_200_OK)


from .views import get_monthly_calendar_data
import datetime
from django.shortcuts import get_object_or_404

class AttendanceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role
        
        target_user_id = request.query_params.get('user_id')
        
        if target_user_id or role == 'Employee':
            if role == 'Employee':
                target_user = user
            else:
                if target_user_id == 'me':
                    target_user = user
                else:
                    target_user = get_object_or_404(User, id=target_user_id)
            
            today = timezone.localdate()
            year = request.query_params.get('year', today.year)
            month = request.query_params.get('month', today.month)
            try:
                year = int(year)
                month = int(month)
            except ValueError:
                year = today.year
                month = today.month
                
            days_data, padding, stats = get_monthly_calendar_data(target_user, year, month)
            
            formatted_days = []
            for day in days_data:
                d_dict = day.copy()
                if 'date' in d_dict and d_dict['date']:
                    d_dict['date'] = str(d_dict['date'])
                formatted_days.append(d_dict)
                
            history_records = Attendance.objects.filter(user=target_user).order_by('-date')
            q_month = request.query_params.get('q_month')
            q_year = request.query_params.get('q_year')
            if q_month:
                history_records = history_records.filter(date__month=q_month)
            if q_year:
                history_records = history_records.filter(date__year=q_year)
                
            history_serializer = AttendanceSerializer(history_records[:31], many=True)
            
            return Response({
                "days_data": formatted_days,
                "padding": padding,
                "stats": stats,
                "history": history_serializer.data,
            }, status=status.HTTP_200_OK)
            
        else:
            query = request.query_params.get('q', '')
            selected_date = request.query_params.get('date', '')
            
            if role == 'TeamLead':
                records = Attendance.objects.filter(
                    Q(user=user) | Q(user__reporting_manager=user)
                ).select_related('user')
            elif role == 'Manager':
                subordinates = User.objects.filter(
                    Q(reporting_manager=user) |
                    Q(reporting_manager__reporting_manager=user) |
                    Q(teams__lead__reporting_manager=user)
                ).distinct()
                records = Attendance.objects.filter(
                    Q(user=user) | Q(user__in=subordinates)
                ).select_related('user')
            elif role in ['HR', 'MD']:
                records = Attendance.objects.select_related('user')
            else:
                records = Attendance.objects.none()
                
            if query:
                records = records.filter(
                    Q(user__username__icontains=query) |
                    Q(user__first_name__icontains=query) |
                    Q(user__last_name__icontains=query) |
                    Q(user__emp_id__icontains=query)
                )
            if selected_date:
                records = records.filter(date=selected_date)
                
            records = records.order_by('-date')[:50]
            
            serializer = AttendanceSerializer(records, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)


class AttendanceCorrectionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role
        
        if role in ['HR', 'MD']:
            corrections = AttendanceCorrection.objects.all().order_by('-created_at')
        else:
            corrections = AttendanceCorrection.objects.filter(attendance__user=user).order_by('-created_at')
            
        serializer = AttendanceCorrectionSerializer(corrections, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        attendance_id = request.data.get('attendance_id')
        attendance = get_object_or_404(Attendance, id=attendance_id)
        
        if attendance.user != user and user.role not in ['HR', 'MD']:
            return Response({"detail": "Not authorized to correct this attendance."}, status=status.HTTP_403_FORBIDDEN)
            
        new_check_in_str = request.data.get('new_check_in')
        new_check_out_str = request.data.get('new_check_out')
        reason = request.data.get('reason', '')
        
        if not new_check_in_str or not new_check_out_str or not reason:
            return Response({"detail": "Missing fields: new_check_in, new_check_out, and reason are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            if len(new_check_in_str.split(':')) == 2:
                new_check_in_str += ":00"
            if len(new_check_out_str.split(':')) == 2:
                new_check_out_str += ":00"
                
            check_in_time = datetime.datetime.strptime(f"{attendance.date} {new_check_in_str}", "%Y-%m-%d %H:%M:%S")
            check_out_time = datetime.datetime.strptime(f"{attendance.date} {new_check_out_str}", "%Y-%m-%d %H:%M:%S")
            
            check_in_time = timezone.make_aware(check_in_time)
            check_out_time = timezone.make_aware(check_out_time)
        except ValueError:
            return Response({"detail": "Invalid time format. Use HH:MM or HH:MM:SS."}, status=status.HTTP_400_BAD_REQUEST)
            
        correction = AttendanceCorrection.objects.create(
            attendance=attendance,
            original_check_in=attendance.check_in_time,
            original_check_out=attendance.check_out_time,
            original_status=attendance.status,
            original_total_hours=attendance.total_hours,
            original_remarks=attendance.remarks,
            new_check_in=check_in_time,
            new_check_out=check_out_time,
            new_status="Present",
            reason=reason,
            edited_by=user,
            status="Pending",
        )
        
        serializer = AttendanceCorrectionSerializer(correction)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AttendanceCorrectionActionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        if user.role not in ['HR', 'MD']:
            return Response({"detail": "Access Denied: Only HR or MD can perform this action."}, status=status.HTTP_403_FORBIDDEN)
            
        correction = get_object_or_404(AttendanceCorrection, id=pk)
        action = request.data.get('action')
        md_remarks = request.data.get('md_remarks', '')
        
        if action == 'approve':
            attendance = correction.attendance
            attendance.check_in_time = correction.new_check_in
            attendance.check_out_time = correction.new_check_out
            attendance.status = "Present"
            
            if attendance.check_in_time and attendance.check_out_time:
                delta = attendance.check_out_time - attendance.check_in_time
                attendance.total_hours = round(delta.total_seconds() / 3600.0, 2)
            else:
                attendance.total_hours = 0
                
            attendance.remarks = f"Corrected and approved by {user.username}."
            attendance.save()
            
            correction.status = 'Approved'
            correction.approved_by = user
            correction.approved_at = timezone.now()
            correction.md_remarks = md_remarks
            correction.save()
            
            return Response({"detail": "Attendance correction approved successfully."}, status=status.HTTP_200_OK)
            
        elif action == 'reject':
            correction.status = 'Rejected'
            correction.approved_by = user
            correction.approved_at = timezone.now()
            correction.md_remarks = md_remarks
            correction.save()
            return Response({"detail": "Attendance correction rejected."}, status=status.HTTP_200_OK)
            
        else:
            return Response({"detail": "Invalid action. Must be 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)


class LeaveAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role
        
        q_status = request.query_params.get('status', '')
        
        if role == 'Employee':
            leaves = Leave.objects.filter(user=user)
        elif role == 'TeamLead':
            leaves = Leave.objects.filter(Q(user=user) | Q(user__reporting_manager=user))
        elif role == 'Manager':
            subordinates = User.objects.filter(reporting_manager=user)
            leaves = Leave.objects.filter(Q(user=user) | Q(user__in=subordinates))
        elif role in ['HR', 'MD']:
            leaves = Leave.objects.all()
        else:
            leaves = Leave.objects.none()
            
        if q_status:
            leaves = leaves.filter(status=q_status)
            
        leaves = leaves.order_by('-created_at')
        
        approved_leaves_count = Leave.objects.filter(user=user, status='Approved').count()
        leave_balance = 24 - approved_leaves_count
        
        serializer = LeaveSerializer(leaves, many=True)
        return Response({
            "leaves": serializer.data,
            "leave_balance": leave_balance,
            "approved_count": approved_leaves_count,
        }, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        from_date = request.data.get('from_date')
        to_date = request.data.get('to_date')
        reason = request.data.get('reason')
        leave_type = request.data.get('leave_type', 'Paid')
        
        if not from_date or not to_date or not reason:
            return Response({"detail": "Missing fields: from_date, to_date, and reason are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        leave = Leave.objects.create(
            user=user,
            from_date=from_date,
            to_date=to_date,
            reason=reason,
            leave_type=leave_type,
            status="Pending TeamLead Approval",
        )
        
        serializer = LeaveSerializer(leave)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class LeaveActionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user = request.user
        role = user.role
        leave = get_object_or_404(Leave, id=pk)
        action = request.data.get('action')
        
        if leave.status in ["Rejected", "Approved"]:
            return Response({"detail": "Leave request has already been finalized."}, status=status.HTTP_400_BAD_REQUEST)
            
        if action == 'reject':
            leave.status = "Rejected"
            leave.save()
            return Response({"detail": "Leave request rejected successfully."}, status=status.HTTP_200_OK)
            
        elif action == 'approve':
            if role == "TeamLead":
                leave.approved_tl = True
                leave.status = "Pending Manager Approval"
            elif role == "Manager":
                leave.approved_manager = True
                leave.status = "Pending HR Approval"
            elif role == "HR":
                leave.approved_hr = True
                leave.status = "Pending MD Approval"
            elif role == "MD":
                leave.approved_md = True
                leave.status = "Approved"
            else:
                return Response({"detail": "Not authorized to approve leaves."}, status=status.HTTP_403_FORBIDDEN)
                
            leave.save()
            return Response({"detail": f"Leave request approved. Current status: {leave.status}."}, status=status.HTTP_200_OK)
            
        else:
            return Response({"detail": "Invalid action. Use 'approve' or 'reject'."}, status=status.HTTP_400_BAD_REQUEST)


class HolidayAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        holidays = Holiday.objects.all().order_by('date')
        serializer = HolidaySerializer(holidays, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        if user.role not in ['HR', 'MD']:
            return Response({"detail": "Access Denied: Only HR or MD can create holidays."}, status=status.HTTP_403_FORBIDDEN)
            
        name = request.data.get('name')
        date = request.data.get('date')
        department = request.data.get('department', '')
        
        if not name or not date:
            return Response({"detail": "Name and date are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        holiday = Holiday.objects.create(
            name=name,
            date=date,
            department=department,
            status="Approved"
        )
        serializer = HolidaySerializer(holiday)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def delete(self, request, pk):
        user = request.user
        if user.role not in ['HR', 'MD']:
            return Response({"detail": "Access Denied: Only HR or MD can delete holidays."}, status=status.HTTP_403_FORBIDDEN)
            
        holiday = get_object_or_404(Holiday, id=pk)
        holiday.delete()
        return Response({"detail": "Holiday deleted successfully."}, status=status.HTTP_200_OK)


from .views import generate_payslip_pdf_file
from decimal import Decimal

class PayslipAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role
        
        search = request.query_params.get('search', '')
        filter_month = request.query_params.get('month', '')
        filter_year = request.query_params.get('year', '')
        filter_status = request.query_params.get('status', '')
        target_user_id = request.query_params.get('user_id', '')
        
        if role == 'Employee':
            payslips = Payslip.objects.filter(employee=user, is_published=True)
        elif role in ['HR', 'MD', 'Manager']:
            payslips = Payslip.objects.all().select_related('employee')
            if role == 'Manager':
                managed_user_ids = User.objects.filter(
                    Q(reporting_manager=user) | Q(teams__lead=user)
                ).values_list('id', flat=True).distinct()
                payslips = payslips.filter(employee_id__in=managed_user_ids)
        else:
            payslips = Payslip.objects.none()
            
        if target_user_id:
            payslips = payslips.filter(employee_id=target_user_id)
        if search:
            payslips = payslips.filter(
                Q(employee_name__icontains=search) |
                Q(employee__first_name__icontains=search) |
                Q(employee__username__icontains=search) |
                Q(employee__emp_id__icontains=search)
            )
        if filter_month:
            payslips = payslips.filter(month=filter_month)
        if filter_year:
            payslips = payslips.filter(year=filter_year)
        if filter_status:
            payslips = payslips.filter(status=filter_status)
            
        payslips = payslips.order_by('-year', '-month')
        
        serializer = PayslipSerializer(payslips, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        if user.role not in ['HR', 'MD']:
            return Response({"detail": "Access Denied: Only HR or MD can generate payslips."}, status=status.HTTP_403_FORBIDDEN)
            
        emp_id = request.data.get('employee')
        month = request.data.get('month')
        year = request.data.get('year')
        employee = get_object_or_404(User, id=emp_id)
        
        if Payslip.objects.filter(employee=employee, month=month, year=year).exists():
            return Response({"detail": f"Payslip for this employee for {month}/{year} already exists."}, status=status.HTTP_400_BAD_REQUEST)
            
        payslip = Payslip(
            employee=employee,
            month=int(month),
            year=int(year),
            basic_salary=Decimal(request.data.get('basic_salary') or 0),
            hra=Decimal(request.data.get('hra') or 0),
            transport_allowance=Decimal(request.data.get('transport_allowance') or 0),
            medical_allowance=Decimal(request.data.get('medical_allowance') or 0),
            special_allowance=Decimal(request.data.get('special_allowance') or 0),
            bonus=Decimal(request.data.get('bonus') or 0),
            pf_deduction=Decimal(request.data.get('pf_deduction') or 0),
            esi_deduction=Decimal(request.data.get('esi_deduction') or 0),
            professional_tax=Decimal(request.data.get('professional_tax') or 0),
            tds=Decimal(request.data.get('tds') or 0),
            loan_deduction=Decimal(request.data.get('loan_deduction') or 0),
            other_deductions=Decimal(request.data.get('other_deductions') or 0),
            working_days=int(request.data.get('working_days') or 26),
            days_present=int(request.data.get('days_present') or 26),
            days_absent=int(request.data.get('days_absent') or 0),
            leaves_taken=int(request.data.get('leaves_taken') or 0),
            status=request.data.get('status', 'Pending'),
            payment_date=request.data.get('payment_date') or None,
            is_published=request.data.get('is_published') == True,
            notes=request.data.get('notes', ''),
            created_by=user,
        )
        
        payslip.employee_name = employee.get_full_name() or employee.username
        payslip.designation = employee.role
        payslip.department = employee.get_department_display() or employee.department
        
        try:
            struct = employee.salary_structure
            payslip.bank_name = struct.bank_name
            payslip.account_number = struct.account_number
            payslip.ifsc_code = struct.ifsc_code
            payslip.pan = struct.pan
            payslip.uan = struct.uan
            payslip.aadhaar = struct.aadhaar
        except SalaryStructure.DoesNotExist:
            pass
            
        payslip.save()
        generate_payslip_pdf_file(payslip)
        payslip.save()
        
        serializer = PayslipSerializer(payslip)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PayslipDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        payslip = get_object_or_404(Payslip, pk=pk)
        if request.user.role not in ('HR', 'MD') and payslip.employee != request.user:
            return Response({"detail": "Not authorized."}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = PayslipSerializer(payslip)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        if request.user.role not in ['HR', 'MD']:
            return Response({"detail": "Access Denied: Only HR or MD can delete payslips."}, status=status.HTTP_403_FORBIDDEN)
            
        payslip = get_object_or_404(Payslip, pk=pk)
        payslip.delete()
        return Response({"detail": "Payslip deleted successfully."}, status=status.HTTP_200_OK)


class SalaryStructureAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role
        
        if role in ['HR', 'MD']:
            structures = SalaryStructure.objects.all().select_related('employee')
        else:
            structures = SalaryStructure.objects.filter(employee=user)
            
        serializer = SalaryStructureSerializer(structures, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        if user.role not in ['HR', 'MD']:
            return Response({"detail": "Access Denied: Only HR or MD can edit salary structures."}, status=status.HTTP_403_FORBIDDEN)
            
        emp_id = request.data.get('employee')
        employee = get_object_or_404(User, id=emp_id)
        
        structure, created = SalaryStructure.objects.get_or_create(employee=employee)
        
        for field in ['monthly_gross', 'basic_salary', 'hra', 'transport_allowance', 'medical_allowance', 
                      'special_allowance', 'bonus', 'pf_enabled', 'pf_rate', 'pf_amount', 'esi_enabled', 
                      'esi_rate', 'esi_amount', 'pt_enabled', 'pt_amount', 'tds_amount', 'other_deductions',
                      'bank_name', 'account_number', 'ifsc_code', 'pan', 'uan', 'aadhaar']:
            if field in request.data:
                val = request.data[field]
                if field in ['pf_enabled', 'esi_enabled', 'pt_enabled']:
                    val = val == True
                setattr(structure, field, val)
                
        structure.save()
        serializer = SalaryStructureSerializer(structure)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProjectAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role
        
        if role == 'Employee':
            projects = Project.objects.filter(assigned_team__members=user)
        elif role == 'TeamLead':
            projects = Project.objects.filter(assigned_team__lead=user)
        elif role == 'Manager':
            projects = Project.objects.filter(assigned_manager=user)
        elif role in ['HR', 'MD']:
            projects = Project.objects.all()
        else:
            projects = Project.objects.none()
            
        projects = projects.distinct().order_by('project_name')
        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        if user.role not in ['Manager', 'HR', 'MD']:
            return Response({"detail": "Access Denied: Only Manager, HR, or MD can create projects."}, status=status.HTTP_403_FORBIDDEN)
            
        name = request.data.get('project_name')
        description = request.data.get('description', '')
        
        if not name:
            return Response({"detail": "Project name is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        project = Project.objects.create(
            project_name=name,
            description=description,
            assigned_manager=user if user.role == 'Manager' else None
        )
        
        serializer = ProjectSerializer(project)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TaskAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role
        
        status_filter = request.query_params.get('status', '')
        project_id = request.query_params.get('project_id', '')
        
        if role == 'Employee':
            tasks = Task.objects.filter(members=user)
        elif role == 'TeamLead':
            tasks = Task.objects.filter(project__assigned_team__lead=user)
        elif role == 'Manager':
            tasks = Task.objects.filter(project__assigned_manager=user)
        elif role in ['HR', 'MD']:
            tasks = Task.objects.all()
        else:
            tasks = Task.objects.none()
            
        if status_filter:
            tasks = tasks.filter(status=status_filter)
        if project_id:
            tasks = tasks.filter(project_id=project_id)
            
        tasks = tasks.distinct().order_by('-end_date')
        
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        if user.role not in ['TeamLead', 'Manager', 'HR', 'MD']:
            return Response({"detail": "Access Denied: Only Team Leads, Managers, HR, or MD can assign tasks."}, status=status.HTTP_403_FORBIDDEN)
            
        task_name = request.data.get('task_name')
        description = request.data.get('description', '')
        project_id = request.data.get('project')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        member_ids = request.data.get('members', [])
        
        if not task_name or not project_id:
            return Response({"detail": "Task name and Project are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        project = get_object_or_404(Project, id=project_id)
        
        task = Task.objects.create(
            task_name=task_name,
            description=description,
            project=project,
            start_date=start_date or timezone.localdate(),
            end_date=end_date or timezone.localdate(),
            status='Pending'
        )
        
        if member_ids:
            members = User.objects.filter(id__in=member_ids)
            task.members.set(members)
            
        task.save()
        serializer = TaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class TaskDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        task = get_object_or_404(Task, id=pk)
        
        user = request.user
        if user.role == 'Employee' and not task.members.filter(id=user.id).exists():
            return Response({"detail": "Not authorized to view this task."}, status=status.HTTP_403_FORBIDDEN)
            
        serializer = TaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, pk):
        user = request.user
        task = get_object_or_404(Task, id=pk)
        
        new_status = request.data.get('status')
        remarks = request.data.get('remarks', '')
        
        is_assigned_member = task.members.filter(id=user.id).exists()
        is_lead = user.role in ['TeamLead', 'Manager', 'HR', 'MD']
        
        if not is_assigned_member and not is_lead:
            return Response({"detail": "Not authorized to edit this task."}, status=status.HTTP_403_FORBIDDEN)
            
        if new_status:
            task.status = new_status
            
        if 'file' in request.FILES:
            task.file = request.FILES['file']
            
        task.save()
        serializer = TaskSerializer(task)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DailyReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role
        
        if role == 'Employee':
            reports = DailyReport.objects.filter(user=user)
        elif role == 'TeamLead':
            members = User.objects.filter(reporting_manager=user)
            reports = DailyReport.objects.filter(Q(user=user) | Q(user__in=members))
        elif role == 'Manager':
            projects = Project.objects.filter(assigned_manager=user)
            reports = DailyReport.objects.filter(project__in=projects)
        elif role in ['HR', 'MD']:
            reports = DailyReport.objects.all()
        else:
            reports = DailyReport.objects.none()
            
        reports = reports.select_related('user', 'project').order_by('-report_date', '-id')[:50]
        
        serializer = DailyReportSerializer(reports, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        project_id = request.data.get('project')
        tasks_completed = request.data.get('tasks_completed')
        tasks_in_progress = request.data.get('tasks_in_progress', '')
        issues = request.data.get('issues', '')
        plan_for_tomorrow = request.data.get('plan_for_tomorrow', '')
        
        if not tasks_completed:
            return Response({"detail": "Tasks completed description is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        project = None
        if project_id:
            project = get_object_or_404(Project, id=project_id)
            
        report = DailyReport.objects.create(
            user=user,
            project=project,
            tasks_completed=tasks_completed,
            tasks_in_progress=tasks_in_progress,
            issues=issues,
            plan_for_tomorrow=plan_for_tomorrow,
            report_date=timezone.localdate()
        )
        
        serializer = DailyReportSerializer(report)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UserProfileAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils import timezone
        import calendar

        user = request.user
        user_data = UserSerializer(user, context={'request': request}).data

        # ── Attendance summary (current month by default, or ?month=YYYY-MM) ──
        month_param = request.GET.get('month')
        if month_param:
            try:
                year, month = map(int, month_param.split('-'))
            except (ValueError, AttributeError):
                year, month = timezone.now().year, timezone.now().month
        else:
            year, month = timezone.now().year, timezone.now().month

        total_days = calendar.monthrange(year, month)[1]
        month_attendances = Attendance.objects.filter(
            user=user,
            date__year=year,
            date__month=month,
        )
        present_days = month_attendances.filter(status__icontains='Present').count()
        absent_days = month_attendances.filter(status__icontains='Absent').count()
        pct = round((present_days / total_days) * 100) if total_days > 0 else 0

        attendance_summary = {
            'total_days': total_days,
            'present_days': present_days,
            'absent_days': absent_days,
            'percentage': pct,
        }

        # ── Leave summary (this year) ──
        this_year = timezone.now().year
        leaves_qs = Leave.objects.filter(user=user, from_date__year=this_year)
        leave_summary = {
            'approved': leaves_qs.filter(status__icontains='Approved').count(),
            'pending': leaves_qs.filter(status__icontains='Pending').count(),
            'rejected': leaves_qs.filter(status__icontains='Rejected').count(),
        }

        # ── Projects ── (member OR team lead)
        from django.db.models import Q as _Q
        projects_qs = Project.objects.filter(
            _Q(assigned_team__members=user) | _Q(assigned_team__lead=user)
        ).distinct()
        projects = []
        for p in projects_qs:
            lead_name = '—'
            if p.assigned_team and hasattr(p.assigned_team, 'lead') and p.assigned_team.lead:
                lead = p.assigned_team.lead
                lead_name = f"{lead.first_name} {lead.last_name}".strip() or lead.username
            projects.append({
                'name': p.name,
                'status': p.status,
                'team_lead': lead_name,
            })

        # ── Salary structure secure fields ──
        salary_structure = {}
        try:
            ss = user.salary_structure
            salary_structure = {
                'has_pan': bool(ss.pan),
                'has_uan': bool(ss.uan),
                'bank_name': ss.bank_name or '—',
                'has_account_number': bool(ss.account_number),
                'ifsc_code': ss.ifsc_code or '—',
                'has_aadhaar': bool(ss.aadhaar),
                'monthly_gross': float(ss.monthly_gross) if ss.monthly_gross else None,
                'basic_salary': float(ss.basic_salary) if ss.basic_salary else None,
            }
        except Exception:
            salary_structure = {
                'has_pan': False,
                'has_uan': False,
                'bank_name': '—',
                'has_account_number': False,
                'ifsc_code': '—',
                'has_aadhaar': False,
                'monthly_gross': None,
                'basic_salary': None,
            }

        return Response({
            'user': user_data,
            'attendance': attendance_summary,
            'leave_summary': leave_summary,
            'projects': projects,
            'salary_structure': salary_structure,
        }, status=status.HTTP_200_OK)

    def put(self, request):
        user = request.user
        
        if request.data.get('remove_profile_pic') == 'true':
            if user.profile_pic:
                user.profile_pic.delete(save=False)
                user.profile_pic = None
        elif 'profile_pic' in request.FILES:
            user.profile_pic = request.FILES['profile_pic']
            
        for field in ['first_name', 'email', 'phone', 'address', 'date_of_birth', 'gender']:
            if field in request.data:
                setattr(user, field, request.data[field])
                
        user.save()
        serializer = UserSerializer(user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class HRSettingsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings = HRSettings.get_settings()
        serializer = HRSettingsSerializer(settings)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        user = request.user
        if user.role not in ['HR', 'MD']:
            return Response({"detail": "Access Denied: Only HR or MD can update settings."}, status=status.HTTP_403_FORBIDDEN)
            
        settings = HRSettings.get_settings()
        
        if 'sandwich_leave_enabled' in request.data:
            settings.sandwich_leave_enabled = request.data['sandwich_leave_enabled'] == True
            
        settings.save()
        serializer = HRSettingsSerializer(settings)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ChatRoomAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rooms = ChatRoom.objects.filter(users=request.user)
        serializer = ChatRoomSerializer(rooms, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        name = request.data.get('name')
        room_type = request.data.get('room_type', 'channel')
        description = request.data.get('description', '')
        user_ids = request.data.get('users', [])
        
        if not name:
            return Response({"detail": "Room name is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        room = ChatRoom.objects.create(
            name=name,
            room_type=room_type,
            description=description,
            created_by=request.user
        )
        room.users.add(request.user)
        if user_ids:
            room.users.add(*User.objects.filter(id__in=user_ids))
            
        room.save()
        serializer = ChatRoomSerializer(room)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ChatMessageAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        peer_id = request.query_params.get('peer_id')
        
        if not peer_id:
            return Response({"detail": "peer_id query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        peer = get_object_or_404(User, id=peer_id)
        
        messages = ChatMessage.objects.filter(
            (Q(sender=user) & Q(receiver=peer)) |
            (Q(sender=peer) & Q(receiver=user))
        ).exclude(deleted_for=user).order_by('created_at')
        
        messages.filter(receiver=user).update(is_read=True)
        
        serializer = ChatMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        receiver_id = request.data.get('receiver')
        text = request.data.get('text', '')
        
        if not receiver_id:
            return Response({"detail": "receiver field is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        receiver = get_object_or_404(User, id=receiver_id)
        
        msg = ChatMessage.objects.create(
            sender=user,
            receiver=receiver,
            text=text
        )
        if 'file' in request.FILES:
            msg.file = request.FILES['file']
            msg.save()
            
        serializer = ChatMessageSerializer(msg)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class GroupMessageAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        room_id = request.query_params.get('room_id')
        if not room_id:
            return Response({"detail": "room_id query parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        room = get_object_or_404(ChatRoom, id=room_id)
        if not room.users.filter(id=request.user.id).exists():
            return Response({"detail": "Access Denied: Not a member of this chatroom."}, status=status.HTTP_403_FORBIDDEN)
            
        messages = GroupMessage.objects.filter(room=room).order_by('created_at')
        serializer = GroupMessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        room_id = request.data.get('room_id')
        text = request.data.get('text', '')
        
        if not room_id:
            return Response({"detail": "room_id field is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        room = get_object_or_404(ChatRoom, id=room_id)
        if not room.users.filter(id=request.user.id).exists():
            return Response({"detail": "Access Denied: Not a member of this chatroom."}, status=status.HTTP_403_FORBIDDEN)
            
        msg = GroupMessage.objects.create(
            room=room,
            sender=request.user,
            text=text
        )
        if 'file' in request.FILES:
            msg.file = request.FILES['file']
            msg.save()
            
        serializer = GroupMessageSerializer(msg)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CallSessionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        calls = CallSession.objects.filter(
            Q(caller=request.user) | Q(receiver=request.user)
        ).order_by('-created_at')[:30]
        
        serializer = CallSessionSerializer(calls, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        caller = request.user
        receiver_id = request.data.get('receiver')
        call_type = request.data.get('call_type', 'video')
        
        if not receiver_id:
            return Response({"detail": "receiver field is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        receiver = get_object_or_404(User, id=receiver_id)
        
        CallSession.objects.filter(caller=caller, status__in=['ringing', 'active']).update(status='ended', ended_at=timezone.now())
        
        session = CallSession.objects.create(
            caller=caller,
            receiver=receiver,
            call_type=call_type,
            status='ringing'
        )
        
        serializer = CallSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class CallSessionActionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        session = get_object_or_404(CallSession, id=pk)
        action = request.data.get('action')
        
        if action == 'accept':
            session.status = 'active'
            session.started_at = timezone.now()
        elif action == 'reject':
            session.status = 'rejected'
            session.ended_at = timezone.now()
        elif action == 'end':
            session.status = 'ended'
            session.ended_at = timezone.now()
        else:
            return Response({"detail": "Invalid action. Use accept, reject, or end."}, status=status.HTTP_400_BAD_REQUEST)
            
        session.save()
        serializer = CallSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_200_OK)


class InvoiceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        invoices = Invoice.objects.all().prefetch_related('items__service', 'client').order_by('-created_at')
        serializer = InvoiceSerializer(invoices, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        if user.role not in ['HR', 'MD']:
            return Response({"detail": "Access Denied: Only HR or MD can create invoices."}, status=status.HTTP_403_FORBIDDEN)
            
        client_id = request.data.get('client')
        gst_percent = request.data.get('gst_percent', 18)
        discount_percent = request.data.get('discount_percent', 0)
        note = request.data.get('note', '')
        items_data = request.data.get('items', [])
        
        if not client_id or not items_data:
            return Response({"detail": "Client and items are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        client = get_object_or_404(Client, id=client_id)
        
        invoice = Invoice.objects.create(
            client=client,
            gst_percent=float(gst_percent),
            discount_percent=float(discount_percent),
            note=note
        )
        
        for item in items_data:
            service_id = item.get('service')
            amount = item.get('amount')
            disc = item.get('discount_percent', 0)
            
            service = get_object_or_404(Service, id=service_id)
            InvoiceItem.objects.create(
                invoice=invoice,
                service=service,
                amount=Decimal(amount) if amount else service.amount,
                discount_percent=float(disc) if disc else 0
            )
            
        serializer = InvoiceSerializer(invoice)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class InvoiceDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        invoice = get_object_or_404(Invoice, id=pk)
        serializer = InvoiceSerializer(invoice)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        user = request.user
        if user.role not in ['HR', 'MD']:
            return Response({"detail": "Access Denied: Only HR or MD can delete invoices."}, status=status.HTTP_403_FORBIDDEN)
            
        invoice = get_object_or_404(Invoice, id=pk)
        invoice.delete()
        return Response({"detail": "Invoice deleted successfully."}, status=status.HTTP_200_OK)


class ClientServiceAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        clients = Client.objects.all().order_by('name')
        services = Service.objects.all().order_by('name')
        
        return Response({
            "clients": ClientSerializer(clients, many=True).data,
            "services": ServiceSerializer(services, many=True).data
        }, status=status.HTTP_200_OK)


class QuestionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        language = request.query_params.get('language')
        if language:
            questions = Question.objects.filter(language=language)
        else:
            questions = Question.objects.all()
            
        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        user = request.user
        if user.role not in ['HR', 'MD']:
            return Response({"detail": "Access Denied: Only HR or MD can manage questions."}, status=status.HTTP_403_FORBIDDEN)
            
        language = request.data.get('language')
        question_text = request.data.get('question_text')
        option_a = request.data.get('option_a')
        option_b = request.data.get('option_b')
        option_c = request.data.get('option_c')
        option_d = request.data.get('option_d')
        correct_option = request.data.get('correct_option')
        
        if not language or not question_text or not correct_option:
            return Response({"detail": "Language, question_text, and correct_option are required."}, status=status.HTTP_400_BAD_REQUEST)
            
        q = Question.objects.create(
            language=language,
            question_text=question_text,
            option_a=option_a,
            option_b=option_b,
            option_c=option_c,
            option_d=option_d,
            correct_option=correct_option
        )
        serializer = QuestionSerializer(q)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class QuestionDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        user = request.user
        if user.role not in ['HR', 'MD']:
            return Response({"detail": "Access Denied: Only HR or MD can update questions."}, status=status.HTTP_403_FORBIDDEN)
            
        q = get_object_or_404(Question, id=pk)
        
        for field in ['language', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option']:
            if field in request.data:
                setattr(q, field, request.data[field])
                
        q.save()
        serializer = QuestionSerializer(q)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, pk):
        user = request.user
        if user.role not in ['HR', 'MD']:
            return Response({"detail": "Access Denied: Only HR or MD can delete questions."}, status=status.HTTP_403_FORBIDDEN)
            
        q = get_object_or_404(Question, id=pk)
        q.delete()
        return Response({"detail": "Question deleted successfully."}, status=status.HTTP_200_OK)


class ExamAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        results = Result.objects.all().select_related('exam__user').order_by('-id')
        serializer = ResultSerializer(results, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        candidate_email = request.data.get('email')
        candidate_pwd = request.data.get('password')
        answers = request.data.get('answers', {})
        
        candidate = Examuser.objects.filter(email=candidate_email, password=candidate_pwd).first()
        if not candidate:
            return Response({"detail": "Invalid candidate credentials."}, status=status.HTTP_401_UNAUTHORIZED)
            
        if ExamSession.objects.filter(user=candidate, is_completed=True).exists():
            last_exam = ExamSession.objects.filter(user=candidate, is_completed=True).last()
            result = Result.objects.filter(exam=last_exam).first()
            return Response({
                "detail": "Exam already completed.",
                "score": result.score if result else 0
            }, status=status.HTTP_400_BAD_REQUEST)
            
        questions = Question.objects.filter(language=candidate.role)
        if questions.count() < 1:
            return Response({"detail": "No questions configured for this language."}, status=status.HTTP_400_BAD_REQUEST)
            
        exam = ExamSession.objects.create(
            user=candidate,
            language=candidate.role,
            is_completed=True
        )
        
        correct_count = 0
        total_questions = questions.count()
        
        for q in questions:
            selected = answers.get(str(q.id))
            if selected:
                is_correct = selected == q.correct_option
                if is_correct:
                    correct_count += 1
                UserAnswer.objects.create(
                    exam=exam,
                    question=q,
                    selected_option=selected,
                    is_correct=is_correct
                )
                
        score_percent = (correct_count / total_questions) * 100 if total_questions > 0 else 0
        
        result = Result.objects.create(
            exam=exam,
            score=score_percent
        )
        
        return Response({
            "detail": "Exam submitted successfully.",
            "correct_answers": correct_count,
            "total_questions": total_questions,
            "score": score_percent
        }, status=status.HTTP_201_CREATED)


class RegisterAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role not in ['HR', 'MD']:
            return Response({"detail": "Access Denied: Only HR or MD can create accounts."}, status=status.HTTP_403_FORBIDDEN)
            
        role = request.data.get('role')
        if role not in ['Manager', 'TeamLead', 'Employee']:
            return Response({"detail": "Invalid role type."}, status=status.HTTP_400_BAD_REQUEST)
            
        username = request.data.get('fullname')
        email = request.data.get('email')
        phone = request.data.get('phone', '')
        password = request.data.get('password')
        confirm_password = request.data.get('confirm_password')
        gender = request.data.get('gender', 'Male')
        date_of_birth = request.data.get('date_of_birth') or None
        date_of_joining = request.data.get('date_of_joining') or None
        emp_status = request.data.get('status', 'Fresher')
        address = request.data.get('address', '')
        salary = request.data.get('salary', 0)
        department = request.data.get('department', '')
        team_name = request.data.get('team_name', '')
        experience_years = request.data.get('experience_years') or None
        previous_company = request.data.get('previous_company') or None
        
        if password != confirm_password:
            return Response({"detail": "Passwords do not match."}, status=status.HTTP_400_BAD_REQUEST)
            
        if User.objects.filter(email=email).exists():
            return Response({"detail": "Email already registered."}, status=status.HTTP_400_BAD_REQUEST)
            
        new_user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=username,
            phone=phone,
            gender=gender,
            date_of_birth=date_of_birth,
            date_of_joining=date_of_joining,
            status=emp_status,
            experience_years=experience_years,
            previous_company=previous_company,
            address=address,
            salary=salary,
            department=department,
            team_name=team_name,
            role=role
        )
        
        if 'profile_pic' in request.FILES:
            new_user.profile_pic = request.FILES['profile_pic']
        if 'document' in request.FILES:
            new_user.document = request.FILES['document']
            
        new_user.save()
        serializer = UserSerializer(new_user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ==================== UNIFIED CHAT REST API VIEWS ====================

import json as _json
from datetime import timedelta as _td


class AllUsersAPIView(APIView):
    """GET /api/users/ — returns all active users (excluding self) for DM list."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils import timezone as _tz
        from .models import UserPresence, ChatMessage
        from django.db.models import Q as _Q

        now = _tz.now()
        all_presences = {p.user_id: p for p in UserPresence.objects.select_related('user').all()}

        def get_status(u):
            p = all_presences.get(u.id)
            if not p:
                return 'Offline'
            if now - p.last_activity > _td(minutes=5):
                return 'Offline'
            return p.status

        users = User.objects.filter(is_active=True).exclude(id=request.user.id).order_by('first_name', 'username')

        result = []
        for u in users:
            unread = ChatMessage.objects.filter(
                sender=u, receiver=request.user, is_read=False
            ).exclude(deleted_for=request.user).count()

            last_msg = ChatMessage.objects.filter(
                _Q(sender=request.user, receiver=u) | _Q(sender=u, receiver=request.user)
            ).order_by('-id').first()

            # Build profile pic URL: use serializer with request context for absolute URL
            u_data = UserSerializer(u, context={'request': request}).data
            profile_pic_url = u_data.get('profile_pic_url')

            result.append({
                'id': u.id,
                'name': u.get_full_name() or u.username,
                'username': u.username,
                'role': u.role,
                'emp_id': u.emp_id,
                'department': u.department,
                'department_display': u_data.get('department_display'),
                'profile_pic': profile_pic_url,
                'status': get_status(u),
                'unread': unread,
                'last_msg_text': last_msg.text if last_msg else '',
                'last_msg_time': last_msg.created_at.isoformat() if last_msg else None,
            })

        # Sort by last message time descending, then alphabetically
        result.sort(key=lambda x: (x['last_msg_time'] or '0000'), reverse=True)
        return Response(result, status=status.HTTP_200_OK)



class ChatHistoryAPIView(APIView):
    """GET /api/chat-history/?user_id=X or ?room_id=X&last_id=N"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.utils.timezone import localtime
        from .models import ChatRoom, GroupMessage, ChatMessage, UserPresence
        from django.db.models import Q as _Q

        room_id = request.query_params.get('room_id')
        user_id = request.query_params.get('user_id')
        last_id = request.query_params.get('last_id', 0)
        try:
            last_id = int(last_id)
        except (TypeError, ValueError):
            last_id = 0

        now_ts = request.build_absolute_uri('/').rstrip('/')
        base_url = now_ts

        def make_avatar(u):
            if u.profile_pic and u.profile_pic.name:
                try:
                    return base_url + u.profile_pic.url
                except Exception:
                    return None
            return None

        messages_data = []

        if room_id:
            room = get_object_or_404(ChatRoom, id=room_id)
            if room.room_type == 'team' and not room.users.filter(id=request.user.id).exists():
                return Response({'detail': 'Access denied.'}, status=status.HTTP_403_FORBIDDEN)

            qs = GroupMessage.objects.filter(room=room).select_related('sender', 'reply_to', 'reply_to__sender')
            if last_id:
                qs = qs.filter(id__gt=last_id)
            qs = qs.order_by('id')

            for msg in qs:
                reactions_dict = msg.reactions or {}
                reactions_out = {}
                for emoji, uids in reactions_dict.items():
                    if isinstance(uids, list):
                        names = list(User.objects.filter(id__in=uids).values_list('username', flat=True))
                        reactions_out[emoji] = {'users': uids, 'usernames': names}

                reply_info = None
                if msg.reply_to:
                    reply_info = {
                        'id': msg.reply_to.id,
                        'sender_name': msg.reply_to.sender.get_full_name() or msg.reply_to.sender.username,
                        'text_preview': msg.reply_to.text[:60] if msg.reply_to.text else ('Attachment' if msg.reply_to.file else 'Message'),
                    }

                file_url = None
                file_name = None
                if msg.file and msg.file.name:
                    try:
                        file_url = base_url + msg.file.url
                        file_name = msg.file.name.split('/')[-1]
                    except Exception:
                        pass

                messages_data.append({
                    'id': msg.id,
                    'is_group': True,
                    'sender_id': msg.sender.id,
                    'sender_name': msg.sender.get_full_name() or msg.sender.username,
                    'sender_avatar': make_avatar(msg.sender),
                    'sender_role': msg.sender.role,
                    'text': msg.text,
                    'file_url': file_url,
                    'file_name': file_name,
                    'created_at': localtime(msg.created_at).strftime('%d %b %H:%M'),
                    'created_at_iso': msg.created_at.isoformat(),
                    'edited': msg.edited,
                    'reactions': reactions_out,
                    'is_deleted': msg.is_deleted,
                    'reply_to': reply_info,
                })

        elif user_id:
            target = get_object_or_404(User, id=user_id)

            # Mark as read
            ChatMessage.objects.filter(
                sender=target, receiver=request.user, is_read=False
            ).update(is_read=True, is_delivered=True)

            qs = ChatMessage.objects.filter(
                _Q(sender=request.user, receiver=target) | _Q(sender=target, receiver=request.user)
            ).select_related('sender', 'reply_to', 'reply_to__sender')
            if last_id:
                qs = qs.filter(id__gt=last_id)
            qs = qs.order_by('id')

            for msg in qs:
                if request.user in msg.deleted_for.all():
                    continue

                reactions_dict = msg.reactions or {}
                reactions_out = {}
                for emoji, uids in reactions_dict.items():
                    if isinstance(uids, list):
                        names = list(User.objects.filter(id__in=uids).values_list('username', flat=True))
                        reactions_out[emoji] = {'users': uids, 'usernames': names}

                reply_info = None
                if msg.reply_to:
                    reply_info = {
                        'id': msg.reply_to.id,
                        'sender_name': msg.reply_to.sender.get_full_name() or msg.reply_to.sender.username,
                        'text_preview': msg.reply_to.text[:60] if msg.reply_to.text else ('Attachment' if msg.reply_to.file else 'Message'),
                    }

                file_url = None
                file_name = None
                if msg.file and msg.file.name:
                    try:
                        file_url = base_url + msg.file.url
                        file_name = msg.file.name.split('/')[-1]
                    except Exception:
                        pass

                messages_data.append({
                    'id': msg.id,
                    'is_group': False,
                    'sender_id': msg.sender.id,
                    'sender_name': msg.sender.get_full_name() or msg.sender.username,
                    'sender_avatar': make_avatar(msg.sender),
                    'sender_role': msg.sender.role,
                    'text': msg.text,
                    'file_url': file_url,
                    'file_name': file_name,
                    'created_at': localtime(msg.created_at).strftime('%d %b %H:%M'),
                    'created_at_iso': msg.created_at.isoformat(),
                    'edited': msg.edited,
                    'reactions': reactions_out,
                    'is_deleted': msg.deleted_for_everyone,
                    'reply_to': reply_info,
                    'is_read': msg.is_read,
                    'is_delivered': msg.is_delivered,
                })

        else:
            return Response({'detail': 'Provide user_id or room_id.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'messages': messages_data}, status=status.HTTP_200_OK)


class SendChatMessageAPIView(APIView):
    """POST /api/send-message/ — send DM or group message with optional file/reply."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.utils.timezone import localtime
        from .models import ChatRoom, GroupMessage, ChatMessage

        room_id = request.data.get('room_id')
        receiver_id = request.data.get('receiver_id')
        text = request.data.get('text', '')
        reply_to_id = request.data.get('reply_to_id')
        file = request.FILES.get('file')
        base_url = request.build_absolute_uri('/').rstrip('/')

        reply_to = None
        if reply_to_id:
            try:
                if room_id:
                    reply_to = GroupMessage.objects.get(id=reply_to_id)
                else:
                    reply_to = ChatMessage.objects.get(id=reply_to_id)
            except Exception:
                pass

        if room_id:
            room = get_object_or_404(ChatRoom, id=room_id)
            if room.is_announcement_only and request.user.role not in ['MD', 'HR']:
                return Response({'detail': 'Only MD and HR can post in announcements.'}, status=status.HTTP_403_FORBIDDEN)

            msg = GroupMessage.objects.create(
                room=room, sender=request.user, text=text, reply_to=reply_to
            )
            if file:
                msg.file = file
                msg.save()

            file_url = (base_url + msg.file.url) if (msg.file and msg.file.name) else None
            file_name = msg.file.name.split('/')[-1] if (msg.file and msg.file.name) else None

            return Response({
                'id': msg.id,
                'is_group': True,
                'sender_id': msg.sender.id,
                'sender_name': msg.sender.get_full_name() or msg.sender.username,
                'text': msg.text,
                'file_url': file_url,
                'file_name': file_name,
                'created_at': localtime(msg.created_at).strftime('%d %b %H:%M'),
                'created_at_iso': msg.created_at.isoformat(),
                'edited': False,
                'reactions': {},
                'is_deleted': False,
            }, status=status.HTTP_201_CREATED)

        elif receiver_id:
            receiver = get_object_or_404(User, id=receiver_id)
            msg = ChatMessage.objects.create(
                sender=request.user, receiver=receiver, text=text, reply_to=reply_to
            )
            if file:
                msg.file = file
                msg.save()

            file_url = (base_url + msg.file.url) if (msg.file and msg.file.name) else None
            file_name = msg.file.name.split('/')[-1] if (msg.file and msg.file.name) else None

            return Response({
                'id': msg.id,
                'is_group': False,
                'sender_id': msg.sender.id,
                'sender_name': msg.sender.get_full_name() or msg.sender.username,
                'text': msg.text,
                'file_url': file_url,
                'file_name': file_name,
                'created_at': localtime(msg.created_at).strftime('%d %b %H:%M'),
                'created_at_iso': msg.created_at.isoformat(),
                'edited': False,
                'reactions': {},
                'is_deleted': False,
                'is_read': False,
                'is_delivered': False,
            }, status=status.HTTP_201_CREATED)

        return Response({'detail': 'Provide receiver_id or room_id.'}, status=status.HTTP_400_BAD_REQUEST)


class ToggleReactionAPIView(APIView):
    """POST /api/toggle-reaction/ — add or remove an emoji reaction."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .models import ChatRoom, GroupMessage, ChatMessage

        message_id = request.data.get('message_id')
        is_group = str(request.data.get('is_group', 'false')).lower() == 'true'
        emoji = request.data.get('emoji')

        if not message_id or not emoji:
            return Response({'detail': 'message_id and emoji required.'}, status=status.HTTP_400_BAD_REQUEST)

        if is_group:
            msg = get_object_or_404(GroupMessage, id=message_id)
        else:
            msg = get_object_or_404(ChatMessage, id=message_id)

        reactions = msg.reactions or {}
        user_id = request.user.id

        if emoji in reactions:
            uids = reactions[emoji] if isinstance(reactions[emoji], list) else []
            if user_id in uids:
                uids.remove(user_id)
                if not uids:
                    del reactions[emoji]
                else:
                    reactions[emoji] = uids
            else:
                uids.append(user_id)
                reactions[emoji] = uids
        else:
            reactions[emoji] = [user_id]

        msg.reactions = reactions
        msg.save()

        reactions_out = {}
        for emo, uids in reactions.items():
            if isinstance(uids, list):
                names = list(User.objects.filter(id__in=uids).values_list('username', flat=True))
                reactions_out[emo] = {'users': uids, 'usernames': names}

        return Response({'reactions': reactions_out}, status=status.HTTP_200_OK)


class EditChatMessageAPIView(APIView):
    """POST /api/edit-message/ — edit own message within 10 minutes."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.utils import timezone as _tz
        from .models import GroupMessage, ChatMessage

        message_id = request.data.get('message_id')
        is_group = str(request.data.get('is_group', 'false')).lower() == 'true'
        new_text = str(request.data.get('text', '')).strip()

        if not message_id or not new_text:
            return Response({'detail': 'message_id and text required.'}, status=status.HTTP_400_BAD_REQUEST)

        if is_group:
            msg = get_object_or_404(GroupMessage, id=message_id)
        else:
            msg = get_object_or_404(ChatMessage, id=message_id)

        if msg.sender != request.user:
            return Response({'detail': 'Forbidden: not the sender.'}, status=status.HTTP_403_FORBIDDEN)

        if (_tz.now() - msg.created_at).total_seconds() > 600:
            return Response({'detail': 'Cannot edit: 10-minute limit exceeded.'}, status=status.HTTP_400_BAD_REQUEST)

        msg.text = new_text
        msg.edited = True
        msg.save()

        return Response({'text': msg.text, 'edited': True}, status=status.HTTP_200_OK)


class DeleteChatMessageAPIView(APIView):
    """POST /api/delete-message/ — delete for me or for everyone."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .models import GroupMessage, ChatMessage

        message_id = request.data.get('message_id')
        is_group = str(request.data.get('is_group', 'false')).lower() == 'true'
        mode = request.data.get('mode', 'everyone')  # 'everyone' or 'me'

        if not message_id:
            return Response({'detail': 'message_id required.'}, status=status.HTTP_400_BAD_REQUEST)

        if is_group:
            msg = get_object_or_404(GroupMessage, id=message_id)
            if msg.sender != request.user:
                return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
            msg.is_deleted = True
            msg.deleted_by = request.user
            msg.text = ''
            msg.file = None
            msg.save()
        else:
            msg = get_object_or_404(ChatMessage, id=message_id)
            if mode == 'everyone':
                if msg.sender != request.user:
                    return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)
                msg.deleted_for_everyone = True
                msg.deleted_by_user = request.user
                msg.text = ''
                msg.file = None
                msg.save()
            else:
                msg.deleted_for.add(request.user)

        return Response({'status': 'deleted'}, status=status.HTTP_200_OK)


class PresenceAPIView(APIView):
    """POST /api/presence/ — update online status and typing indicator."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .models import UserPresence

        pstatus = request.data.get('status', 'Online')
        valid = ['Online', 'Offline', 'Away', 'Busy', 'In Meeting', 'Working From Home']
        if pstatus not in valid:
            pstatus = 'Online'

        presence, _ = UserPresence.objects.get_or_create(user=request.user)
        presence.status = pstatus
        presence.save()

        return Response({'status': 'ok'}, status=status.HTTP_200_OK)

    def get(self, request):
        """GET /api/presence/?user_ids=1,2,3 — get presence for multiple users."""
        from django.utils import timezone as _tz
        from .models import UserPresence

        user_ids_str = request.query_params.get('user_ids', '')
        try:
            user_ids = [int(x) for x in user_ids_str.split(',') if x.strip()]
        except ValueError:
            user_ids = []

        now = _tz.now()
        result = {}
        presences = UserPresence.objects.filter(user_id__in=user_ids)
        presence_map = {p.user_id: p for p in presences}

        for uid in user_ids:
            p = presence_map.get(uid)
            if not p or (now - p.last_activity) > _td(minutes=5):
                result[str(uid)] = 'Offline'
            else:
                result[str(uid)] = p.status

        return Response(result, status=status.HTTP_200_OK)


class CreateTeamGroupAPIView(APIView):
    """POST /api/create-team/ — create a team group chat room."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .models import ChatRoom

        if request.user.role not in ['MD', 'HR', 'Manager', 'TeamLead']:
            return Response({'detail': 'Forbidden: not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        name = str(request.data.get('name', '')).strip()
        description = str(request.data.get('description', '')).strip()
        user_ids = request.data.get('users', [])

        if not name:
            return Response({'detail': 'Room name is required.'}, status=status.HTTP_400_BAD_REQUEST)

        room = ChatRoom.objects.create(
            name=name,
            room_type='team',
            description=description,
            created_by=request.user
        )
        room.users.add(request.user)
        room.admins.add(request.user)

        for uid in user_ids:
            try:
                u = User.objects.get(id=int(uid))
                room.users.add(u)
            except Exception:
                continue

        return Response({'id': room.id, 'name': room.name, 'description': room.description}, status=status.HTTP_201_CREATED)


class ForwardMessageAPIView(APIView):
    """POST /api/forward-message/ — forward messages to selected users."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from .models import ChatMessage

        msg_ids = request.data.get('msg_ids', [])
        receiver_ids = request.data.get('receiver_ids', [])

        if not msg_ids or not receiver_ids:
            return Response({'detail': 'msg_ids and receiver_ids required.'}, status=status.HTTP_400_BAD_REQUEST)

        count = 0
        for receiver_id in receiver_ids:
            try:
                receiver = User.objects.get(id=int(receiver_id))
            except (User.DoesNotExist, ValueError):
                continue
            for msg_id in msg_ids:
                try:
                    original = ChatMessage.objects.get(id=int(msg_id))
                    ChatMessage.objects.create(
                        sender=request.user,
                        receiver=receiver,
                        text=original.text,
                    )
                    count += 1
                except ChatMessage.DoesNotExist:
                    continue

        return Response({'forwarded': count}, status=status.HTTP_200_OK)


class AllChatRoomsAPIView(APIView):
    """GET /api/all-chatrooms/ — returns channels and team rooms with metadata."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from .models import ChatRoom, GroupMessage
        from django.utils.timezone import localtime

        channels = ChatRoom.objects.filter(room_type='channel')
        teams = ChatRoom.objects.filter(room_type='team', users=request.user)

        def room_data(room):
            last_msg = GroupMessage.objects.filter(room=room, is_deleted=False).order_by('-id').first()
            return {
                'id': room.id,
                'name': room.name,
                'room_type': room.room_type,
                'description': room.description or '',
                'is_announcement_only': room.is_announcement_only,
                'last_msg_text': last_msg.text[:60] if last_msg else '',
                'last_msg_time': last_msg.created_at.isoformat() if last_msg else None,
            }

        return Response({
            'channels': [room_data(r) for r in channels],
            'teams': [room_data(r) for r in teams],
        }, status=status.HTTP_200_OK)

