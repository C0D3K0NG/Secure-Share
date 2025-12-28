import os
import sys

# Add parent directory to path so we can import app.py
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app

# Helper to run on Vercel
# Vercel needs the app object to be exposed directly. 
# But usually it expects `app` variable.

# Middleware to strip /api prefix from request path if present
# This effectively allows /api/stats to be routed to /stats in Flask
class PrefixMiddleware(object):
    def __init__(self, app, prefix=''):
        self.app = app
        self.prefix = prefix

    def __call__(self, environ, start_response):
        if environ['PATH_INFO'].startswith(self.prefix):
            environ['PATH_INFO'] = environ['PATH_INFO'][len(self.prefix):]
            environ['SCRIPT_NAME'] = self.prefix
            return self.app(environ, start_response)
        else:
            start_response('404', [('Content-Type', 'text/plain')])
            return [b"Not Found"]

# Vercel Serverless Function Entry Point
# Since we define rewrites in vercel.json for /api/(.*), the requests come here.
# We apply the middleware to clean the path for Flask routes.
app.wsgi_app = PrefixMiddleware(app.wsgi_app, prefix='/api')
