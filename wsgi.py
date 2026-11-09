import sys
import os

# Path to your project folder on PythonAnywhere (replace YOURNAME)
path = '/home/YOURNAME/aktivitetschecken'
if path not in sys.path:
    sys.path.insert(0, path)

os.environ['SECRET_KEY'] = '4a5126a30ca371efdc0f7aba7fe08d189780450e956239f8e722fd13fba793cf'

from app import app as application
