import random
import calendar
from decimal import Decimal
from datetime import date, datetime, time, timedelta

from django.db import migrations
from hr.models import (
    User, Attendance, Leave, Holiday, SalaryStructure, 
    Payslip, Project, Team, Task, DailyReport, PayrollAuditLog
)

# Indian names pool
HR_NAMES = [
    ("Ananya", "Sharma", "Female"),
    ("Rahul", "Verma", "Male"),
    ("Priya", "Iyer", "Female"),
    ("Amit", "Patel", "Male"),
    ("Neha", "Nair", "Female")
]

MGR_NAMES = [
    ("Rajesh", "Kumar", "Male"),
    ("Sanjay", "Dutt", "Male")
]

TL_NAMES = [
    ("Karan", "Johar", "Male"),
    ("Ekta", "Kapoor", "Female"),
    ("Aditya", "Chopra", "Male")
]

EMP_NAMES = [
    ("Aarav", "Mehta", "Male"),
    ("Vivaan", "Shah", "Male"),
    ("Aditya", "Joshi", "Male"),
    ("Vihaan", "Kulkarni", "Male"),
    ("Arjun", "Deshmukh", "Male"),
    ("Sai", "Patil", "Female"),
    ("Reyansh", "Shinde", "Male"),
    ("Aanya", "Deshpande", "Female"),
    ("Diya", "Gokhale", "Female"),
    ("Pihu", "Bhat", "Female"),
    ("Prisha", "Rao", "Female"),
    ("Sanya", "Nair", "Female"),
    ("Ishaan", "Hegde", "Male"),
    ("Aarush", "Bhatia", "Male"),
    ("Kabir", "Malhotra", "Male"),
    ("Rudra", "Kapoor", "Male"),
    ("Ayush", "Khanna", "Male"),
    ("Krishna", "Gupta", "Male"),
    ("Siddharth", "Sinha", "Male"),
    ("Ishani", "Sen", "Female"),
    ("Meera", "Bose", "Female"),
    ("Avni", "Chatterjee", "Female"),
    ("Arika", "Banerjee", "Female"),
    ("Rohan", "Roy", "Male"),
    ("Tushar", "Das", "Male")
]

def gen_pan():
    letters = "".join(random.choices("ABCDEFGHIJKLMNOPQRSTUVWXYZ", k=5))
    digits = "".join(random.choices("0123456789", k=4))
    chk = random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    return f"{letters}{digits}{chk}"

def gen_uan():
    return "100" + "".join(random.choices("0123456789", k=9))

def get_random_date_months_ago(months_ago):
    days_ago = months_ago * 30
    base_date = date(2026, 6, 25) - timedelta(days=days_ago)
    offset = random.randint(-5, 5)
    return base_date + timedelta(days=offset)

def seed_holidays():
    Holiday.objects.all().delete()
    holidays_list = [
        # 2025 Holidays
        ("Republic Day", date(2025, 1, 26)),
        ("Holi", date(2025, 3, 14)),
        ("Good Friday", date(2025, 4, 18)),
        ("Independence Day", date(2025, 8, 15)),
        ("Gandhi Jayanti", date(2025, 10, 2)),
        ("Dussehra", date(2025, 10, 12)),
        ("Diwali", date(2025, 10, 20)),
        ("Christmas", date(2025, 12, 25)),
        # 2026 Holidays
        ("New Year Day", date(2026, 1, 1)),
        ("Republic Day", date(2026, 1, 26)),
        ("Holi", date(2026, 3, 3)),
        ("Good Friday", date(2026, 4, 3)),
        ("Independence Day", date(2026, 8, 15)),
        ("Gandhi Jayanti", date(2026, 10, 2)),
        ("Dussehra", date(2026, 10, 22)),
        ("Diwali", date(2026, 11, 8)),
        ("Christmas", date(2026, 12, 25)),
    ]
    for name, dt in holidays_list:
        Holiday.objects.get_or_create(name=name, date=dt)
    return set(h.date for h in Holiday.objects.all())

