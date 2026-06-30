"""
Django settings for hrpanel project.
"""

from pathlib import Path

# ---------------------------------------------------------
# BASE DIRECTORY
# ---------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent.parent


# ---------------------------------------------------------
# SECURITY SETTINGS
# ---------------------------------------------------------
SECRET_KEY = 'django-insecure-$y=&_43u!=r%&^1phr-@@d-!3ajdhax^k26pbyanw2+n5mc7m3'
DEBUG = True
ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "::1",
    "rrgobalitservices.com",
    "www.rrgobalitservices.com",
]

AUTH_USER_MODEL = 'hr.User'
# ---------------------------------------------------------
# INSTALLED APPS
# ---------------------------------------------------------
INSTALLED_APPS = [
    'daphne',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'channels',
    'corsheaders',
    'rest_framework',
    'hr',
]

ASGI_APPLICATION = 'hrpanel.asgi.application'

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels.layers.InMemoryChannelLayer',
    },
}


# ---------------------------------------------------------
# MIDDLEWARE
# ---------------------------------------------------------
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'hr.middleware.HRMSAccessControlMiddleware',
]



# ---------------------------------------------------------
# URLS & WSGI
# ---------------------------------------------------------
ROOT_URLCONF = 'hrpanel.urls'
WSGI_APPLICATION = 'hrpanel.wsgi.application'


# ---------------------------------------------------------
# TEMPLATES
# ---------------------------------------------------------
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / "templates"],  # ✅ templates folder support
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
                
            ],
        },
    },
]


# ---------------------------------------------------------
# DATABASE
# ---------------------------------------------------------
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# ---------------------------------------------------------
# PASSWORD VALIDATION
# ---------------------------------------------------------
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# ---------------------------------------------------------
# INTERNATIONALIZATION
# ---------------------------------------------------------
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True


# ---------------------------------------------------------
# STATIC FILES
# ---------------------------------------------------------
STATIC_URL = '/static/'

# ✅ Adjust this path based on your folder location
# If your "static" folder is inside the MAIN project (same level as manage.py):
STATICFILES_DIRS = [
    BASE_DIR / "static",
]

# (If your static folder is inside hrpanel/, change to BASE_DIR / "hrpanel" / "static")

STATIC_ROOT = BASE_DIR / "staticfiles"  # for collectstatic

 




# ---------------------------------------------------------
# DEFAULT AUTO FIELD
# ---------------------------------------------------------
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


MEDIA_URL = '/media/'

MEDIA_ROOT = BASE_DIR / 'media'

LOGIN_URL = '/login/'

# ---------------------------------------------------------
# CORS & REST FRAMEWORK SETTINGS
# ---------------------------------------------------------
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}
