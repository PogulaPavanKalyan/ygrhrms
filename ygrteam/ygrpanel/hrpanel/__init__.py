import pymysql
pymysql.install_as_MySQLdb()

# Monkey patch hashlib to prevent 'usedforsecurity' TypeError on Python/OpenSSL environments
# that do not support this parameter (like the live Python 3.8 server).
import hashlib

# 1. Patch hashlib.md5
try:
    hashlib.md5(b'', usedforsecurity=False)
except TypeError:
    _orig_md5 = hashlib.md5
    def _patched_md5(*args, **kwargs):
        kwargs.pop('usedforsecurity', None)
        return _orig_md5(*args, **kwargs)
    hashlib.md5 = _patched_md5

# 2. Patch hashlib.new
try:
    hashlib.new('md5', b'', usedforsecurity=False)
except TypeError:
    _orig_new = hashlib.new
    def _patched_new(name, *args, **kwargs):
        kwargs.pop('usedforsecurity', None)
        return _orig_new(name, *args, **kwargs)
    hashlib.new = _patched_new
