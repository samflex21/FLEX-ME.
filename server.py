from app import app
from database import db
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def configure_server():
    """Configure server settings"""
    # Server configurations
    app.config['SERVER_NAME'] = os.getenv('SERVER_NAME', 'localhost:5000')
    app.config['PREFERRED_URL_SCHEME'] = 'http'
    
    # Security configurations
    app.config['SESSION_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
    app.config['SESSION_COOKIE_HTTPONLY'] = True
    app.config['PERMANENT_SESSION_LIFETIME'] = 1800  # 30 minutes
    
    # Development configurations
    app.config['TEMPLATES_AUTO_RELOAD'] = True
    
    return app

def run_server():
    """Run the server with the specified configuration"""
    app = configure_server()
    
    # Get configuration from environment variables
    host = os.getenv('FLASK_HOST', '127.0.0.1')
    port = int(os.getenv('FLASK_PORT', 5000))
    debug = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    
    # Additional server startup tasks
    print(f"Server starting on {host}:{port}")
    print(f"Debug mode: {'on' if debug else 'off'}")
    
    # Check database connection
    if db.db is None:
        print("Warning: Database connection not established")
    else:
        print("Database connection successful")
    
    return app.run(
        host=host,
        port=port,
        debug=debug,
        use_reloader=debug
    )

if __name__ == '__main__':
    run_server()
