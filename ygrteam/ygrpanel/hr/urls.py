from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from . import views
from . import api_views

urlpatterns = [
    path('api/auth/csrf/', api_views.GetCSRFToken.as_view(), name='api_csrf_token'),
    path('api/auth/login/', api_views.LoginAPIView.as_view(), name='api_login'),
    path('api/auth/logout/', api_views.LogoutAPIView.as_view(), name='api_logout'),
    path('api/auth/user/', api_views.CurrentUserAPIView.as_view(), name='api_user'),
    path('api/attendance/status/', api_views.AttendanceStatusAPIView.as_view(), name='api_attendance_status'),
    path('api/attendance/check-in/', api_views.CheckInAPIView.as_view(), name='api_attendance_checkin'),
    path('api/attendance/check-out/', api_views.CheckOutAPIView.as_view(), name='api_attendance_checkout'),
    path('api/dashboard/employee/', api_views.EmployeeDashboardAPIView.as_view(), name='api_employee_dashboard'),
    path('api/dashboard/hr/', api_views.HRDashboardAPIView.as_view(), name='api_hr_dashboard'),
    path('api/dashboard/teamlead/', api_views.TLDashboardAPIView.as_view(), name='api_tl_dashboard'),
    path('api/dashboard/manager/', api_views.ManagerDashboardAPIView.as_view(), name='api_manager_dashboard'),
    path('api/dashboard/md/', api_views.MDDashboardAPIView.as_view(), name='api_md_dashboard'),
    path('api/attendance/', api_views.AttendanceAPIView.as_view(), name='api_attendance_list'),
    path('api/attendance/corrections/', api_views.AttendanceCorrectionAPIView.as_view(), name='api_attendance_corrections'),
    path('api/attendance/corrections/<int:pk>/action/', api_views.AttendanceCorrectionActionAPIView.as_view(), name='api_attendance_corrections_action'),
    path('api/leaves/', api_views.LeaveAPIView.as_view(), name='api_leaves'),
    path('api/leaves/<int:pk>/action/', api_views.LeaveActionAPIView.as_view(), name='api_leaves_action'),
    path('api/holidays/', api_views.HolidayAPIView.as_view(), name='api_holidays'),
    path('api/holidays/<int:pk>/', api_views.HolidayAPIView.as_view(), name='api_holiday_detail'),
    path('api/payslips/', api_views.PayslipAPIView.as_view(), name='api_payslips'),
    path('api/payslips/<int:pk>/', api_views.PayslipDetailAPIView.as_view(), name='api_payslip_detail'),
    path('api/salary-structures/', api_views.SalaryStructureAPIView.as_view(), name='api_salary_structures'),
    path('api/projects/', api_views.ProjectAPIView.as_view(), name='api_projects'),
    path('api/tasks/', api_views.TaskAPIView.as_view(), name='api_tasks'),
    path('api/tasks/<int:pk>/', api_views.TaskDetailAPIView.as_view(), name='api_task_detail'),
    path('api/daily-reports/', api_views.DailyReportAPIView.as_view(), name='api_daily_reports'),
    path('api/profile/', api_views.UserProfileAPIView.as_view(), name='api_user_profile'),
    path('api/hr-settings/', api_views.HRSettingsAPIView.as_view(), name='api_hr_settings'),
    path('api/chatrooms/', api_views.ChatRoomAPIView.as_view(), name='api_chatrooms'),
    path('api/chat-messages/', api_views.ChatMessageAPIView.as_view(), name='api_chat_messages'),
    path('api/group-messages/', api_views.GroupMessageAPIView.as_view(), name='api_group_messages'),
    path('api/calls/', api_views.CallSessionAPIView.as_view(), name='api_calls'),
    path('api/calls/<int:pk>/action/', api_views.CallSessionActionAPIView.as_view(), name='api_call_action'),
    path('api/invoices/', api_views.InvoiceAPIView.as_view(), name='api_invoices'),
    path('api/invoices/<int:pk>/', api_views.InvoiceDetailAPIView.as_view(), name='api_invoice_detail'),
    path('api/invoicing-resources/', api_views.ClientServiceAPIView.as_view(), name='api_invoicing_resources'),
    path('api/questions/', api_views.QuestionAPIView.as_view(), name='api_questions'),
    path('api/questions/<int:pk>/', api_views.QuestionDetailAPIView.as_view(), name='api_question_detail'),
    path('api/exams/', api_views.ExamAPIView.as_view(), name='api_exams'),
    path('api/register/', api_views.RegisterAPIView.as_view(), name='api_register'),
    # Unified Chat REST APIs
    path('api/users/', api_views.AllUsersAPIView.as_view(), name='api_users'),
    path('api/chat-history/', api_views.ChatHistoryAPIView.as_view(), name='api_chat_history'),
    path('api/send-message/', api_views.SendChatMessageAPIView.as_view(), name='api_send_message'),
    path('api/toggle-reaction/', api_views.ToggleReactionAPIView.as_view(), name='api_toggle_reaction'),
    path('api/edit-message/', api_views.EditChatMessageAPIView.as_view(), name='api_edit_message'),
    path('api/delete-message/', api_views.DeleteChatMessageAPIView.as_view(), name='api_delete_message'),
    path('api/presence/', api_views.PresenceAPIView.as_view(), name='api_presence'),
    path('api/create-team/', api_views.CreateTeamGroupAPIView.as_view(), name='api_create_team'),
    path('api/forward-message/', api_views.ForwardMessageAPIView.as_view(), name='api_forward_message'),
    path('api/all-chatrooms/', api_views.AllChatRoomsAPIView.as_view(), name='api_all_chatrooms'),
]



# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
from django.urls import path
from . import views





if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)