def make_salary_structure(employee, monthly_gross):
    basic = monthly_gross * Decimal('0.50')
    hra = basic * Decimal('0.40')
    transport = Decimal('1600.00') if monthly_gross >= 10000 else Decimal('0.00')
    medical = Decimal('1250.00') if monthly_gross >= 10000 else Decimal('0.00')
    special = monthly_gross - (basic + hra + transport + medical)
    if special < 0:
        special = Decimal('0.00')
        
    pf_enabled = True
    esi_enabled = True if monthly_gross <= 21000 else False
    pt_enabled = True
    pt_amount = Decimal('200.00')
    
    tds = Decimal('0.00')
    if monthly_gross > 150000:
        tds = monthly_gross * Decimal('0.15')
    elif monthly_gross > 100000:
        tds = monthly_gross * Decimal('0.10')
    elif monthly_gross > 50000:
        tds = monthly_gross * Decimal('0.05')
        
    return SalaryStructure.objects.create(
        employee=employee,
        monthly_gross=monthly_gross,
        basic_salary=basic,
        hra=hra,
        transport_allowance=transport,
        medical_allowance=medical,
        special_allowance=special,
        bonus=Decimal('0.00'),
        pf_enabled=pf_enabled,
        pf_rate=Decimal('12.00'),
        pf_amount=Decimal('0.00'),
        esi_enabled=esi_enabled,
        esi_rate=Decimal('0.75'),
        esi_amount=Decimal('0.00'),
        pt_enabled=pt_enabled,
        pt_amount=pt_amount,
        tds_amount=tds,
        other_deductions=Decimal('0.00'),
        bank_name="HDFC Bank",
        account_number=f"50100{random.randint(1000000, 9999999)}",
        ifsc_code="HDFC0000123",
        pan=gen_pan(),
        uan=gen_uan(),
        aadhaar=employee.aadhaar
    )

