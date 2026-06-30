import os
import sys
import random
import datetime
import calendar
from decimal import Decimal

# Set up Django environment
sys.path.insert(0, '.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrpanel.settings')
import django
django.setup()

from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db.models import Q

from hr.models import (
    Attendance, Team, Task, Payslip, DailyReport, Holiday, Project, Leave,
    AttendanceCorrection, SalaryStructure, HRSettings, ChatMessage, ChatRoom,
    GroupMessage, CallSession, Client, Service, Invoice, InvoiceItem,
    Question, Examuser, ExamSession, Result, CompanyAnnouncement, HolidayNotification
)

User = get_user_model()

def populate():
    print("Starting default database population script...")

    # 1. Update/Ensure HRSettings exists
    settings = HRSettings.get_settings()
    settings.sandwich_leave_enabled = True
    settings.save()
    print("HRSettings initialized (Sandwich Leave Enabled).")

    # 2. Get existing users and group them by role
    users = list(User.objects.all())
    md_users = [u for u in users if u.role == 'MD']
    manager_users = [u for u in users if u.role == 'Manager']
    tl_users = [u for u in users if u.role == 'TeamLead']
    hr_users = [u for u in users if u.role == 'HR']
    emp_users = [u for u in users if u.role == 'Employee']

    print(f"Active Users distribution: MD={len(md_users)}, Manager={len(manager_users)}, TL={len(tl_users)}, HR={len(hr_users)}, Employee={len(emp_users)}")

    # Hierarchy setup
    # MD reports to None
    # Managers report to MD
    # Team Leads report to Managers
    # Employees report to Team Leads / Managers
    primary_md = md_users[0] if md_users else None
    primary_mgr = manager_users[0] if manager_users else None
    primary_tl = tl_users[0] if tl_users else None

    # Standardize designations & departments
    designations_map = {
        'MD': 'Managing Director',
        'Manager': 'Senior Project Manager',
        'TeamLead': 'Technical Team Lead',
        'HR': 'Senior HR Specialist',
    }

    dept_choices = ['python_dev', 'java_dev', 'frontend_dev', 'backend_dev', 'fullstack_dev', 'testing', 'devops', 'ui_ux']
    
    # Existing media pictures we found in media/profile_pics/
    available_pics = [
        'profile_pics/_1.jpg',
        'profile_pics/Photo_G.jpg',
        'profile_pics/mm.jpg',
        'profile_pics/dearify-generated-photo-1763207770354.jpg',
        'profile_pics/loksh.jpeg',
        'profile_pics/pavan.jpeg',
        'profile_pics/tharun.jpeg',
        'profile_pics/r.ravindra.jpeg',
        'profile_pics/reddy.jpeg'
    ]

    print("Updating user profile metadata, joining dates, contact details and salary structures...")
    
    today = datetime.date.today()
    ten_months_ago = today - datetime.timedelta(days=300)
    
    for idx, u in enumerate(users):
        # Update name if empty
        if not u.first_name:
            u.first_name = u.username.split('@')[0].capitalize()
        if not u.last_name:
            u.last_name = "User"
            
        # Address & Contact info
        u.phone = u.phone or f"987654{idx:04d}"
        u.address = u.address or f"Flat {101+idx}, Silicon Valley Residency, Madhapur, Hyderabad - 500081"
        u.gender = u.gender or random.choice(['Male', 'Female'])
        u.date_of_birth = u.date_of_birth or datetime.date(1985 + (idx % 15), (idx % 12) + 1, (idx % 25) + 1)
        u.status = 'Active'
        
        # Experience and designation
        if u.role == 'MD':
            u.reporting_manager = None
            u.designation = designations_map['MD']
            u.department = 'Administration'
            u.experience_years = 15
            u.previous_company = "Tech Mahindra"
            u.salary = u.salary or Decimal('250000.00')
            u.date_of_joining = u.date_of_joining or (ten_months_ago - datetime.timedelta(days=60))
        elif u.role == 'Manager':
            u.reporting_manager = primary_md
            u.designation = designations_map['Manager']
            u.department = 'Administration'
            u.experience_years = 10
            u.previous_company = "TCS"
            u.salary = u.salary or Decimal('140000.00')
            u.date_of_joining = u.date_of_joining or (ten_months_ago - datetime.timedelta(days=30))
        elif u.role == 'TeamLead':
            u.reporting_manager = primary_mgr or primary_md
            u.designation = designations_map['TeamLead']
            u.department = dept_choices[idx % len(dept_choices)]
            u.experience_years = 7
            u.previous_company = "Wipro"
            u.salary = u.salary or Decimal('95000.00')
            u.date_of_joining = u.date_of_joining or ten_months_ago
        elif u.role == 'HR':
            u.reporting_manager = primary_md
            u.designation = designations_map['HR']
            u.department = 'HR'
            u.experience_years = 5
            u.previous_company = "Cognizant"
            u.salary = u.salary or Decimal('55000.00')
            u.date_of_joining = u.date_of_joining or ten_months_ago
        else: # Employee
            u.reporting_manager = primary_tl or primary_mgr or primary_md
            u.experience_years = idx % 5
            u.previous_company = random.choice(["Infosys", "Capgemini", "HCL", "Fresher"])
            u.salary = u.salary or Decimal(random.choice(['35000.00', '45000.00', '52000.00', '60000.00', '68000.00']))
            u.department = dept_choices[idx % len(dept_choices)]
            # designation
            if u.department == 'testing':
                u.designation = 'QA Automation Engineer'
            elif u.department == 'devops':
                u.designation = 'DevOps Consultant'
            elif u.department == 'ui_ux':
                u.designation = 'Lead UX Designer'
            else:
                u.designation = f"{u.department.replace('_', ' ').title()} Developer"
                
            # Joining date distribution
            if idx % 4 == 0:
                # 2-8 months ago
                u.date_of_joining = u.date_of_joining or (today - datetime.timedelta(days=random.randint(60, 240)))
            else:
                # 10 months ago
                u.date_of_joining = u.date_of_joining or (ten_months_ago + datetime.timedelta(days=random.randint(1, 30)))
                
        # Aadhaar
        u.aadhaar = u.aadhaar or f"3624891500{idx:02d}"
        
        # Profile pic
        if not u.profile_pic:
            u.profile_pic = available_pics[idx % len(available_pics)]
            
        u.save()

        # Create/Update SalaryStructure
        sal = float(u.salary)
        basic = round(sal * 0.50, 2)
        hra = round(sal * 0.20, 2)
        transport = round(sal * 0.08, 2)
        medical = round(sal * 0.04, 2)
        bonus = 0.0
        
        pf_enabled = True
        pf_rate = 12.0
        pf_ded = round(basic * 0.12, 2)
        
        esi_enabled = sal < 21000.0
        esi_ded = round(sal * 0.0075, 2) if esi_enabled else 0.0
        
        pt = 200.0
        tds = round(sal * 0.05, 2)
        
        special = round(sal - (basic + hra + transport + medical + bonus), 2)
        
        ss, created = SalaryStructure.objects.get_or_create(employee=u)
        ss.monthly_gross = Decimal(str(sal))
        ss.basic_salary = Decimal(str(basic))
        ss.hra = Decimal(str(hra))
        ss.transport_allowance = Decimal(str(transport))
        ss.medical_allowance = Decimal(str(medical))
        ss.special_allowance = Decimal(str(special))
        ss.bonus = Decimal(str(bonus))
        ss.pf_enabled = pf_enabled
        ss.pf_rate = Decimal(str(pf_rate))
        ss.pf_amount = Decimal(str(pf_ded))
        ss.esi_enabled = esi_enabled
        ss.esi_amount = Decimal(str(esi_ded))
        ss.pt_enabled = True
        ss.pt_amount = Decimal(str(pt))
        ss.tds_amount = Decimal(str(tds))
        ss.bank_name = random.choice(["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank"])
        ss.account_number = f"5010023984{idx:02d}"
        ss.ifsc_code = f"HDFC0000{120 + idx}"
        ss.pan = f"ABCDE{3040 + idx}F"
        ss.uan = f"1009847283{idx:02d}"
        ss.aadhaar = u.aadhaar
        ss.save()

    print("User profiles and salary structures synchronized.")

    # 3. Populate Holidays
    print("Scheduling corporate holidays list...")
    holidays_data = [
        ("New Year Day", datetime.date(2025, 1, 1), "National"),
        ("Republic Day", datetime.date(2025, 1, 26), "National"),
        ("Maha Shivaratri", datetime.date(2025, 2, 26), "Festival"),
        ("Holi Festival", datetime.date(2025, 3, 14), "Festival"),
        ("Ugadi / Telugu New Year", datetime.date(2025, 3, 30), "Festival"),
        ("Good Friday", datetime.date(2025, 4, 18), "Festival"),
        ("May Day / Labor Day", datetime.date(2025, 5, 1), "Company"),
        ("Eid al-Fitr", datetime.date(2025, 10, 2), "Festival"),
        ("Independence Day", datetime.date(2025, 8, 15), "National"),
        ("Ganesh Chaturthi", datetime.date(2025, 8, 27), "Festival"),
        ("Gandhi Jayanti", datetime.date(2025, 10, 2), "National"),
        ("Vijayadashami / Dussehra", datetime.date(2025, 10, 2), "Festival"),
        ("Diwali Festival of Lights", datetime.date(2025, 10, 20), "Festival"),
        ("Christmas Day", datetime.date(2025, 12, 25), "Festival"),
        # 2026
        ("New Year Day", datetime.date(2026, 1, 1), "National"),
        ("Republic Day", datetime.date(2026, 1, 26), "National"),
        ("May Day", datetime.date(2026, 5, 1), "Company"),
        ("Independence Day", datetime.date(2026, 8, 15), "National"),
        ("Gandhi Jayanti", datetime.date(2026, 10, 2), "National"),
        ("Diwali Festival", datetime.date(2026, 11, 8), "Festival"),
        ("Christmas Day", datetime.date(2026, 12, 25), "Festival"),
    ]

    for name, dt, h_type in holidays_data:
        Holiday.objects.get_or_create(
            name=name, date=dt,
            defaults={
                'holiday_type': h_type,
                'description': f"Corporate holiday celebration for {name}",
                'year': dt.year,
                'status': 'Approved',
                'branch': 'All Branches'
            }
        )
    print("Holiday calendar schedules updated.")

    # 4. Generate projects & teams
    print("Checking projects, teams and member allocations...")
    team_names = ["Python Squad", "React Frontend Group", "Quality Assurance Team"]
    teams_created = []
    for name in team_names:
        team, created = Team.objects.get_or_create(name=name, defaults={'lead': primary_tl})
        if created:
            # Assign first 8 employees
            team.members.set(emp_users[:8])
        teams_created.append(team)

    projects_data = [
        ("PRJ001", "Enterprise CRM System", "Next-gen enterprise customer relationship portal", datetime.date(2025, 5, 1), datetime.date(2025, 12, 25), "Completed"),
        ("PRJ002", "HR Portal Migration", "Migrating existing Django site to React SPA structure", datetime.date(2025, 10, 1), datetime.date(2026, 7, 31), "In Progress"),
        ("PRJ003", "AI Customer Support Specialist", "Training LLMs to respond automatically to customer complaints", datetime.date(2026, 3, 1), datetime.date(2026, 12, 1), "In Progress"),
        ("PRJ004", "DevOps Infrastructure Upgrade", "Containerizing all services using Kubernetes", datetime.date(2026, 5, 1), datetime.date(2026, 8, 30), "Pending"),
    ]

    projects_created = []
    for pid, name, desc, start, dead, status_val in projects_data:
        p, created = Project.objects.get_or_create(
            project_id=pid,
            defaults={
                'name': name,
                'description': desc,
                'startdate': start,
                'deadline': dead,
                'assigned_manager': primary_mgr,
                'assigned_team': random.choice(teams_created),
                'status': status_val
            }
        )
        projects_created.append(p)

    # Tasks allocation
    tasks_data = [
        ("Setup Boilerplate App", "Initialize React Vite layout shell and routing hooks", "Completed"),
        ("Build Auth Client Modules", "Register APIs and set up secure CSRF Cookie handlers", "Completed"),
        ("Integrate Salary Registry", "Add PDF downloads for monthly gross/net payslips", "Completed"),
        ("Add WebRTC Calls Gateway", "Create socket signaling handshake controls for conferences", "Pending"),
        ("Configure DevOps Pipelines", "Write Dockerfiles and publish builds to container registry", "Pending"),
    ]

    for p in projects_created:
        for idx, (t_name, t_desc, t_stat) in enumerate(tasks_data):
            t, created = Task.objects.get_or_create(
                task_name=f"{p.project_id} - {t_name}",
                project=p,
                defaults={
                    'description': t_desc,
                    'start_date': p.startdate or today,
                    'end_date': p.deadline or today,
                    'status': t_stat
                }
            )
            if created:
                t.members.set(emp_users[idx % len(emp_users): (idx % len(emp_users)) + 2])

    print("Projects, teams, and tasks loaded.")

    # 5. Generate Leaves history
    print("Generating historic Leave records...")
    reasons = ["Family gathering celebration", "Suffering from severe flu and high fever", "Personal paperwork and legal tasks", "Out of town travel"]
    leave_types = ["Casual", "Sick", "Earned"]
    
    # We will generate leaves for the past months and link them
    for emp in emp_users[:12]:
        joining = emp.date_of_joining
        # Create 3-4 historical leaves
        for offset in [30, 90, 180]:
            leave_date = joining + datetime.timedelta(days=offset)
            if leave_date >= today:
                continue
            
            # Avoid weekends
            if leave_date.weekday() >= 5:
                leave_date -= datetime.timedelta(days=2)
                
            l, created = Leave.objects.get_or_create(
                user=emp,
                from_date=leave_date,
                to_date=leave_date + datetime.timedelta(days=1),
                defaults={
                    'reason': random.choice(reasons),
                    'leave_type': random.choice(leave_types),
                    'status': random.choice(['Approved', 'Rejected']),
                    'approved_tl': True,
                    'approved_manager': True,
                    'approved_hr': True,
                    'approved_md': True
                }
            )

    # 6. Generate Daily Registry Logs & Completed Payrolls
    print("Creating historical attendance logs and payslip payouts...")
    
    # Pre-fetch corporate holiday dates to optimize lookup
    holiday_dates = set(Holiday.objects.filter(status='Approved').values_list('date', flat=True))

    for emp in emp_users:
        joining = emp.date_of_joining
        current_date = joining
        
        # Loop from joining to today
        while current_date <= today:
            weekday = current_date.weekday()
            
            # Check if record already exists
            record_exists = Attendance.objects.filter(user=emp, date=current_date).exists()
            
            if not record_exists:
                # Decide status
                if weekday >= 5:
                    status_val = 'Week Off'
                    check_in = None
                    check_out = None
                    hours = 0.0
                elif current_date in holiday_dates:
                    status_val = 'Holiday'
                    check_in = None
                    check_out = None
                    hours = 0.0
                else:
                    # Check if user is on leave on this date
                    on_leave = Leave.objects.filter(user=emp, from_date__lte=current_date, to_date__gte=current_date, status='Approved').exists()
                    if on_leave:
                        status_val = 'Leave'
                        check_in = None
                        check_out = None
                        hours = 0.0
                    else:
                        # Present (92% probability), Absent (1%), Half Day (2%), Late Login (5%)
                        rand = random.random()
                        if rand < 0.01:
                            status_val = 'Absent'
                            check_in = None
                            check_out = None
                            hours = 0.0
                        elif rand < 0.03:
                            status_val = 'Half Day'
                            # 9:30 AM to 1:30 PM
                            check_in = datetime.datetime.combine(current_date, datetime.time(9, 30))
                            check_out = datetime.datetime.combine(current_date, datetime.time(13, 30))
                            hours = 4.0
                        elif rand < 0.08:
                            status_val = 'Late Login'
                            # 10:15 AM to 7:15 PM
                            check_in = datetime.datetime.combine(current_date, datetime.time(10, 15))
                            check_out = datetime.datetime.combine(current_date, datetime.time(19, 15))
                            hours = 9.0
                        else:
                            status_val = 'Present'
                            # 9:25 AM to 6:35 PM
                            check_in = datetime.datetime.combine(current_date, datetime.time(9, 20 + random.randint(0, 10)))
                            check_out = check_in + datetime.timedelta(hours=9, minutes=random.randint(-15, 30))
                            hours = round((check_out - check_in).total_seconds() / 3600.0, 2)
                
                # Create registry log
                Attendance.objects.create(
                    user=emp,
                    date=current_date,
                    check_in_time=check_in,
                    check_out_time=check_out,
                    total_hours=Decimal(str(hours)),
                    status=status_val,
                    remarks="Automatic system log verification entry"
                )
                
            current_date += datetime.timedelta(days=1)

        # Generate Payslips for all completed months
        # E.g. from joining month to previous month
        start_year, start_month = joining.year, joining.month
        end_year, end_month = today.year, today.month
        
        temp_date = datetime.date(start_year, start_month, 1)
        target_end_date = datetime.date(end_year, end_month, 1)
        
        while temp_date < target_end_date:
            m = temp_date.month
            y = temp_date.year
            
            # Generate payslip if not exists
            if not Payslip.objects.filter(employee=emp, month=m, year=y).exists():
                # Read from salary structure
                try:
                    ss = emp.salary_structure
                except SalaryStructure.DoesNotExist:
                    temp_date = datetime.date(temp_date.year + (temp_date.month // 12), (temp_date.month % 12) + 1, 1)
                    continue
                
                # Fetch attendance summary for that month
                month_attendances = Attendance.objects.filter(user=emp, date__year=y, date__month=m)
                present = month_attendances.filter(status__in=['Present', 'Late Login']).count()
                absent = month_attendances.filter(status='Absent').count()
                half = month_attendances.filter(status='Half Day').count()
                hols = month_attendances.filter(status='Holiday').count()
                offs = month_attendances.filter(status='Week Off').count()
                leaves_cnt = month_attendances.filter(status='Leave').count()
                
                pf = ss.pf_amount
                esi = ss.esi_amount
                pt = ss.pt_amount
                tds = ss.tds_amount
                
                # Net payout
                gross = ss.monthly_gross
                deductions = pf + esi + pt + tds
                net = gross - deductions
                
                Payslip.objects.create(
                    employee=emp,
                    month=m,
                    year=y,
                    status='Paid',
                    is_published=True,
                    basic_salary=ss.basic_salary,
                    hra=ss.hra,
                    transport_allowance=ss.transport_allowance,
                    medical_allowance=ss.medical_allowance,
                    special_allowance=ss.special_allowance,
                    bonus=ss.bonus,
                    pf_deduction=pf,
                    esi_deduction=esi,
                    professional_tax=pt,
                    tds=tds,
                    loan_deduction=Decimal('0.00'),
                    other_deductions=Decimal('0.00'),
                    unpaid_leave_days=absent,
                    half_days=half,
                    holidays=hols,
                    week_offs=offs,
                    days_present=present + hols + offs + leaves_cnt,
                    days_absent=absent,
                    leaves_taken=leaves_cnt,
                    working_days=present + absent + half + leaves_cnt + hols + offs,
                    payment_date=datetime.date(y, m, 28) if m != 12 else datetime.date(y, 12, 30),
                    generated_by=primary_md,
                    employee_name=emp.get_full_name() or emp.username,
                    designation=emp.designation,
                    department=emp.department,
                    bank_name=ss.bank_name,
                    account_number=ss.account_number,
                    ifsc_code=ss.ifsc_code,
                    pan=ss.pan,
                    uan=ss.uan,
                    aadhaar=ss.aadhaar
                )
                
            # Move to next month
            temp_date = datetime.date(temp_date.year + (temp_date.month // 12), (temp_date.month % 12) + 1, 1)

    print("Attendance registry and Payslips complete.")

    # 7. Generate Daily Reports progress
    print("Populating daily progress reports log...")
    reports_desc = [
        "Debugged CSRF auth cookie session loading error.",
        "Refactored Vite router layout shell and ProtectedRoute checks.",
        "Modified UserSerializer fields to fetch dynamic team lead bindings.",
        "Added polling fallback to the chat component for messaging parity.",
        "Verified responsive CSS alignments across varying screen layouts.",
    ]
    
    for idx, emp in enumerate(emp_users[:15]):
        for day_offset in range(1, 15):
            report_day = today - datetime.timedelta(days=day_offset)
            # Only working days
            if report_day.weekday() >= 5:
                continue
                
            DailyReport.objects.get_or_create(
                user=emp,
                report_date=report_day,
                defaults={
                    'project': random.choice(projects_created),
                    'tasks_completed': random.choice(reports_desc),
                    'tasks_in_progress': "Refining layout alignments.",
                    'issues': "None",
                    'plan_for_tomorrow': "Conduct unit testing verification.",
                    'recipient_role': 'TeamLead'
                }
            )

    # 8. Direct Messages & Chat Room conversations
    print("Loading Direct Messages conversations chat history...")
    if len(users) >= 2:
        # Create direct chats
        chat_text = [
            "Hi there! Can we sync on the CRM dashboard tasks today?",
            "Yes, let's catch up at 2:00 PM today.",
            "Sure, sounds good. I will schedule a call.",
            "I've submitted the progress reports. Please check.",
            "Perfect. I will review and update the status.",
        ]
        
        for idx in range(len(users) - 1):
            sender = users[idx]
            receiver = users[idx+1]
            for text_msg in chat_text:
                ChatMessage.objects.create(
                    sender=sender,
                    receiver=receiver,
                    text=text_msg,
                    is_read=True,
                    is_delivered=True
                )

    # 9. Voice & Video Calls history
    print("Loading Call History conference portal log...")
    if len(users) >= 2:
        for idx in range(10):
            caller = random.choice(users)
            receiver = random.choice([u for u in users if u.id != caller.id])
            CallSession.objects.create(
                caller=caller,
                receiver=receiver,
                call_type=random.choice(['voice', 'video']),
                status=random.choice(['completed', 'missed', 'rejected']),
                created_at=timezone.now() - datetime.timedelta(hours=random.randint(1, 100))
            )

    # 10. Dashboard Announcements and Notifications
    print("Announcing dashboard company policy updates...")
    CompanyAnnouncement.objects.get_or_create(
        title="Welcome to YGR HRMS portal",
        defaults={
            'content': "We are pleased to roll out the all-new unified React-based self-service portal.",
            'announcement_type': 'General',
            'created_by': primary_md or users[0]
        }
    )
    
    CompanyAnnouncement.objects.get_or_create(
        title="Sandwich Leave Policy Updates",
        defaults={
            'content': "Please note that the sandwich leave rule is active. Any holidays sandwiched between leaves count as absent.",
            'announcement_type': 'Policy',
            'created_by': primary_md or users[0]
        }
    )

    print("Creating holiday workflow notifications...")
    for u in users[:10]:
        HolidayNotification.objects.create(
            recipient=u,
            message="May Day holiday has been approved by Managing Director.",
            notif_type='approved',
            is_read=False
        )

    print("\nDatabase population completed successfully!")
    print(f"Users: {User.objects.count()}")
    print(f"Attendance records: {Attendance.objects.count()}")
    print(f"Payslips: {Payslip.objects.count()}")
    print(f"Leave requests: {Leave.objects.count()}")
    print(f"Projects: {Project.objects.count()}")
    print(f"Tasks: {Task.objects.count()}")
    print(f"Reports: {DailyReport.objects.count()}")
    print(f"Messages: {ChatMessage.objects.count()}")
    print(f"Call sessions: {CallSession.objects.count()}")
    print(f"Holidays: {Holiday.objects.count()}")
    print(f"Announcements: {CompanyAnnouncement.objects.count()}")

if __name__ == '__main__':
    populate()