def generate_attendance_and_leaves(user, holiday_dates):
    if not user.date_of_joining:
        return
    
    start_date = user.date_of_joining
    end_date = date(2026, 6, 25) # Current Date
    
    curr = start_date
    while curr <= end_date:
        year = curr.year
        month = curr.month
        
        days_in_month = calendar.monthrange(year, month)[1]
        start_day = 1
        if year == start_date.year and month == start_date.month:
            start_day = start_date.day
            
        end_day = days_in_month
        if year == end_date.year and month == end_date.month:
            end_day = end_date.day
            
        all_days = [date(year, month, d) for d in range(start_day, end_day + 1)]
        
        weekdays = []
        saturdays = []
        sundays = []
        
        for d in all_days:
            if d.weekday() == 6:
                sundays.append(d)
            elif d.weekday() == 5:
                saturdays.append(d)
            else:
                if d not in holiday_dates:
                    weekdays.append(d)
                    
        # Sunday week offs
        for sun in sundays:
            Attendance.objects.get_or_create(
                user=user,
                date=sun,
                defaults={'status': 'Off Day', 'total_hours': 0}
            )
            
        # Saturday half days/off days
        for sat in saturdays:
            if Attendance.objects.filter(user=user, date=sat).exists():
                continue
            if random.random() < 0.4: # 40% Half Day
                check_in_dt = datetime.combine(sat, time(9, 30)) + timedelta(minutes=random.randint(-15, 30))
                check_out_dt = check_in_dt + timedelta(hours=4, minutes=random.randint(30, 60))
                Attendance.objects.create(
                    user=user,
                    date=sat,
                    check_in_time=check_in_dt,
                    check_out_time=check_out_dt,
                    status="Half Day",
                    total_hours=round((check_out_dt - check_in_dt).total_seconds() / 3600, 2)
                )
            else:
                Attendance.objects.create(
                    user=user,
                    date=sat,
                    status="Off Day",
                    total_hours=0
                )
                
        # Holiday attendance
        for d in all_days:
            if d in holiday_dates:
                Attendance.objects.get_or_create(
                    user=user,
                    date=d,
                    defaults={'status': 'Holiday', 'total_hours': 0}
                )
                
        # Weekdays shuffle allocation
        random.shuffle(weekdays)
        total_weekdays = len(weekdays)
        
        wfh_count = random.randint(2, 4)
        late_count = random.randint(2, 5)
        leave_count = random.randint(1, 3)
        absent_count = random.randint(0, 2)
        
        if wfh_count + late_count + leave_count + absent_count > total_weekdays:
            wfh_count = max(0, total_weekdays // 4)
            late_count = max(0, total_weekdays // 4)
            leave_count = max(0, total_weekdays // 5)
            absent_count = max(0, total_weekdays // 10)
            
        wfh_dates = weekdays[:wfh_count]
        late_dates = weekdays[wfh_count:wfh_count+late_count]
        leave_dates = weekdays[wfh_count+late_count:wfh_count+late_count+leave_count]
        absent_dates = weekdays[wfh_count+late_count+leave_count:wfh_count+late_count+leave_count+absent_count]
        present_dates = weekdays[wfh_count+late_count+leave_count+absent_count:]
        
        # Present WFH
        for d in wfh_dates:
            if Attendance.objects.filter(user=user, date=d).exists():
                continue
            check_in_dt = datetime.combine(d, time(9, 0)) + timedelta(minutes=random.randint(-10, 25))
            check_out_dt = check_in_dt + timedelta(hours=9, minutes=random.randint(0, 30))
            Attendance.objects.create(
                user=user,
                date=d,
                check_in_time=check_in_dt,
                check_out_time=check_out_dt,
                status="Present",
                total_hours=round((check_out_dt - check_in_dt).total_seconds() / 3600, 2)
            )
            
        # Present (Late)
        for d in late_dates:
            if Attendance.objects.filter(user=user, date=d).exists():
                continue
            check_in_dt = datetime.combine(d, time(9, 31)) + timedelta(minutes=random.randint(0, 44))
            check_out_dt = check_in_dt + timedelta(hours=8, minutes=random.randint(30, 60))
            Attendance.objects.create(
                user=user,
                date=d,
                check_in_time=check_in_dt,
                check_out_time=check_out_dt,
                status="Present (Late)",
                total_hours=round((check_out_dt - check_in_dt).total_seconds() / 3600, 2)
            )
            
        # Leave Requests & Leaves
        for d in leave_dates:
            if Attendance.objects.filter(user=user, date=d).exists():
                continue
            is_curr_m = (year == end_date.year and month == end_date.month)
            l_status = "Approved"
            if is_curr_m:
                l_status = random.choice(["Approved", "Pending TeamLead Approval", "Rejected"])
            else:
                l_status = random.choice(["Approved", "Approved", "Approved", "Rejected"])
                
            leave_type = random.choice(["Paid", "Paid", "Paid", "Unpaid"])
            reasons = [
                "Casual Leave - Family function at native place",
                "Sick Leave - Down with viral fever and flu",
                "Earned Leave - Vacation trip with family",
                "Casual Leave - Urgent banking and property work",
                "Sick Leave - Medical appointment and rest",
            ]
            
            Leave.objects.create(
                user=user,
                from_date=d,
                to_date=d,
                reason=random.choice(reasons),
                leave_type=leave_type,
                status=l_status,
                approved_tl=(l_status == "Approved"),
                approved_manager=(l_status == "Approved"),
                approved_hr=(l_status == "Approved"),
                approved_md=(l_status == "Approved"),
            )
            
            Attendance.objects.create(
                user=user,
                date=d,
                status="Absent",
                total_hours=0
            )
            
        # Absent Present (Unexcused)
        for d in absent_dates:
            if Attendance.objects.filter(user=user, date=d).exists():
                continue
            Attendance.objects.create(
                user=user,
                date=d,
                status="Absent",
                total_hours=0
            )
            
        # Standard Present
        for d in present_dates:
            if Attendance.objects.filter(user=user, date=d).exists():
                continue
            check_in_dt = datetime.combine(d, time(9, 0)) + timedelta(minutes=random.randint(-15, 29))
            check_out_dt = check_in_dt + timedelta(hours=9, minutes=random.randint(0, 30))
            Attendance.objects.create(
                user=user,
                date=d,
                check_in_time=check_in_dt,
                check_out_time=check_out_dt,
                status="Present",
                total_hours=round((check_out_dt - check_in_dt).total_seconds() / 3600, 2)
            )
            
        if curr.month == 12:
            curr = date(curr.year + 1, 1, 1)
        else:
            curr = date(curr.year, curr.month + 1, 1)

def generate_payroll_history(user):
    from hr.views import calculate_payroll_data, generate_payslip_pdf_file
    
    start_date = user.date_of_joining
    end_date = date(2026, 6, 25)
    
    curr = start_date
    while curr <= end_date:
        year = curr.year
        month = curr.month
        
        is_curr_m = (year == end_date.year and month == end_date.month)
        
        calc = calculate_payroll_data(user, year, month)
        
        payslip, created = Payslip.objects.get_or_create(
            employee=user,
            month=month,
            year=year,
            defaults={
                'basic_salary': Decimal(str(calc['basic_salary'])),
                'hra': Decimal(str(calc['hra'])),
                'transport_allowance': Decimal(str(calc['transport_allowance'])),
                'medical_allowance': Decimal(str(calc['medical_allowance'])),
                'special_allowance': Decimal(str(calc['special_allowance'])),
                'bonus': Decimal(str(calc['bonus'])),
                'pf_deduction': Decimal(str(calc['pf_deduction'])),
                'esi_deduction': Decimal(str(calc['esi_deduction'])),
                'professional_tax': Decimal(str(calc['professional_tax'])),
                'tds': Decimal(str(calc['tds'])),
                'other_deductions': Decimal(str(calc['other_deductions'])),
                'working_days': calc['working_days'],
                'days_present': calc['present_days'],
                'days_absent': calc['absent_days'],
                'leaves_taken': calc['paid_leaves'],
                'unpaid_leave_days': calc['unpaid_leaves'],
                'half_days': calc['half_days'],
                'holidays': calc['holidays'],
                'week_offs': calc['week_offs'],
                'employee_name': user.get_full_name() or user.username,
                'designation': user.designation or user.role,
                'bank_name': calc['bank_name'],
                'account_number': calc['account_number'],
                'ifsc_code': calc['ifsc_code'],
                'pan': calc['pan'],
                'uan': calc['uan'],
                'aadhaar': calc['aadhaar'],
            }
        )
        
        if created:
            if is_curr_m:
                payslip.status = 'Pending'
                payslip.is_published = False
            else:
                payslip.status = 'Paid'
                payslip.payment_date = date(year, month, 28) + timedelta(days=7) # Paid on 5th of next month
                payslip.is_published = True
                
            payslip.save()
            generate_payslip_pdf_file(payslip)
            payslip.save()
            
        if curr.month == 12:
            curr = date(curr.year + 1, 1, 1)
        else:
            curr = date(curr.year, curr.month + 1, 1)

def run_migration_seed(apps, schema_editor):
    import sys
    if 'test' in sys.argv or 'test_coverage' in sys.argv:
        print("--- Skipping HRMS Data Migration Seeder in Test Run ---")
        return
    print("--- Running HRMS Data Migration Seeder ---")
    
    # 1. Clean existing records
    print("  Wiping tables...")
    PayrollAuditLog.objects.all().delete()
    Payslip.objects.all().delete()
    SalaryStructure.objects.all().delete()
    Leave.objects.all().delete()
    Attendance.objects.all().delete()
    Task.objects.all().delete()
    DailyReport.objects.all().delete()
    Project.objects.all().delete()
    Team.objects.all().delete()
    User.objects.all().delete()
    
    # 2. Seed Holidays
    print("  Creating holidays...")
    holiday_dates = seed_holidays()
    
    # 3. MD User
    print("  Creating Managing Director...")
    md_join = get_random_date_months_ago(10)
    md_user = User(
        username='md001',
        email='vikram.singhania@ygrtech.com',
        emp_id='MD001',
        first_name='Vikram',
        last_name='Singhania',
        role='MD',
        designation='Managing Director',
        aadhaar='123456789012',
        gender='Male',
        date_of_joining=md_join,
        department='fullstack_dev',
        is_staff=True,
        is_superuser=True,
        is_active=True,
        reporting_manager=None
    )
    md_user.set_password('password123')
    md_user.save()
    make_salary_structure(md_user, Decimal('320000.00'))
    
    # 4. Managers
    print("  Creating Managers...")
    mgrs = []
    for i, (fn, ln, gen) in enumerate(MGR_NAMES, 1):
        mgr_id = f"MGR00{i}"
        mgr_join = get_random_date_months_ago(9)
        mgr = User(
            username=mgr_id.lower(),
            email=f"{fn.lower()}.{ln.lower()}@ygrtech.com",
            emp_id=mgr_id,
            first_name=fn,
            last_name=ln,
            role='Manager',
            designation='Manager',
            aadhaar=f"32345678901{i}",
            gender=gen,
            date_of_joining=mgr_join,
            department='fullstack_dev',
            is_active=True,
            reporting_manager=md_user
        )
        mgr.set_password('password123')
        mgr.save()
        gross = Decimal(str(random.choice([75000, 85000, 95000, 110000])))
        make_salary_structure(mgr, gross)
        mgrs.append(mgr)
        
    # 5. Team Leaders
    print("  Creating Team Leaders...")
    tls = []
    for i, (fn, ln, gen) in enumerate(TL_NAMES, 1):
        tl_id = f"TL00{i}"
        tl_join = get_random_date_months_ago(random.choice([8, 9]))
        dept = ['python_dev', 'testing', 'devops'][i-1]
        
        # Determine manager to report to
        reporting_mgr = mgrs[0] if i <= 2 else mgrs[1]
        
        tl = User(
            username=tl_id.lower(),
            email=f"{fn.lower()}.{ln.lower()}@ygrtech.com",
            emp_id=tl_id,
            first_name=fn,
            last_name=ln,
            role='TeamLead',
            designation='Team Leader',
            aadhaar=f"42345678901{i}",
            gender=gen,
            date_of_joining=tl_join,
            department=dept,
            is_active=True,
            reporting_manager=reporting_mgr
        )
        tl.set_password('password123')
        tl.save()
        gross = Decimal(str(random.choice([48000, 52000, 58000, 65000])))
        make_salary_structure(tl, gross)
        tls.append(tl)
        
    # 6. HR Executives
    print("  Creating HR...")
    hrs = []
    for i, (fn, ln, gen) in enumerate(HR_NAMES, 1):
        hr_id = f"HR00{i}"
        hr_join = get_random_date_months_ago(random.choice([9, 10]))
        hr = User(
            username=hr_id.lower(),
            email=f"{fn.lower()}.{ln.lower()}@ygrtech.com",
            emp_id=hr_id,
            first_name=fn,
            last_name=ln,
            role='HR',
            designation='HR Executive',
            aadhaar=f"22345678901{i}",
            gender=gen,
            date_of_joining=hr_join,
            department='digital_marketing',
            is_active=True,
            reporting_manager=md_user
        )
        hr.set_password('password123')
        hr.save()
        gross = Decimal(str(random.choice([32000, 38000, 45000, 50000, 55000])))
        make_salary_structure(hr, gross)
        hrs.append(hr)
        
    # 7. Employees
    print("  Creating 25 Employees...")
    emps = []
    joining_buckets = [10]*8 + [8]*5 + [6]*5 + [4]*4 + [2]*3
    random.shuffle(joining_buckets)
    
    for i, (fn, ln, gen) in enumerate(EMP_NAMES, 1):
        emp_id = f"EMP{i:03d}"
        months_ago = joining_buckets[i-1]
        emp_join = get_random_date_months_ago(months_ago)
        
        if i <= 9:
            dept = 'python_dev'
            designation = 'Python Developer'
            reporting_tl = tls[0]
        elif i <= 17:
            dept = 'testing'
            designation = 'QA Test Engineer'
            reporting_tl = tls[1]
        else:
            dept = 'devops'
            designation = 'DevOps Engineer'
            reporting_tl = tls[2]
        
        emp = User(
            username=emp_id.lower(),
            email=f"{fn.lower()}.{ln.lower()}@ygrtech.com",
            emp_id=emp_id,
            first_name=fn,
            last_name=ln,
            role='Employee',
            designation=designation,
            aadhaar=f"5234567890{i:02d}",
            gender=gen,
            date_of_joining=emp_join,
            department=dept,
            is_active=True,
            reporting_manager=reporting_tl
        )
        emp.set_password('password123')
        emp.save()
        gross = Decimal(str(random.choice([19500, 22000, 26000, 31000, 35000, 42000])))
        make_salary_structure(emp, gross)
        emps.append(emp)
        
    # 8. Teams
    print("  Creating Teams...")
    team1 = Team.objects.create(name="Software Development Team", lead=tls[0])
    team1.members.add(*emps[0:9])
    
    team2 = Team.objects.create(name="QA Testing Team", lead=tls[1])
    team2.members.add(*emps[9:17])
    
    team3 = Team.objects.create(name="DevOps & Infrastructure Team", lead=tls[2])
    team3.members.add(*emps[17:25])
    
    # 9. Projects
    print("  Creating Projects...")
    proj1 = Project.objects.create(
        project_id="PROJ-01",
        name="YGR Portal Software Platform Upgrade",
        description="Upgrading core Django and Frontend infrastructure to modern stacks.",
        startdate=date(2025, 9, 1),
        deadline=date(2026, 8, 30),
        assigned_manager=mgrs[0],
        assigned_team=team1,
        status="Assigned to Team"
    )
    proj2 = Project.objects.create(
        project_id="PROJ-02",
        name="Quality Assurance Overhaul",
        description="Developing automated Selenium/PyTest coverage suites across all platforms.",
        startdate=date(2025, 10, 1),
        deadline=date(2026, 7, 15),
        assigned_manager=mgrs[0],
        assigned_team=team2,
        status="Assigned to Team"
    )
    proj3 = Project.objects.create(
        project_id="PROJ-03",
        name="DevOps & Cloud Orchestration",
        description="Migrating manual processes to Ansible and Kubernetes automation.",
        startdate=date(2025, 10, 15),
        deadline=date(2026, 9, 30),
        assigned_manager=mgrs[1],
        assigned_team=team3,
        status="Assigned to Team"
    )
    
    # 10. Tasks
    print("  Creating Tasks...")
    tasks_pool = [
        ("Core Database Schema Migration", "Optimize database schema and setup indexes.", proj1, emps[0:3]),
        ("Implement OAuth2 Social Login", "Allow sign-on using Google and GitHub credentials.", proj1, emps[3:6]),
        ("UI Redesign for HR Panels", "Update base layouts to clean responsive styles.", proj1, emps[6:9]),
        ("Write Integration Tests for Payroll", "Verify payroll proration and deduction calculations.", proj2, emps[9:13]),
        ("Setup Load Testing on Login API", "Run locust script to check load capacity.", proj2, emps[13:17]),
        ("CI/CD Pipeline Setup", "Configure GitHub actions for lint checks and tests.", proj3, emps[17:21]),
        ("Configure AWS EKS Clusters", "Prepare Kubernetes manifest and deploy clusters.", proj3, emps[21:25]),
    ]
    
    for name, desc, proj, assigned_users in tasks_pool:
        tk = Task.objects.create(
            task_name=name,
            description=desc,
            start_date=proj.startdate,
            end_date=proj.startdate + timedelta(days=45),
            project=proj,
            status=random.choice(["Completed", "In Progress", "Pending"])
        )
        tk.members.add(*assigned_users)
        
    # 11. Generate Attendance, Leaves, and Payroll History
    print("  Generating employee details history...")
    all_staff = [md_user] + mgrs + tls + hrs + emps
    for idx, u in enumerate(all_staff, 1):
        generate_attendance_and_leaves(u, holiday_dates)
        generate_payroll_history(u)
        
    print("--- Seeding Completed Successfully ---")

class Migration(migrations.Migration):

    dependencies = [
        ('hr', '0004_payslip_aadhaar_salarystructure_aadhaar_user_aadhaar_and_more'),
    ]

    operations = [
        migrations.RunPython(run_migration_seed),
    ]
