from flask import Flask, request, jsonify, render_template, redirect, url_for
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import bcrypt
from database import db
from bson import ObjectId
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key')  # Change this in production
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  # Tokens don't expire
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'

jwt = JWTManager(app)

@jwt.unauthorized_loader
def unauthorized_callback(callback):
    print(f"Unauthorized callback triggered: {callback}")
    return jsonify({
        'error': 'Missing Authorization Header',
        'message': callback
    }), 401

@jwt.invalid_token_loader
def invalid_token_callback(callback):
    print(f"Invalid token callback triggered: {callback}")
    return jsonify({
        'error': 'Invalid token',
        'message': callback
    }), 401

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_data):
    print(f"Expired token callback triggered - Header: {jwt_header}, Data: {jwt_data}")
    return jsonify({
        'error': 'Token has expired',
        'message': 'Please log in again'
    }), 401

@jwt.needs_fresh_token_loader
def token_not_fresh_callback(jwt_header, jwt_data):
    print(f"Token not fresh callback triggered - Header: {jwt_header}, Data: {jwt_data}")
    return jsonify({
        'error': 'Fresh token required',
        'message': 'Please log in again'
    }), 401

@jwt.revoked_token_loader
def revoked_token_callback(jwt_header, jwt_data):
    print(f"Revoked token callback triggered - Header: {jwt_header}, Data: {jwt_data}")
    return jsonify({
        'error': 'Token has been revoked',
        'message': 'Please log in again'
    }), 401

# Add a before_request handler to log all requests
@app.before_request
def log_request_info():
    print('Request Headers:', dict(request.headers))
    print('Request Method:', request.method)
    print('Request URL:', request.url)

# MongoDB connection with error handling
def connect_db():
    try:
        client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=5000)
        # Test the connection
        client.admin.command('ping')
        print("Successfully connected to MongoDB")
        return client['flex_me']
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        return None

db_mongo = connect_db()

@app.before_request
def check_db_connection():
    global db_mongo
    if db_mongo is None:
        db_mongo = connect_db()
    if db_mongo is None and request.endpoint not in ['static', 'home', 'login', 'register', 'about', 'contact']:
        return jsonify({'error': 'Database connection failed'}), 500

# Routes for pages
@app.route('/')
def home():
    print("home.html")
    return render_template('home.html')

@app.route('/dashboard')
@jwt_required()
def dashboard():
    print("Dashboard endpoint")
    print("Headers:", dict(request.headers))
    try:
        print("Getting current user ID")
        current_user_id = get_jwt_identity()
        print(f"Current user ID: {current_user_id}")
        user = db_mongo.users.find_one({'_id': ObjectId(current_user_id)})
        
        if not user:
            print("User not found")
            return jsonify({"error": "User not found"}), 404
            
        print(f"User found: {user['username']}")
        return render_template('dashboard.html', username=user['username'])
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        return jsonify({"error": "Authentication failed"}), 401

@app.route('/api/verify-token')
@jwt_required()
def verify_token():
    try:
        current_user_id = get_jwt_identity()
        user = db_mongo.users.find_one({'_id': ObjectId(current_user_id)})
        return jsonify({
            "valid": True,
            "username": user['username'] if user else None
        })
    except Exception as e:
        return jsonify({"valid": False, "error": str(e)}), 401

@app.route('/api/dashboard')
@jwt_required()
def dashboard_data():
    current_user = get_jwt_identity()
    user = db_mongo.users.find_one({'_id': ObjectId(current_user)})
    if user:
        return jsonify({
            'username': user['username'],
            'email': user['email']
        })
    return jsonify({'error': 'User not found'}), 404

@app.route('/profile')
@jwt_required()
def profile():
    return render_template('profile.html')

@app.route('/history')
@jwt_required()
def history():
    return render_template('history.html')

@app.route('/create-campaign')
@jwt_required()
def create_campaign_page():
    return render_template('create-campaign.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    print("Start logging in")
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        print(f"Login attempt: username={username}")
        
        if not username or not password:
            return jsonify({"error": "Missing username or password"}), 400
            
        user = db_mongo.users.find_one({'username': username})
        print(f"Found user: {bool(user)}")
        
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
            print("Password verified")
            user_id = str(user['_id'])
            print(f"Creating token for user ID: {user_id}")
            access_token = create_access_token(identity=user_id)
            print(f"Access token created: {access_token}")
            response_data = {
                "token": access_token,
                "username": username
            }
            print(f"Sending response: {response_data}")
            return jsonify(response_data)
        else:
            return jsonify({"error": "Invalid username or password"}), 401
            
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'GET':
        return render_template('register.html')
    elif request.method == 'POST':
        try:
            data = request.get_json()
            
            # Check if username or email already exists
            if db_mongo.users.find_one({'username': data['username']}):
                return jsonify({'error': 'Username already exists'}), 400
            if db_mongo.users.find_one({'email': data['email']}):
                return jsonify({'error': 'Email already exists'}), 400
            
            # Hash the password
            hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
            
            # Create user document
            user = {
                'username': data['username'],
                'firstName': data['firstName'],
                'lastName': data['lastName'],
                'email': data['email'],
                'password': hashed,
                'phone': {
                    'countryCode': data['countryCode'],
                    'number': data['phone']
                },
                'address': {
                    'street': data['street'],
                    'city': data['city'],
                    'state': data['state'],
                    'country': data['country'],
                    'postal': data['postal']
                },
                'securityQuestion': data['securityQuestion'],
                'securityAnswer': data['securityAnswer'],
                'createdAt': datetime.utcnow(),
                'status': 'active',
                'role': 'user'
            }
            
            # Insert user into database
            result = db_mongo.users.insert_one(user)
            
            if result.inserted_id:
                return jsonify({'message': 'Registration successful'}), 201
            else:
                return jsonify({'error': 'Failed to create user'}), 500
                
        except KeyError as e:
            return jsonify({'error': f'Missing required field: {str(e)}'}), 400
        except Exception as e:
            print(f"Registration error: {str(e)}")
            return jsonify({'error': 'An error occurred during registration'}), 500

# Campaign routes
@app.route('/api/campaigns', methods=['GET'])
@jwt_required()
def get_campaigns():
    try:
        campaigns = list(db_mongo.campaigns.find())
        return jsonify(campaigns), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/campaigns', methods=['POST'])
@jwt_required()
def create_campaign_api():
    try:
        data = request.get_json()
        campaign = {
            'creator_id': get_jwt_identity(),
            'title': data['title'],
            'description': data['description'],
            'goal_amount': data['goalAmount'],
            'current_amount': 0,
            'status': 'active',
            'created_at': datetime.utcnow()
        }
        result = db_mongo.campaigns.insert_one(campaign)
        return jsonify({'message': 'Campaign created', 'id': str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Donation routes
@app.route('/api/donations', methods=['POST'])
@jwt_required()
def create_donation():
    try:
        data = request.get_json()
        donation = {
            'campaign_id': data['campaignId'],
            'donor_id': get_jwt_identity(),
            'amount': data['amount'],
            'message': data.get('message', ''),
            'created_at': datetime.utcnow()
        }
        result = db_mongo.donations.insert_one(donation)
        
        # Update campaign amount
        db_mongo.campaigns.update_one(
            {'_id': ObjectId(data['campaignId'])},
            {'$inc': {'current_amount': data['amount']}}
        )
        
        return jsonify({'message': 'Donation successful', 'id': str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User routes
@app.route('/api/users/profile', methods=['GET'])
@jwt_required()
def get_profile_api():
    user_id = get_jwt_identity()
    user = db_mongo.users.find_one({'_id': ObjectId(user_id)})
    if user:
        user['_id'] = str(user['_id'])
        return jsonify(user)
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/users/profile', methods=['PUT'])
@jwt_required()
def update_profile_api():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Remove password from update data if present
    if 'password' in data:
        del data['password']
    
    db_mongo.users.update_one({'_id': ObjectId(user_id)}, {'$set': data})
    return jsonify({'message': 'Profile updated successfully'})

# Migration routes
@app.route('/api/migrate', methods=['POST'])
def migrate_data():
    try:
        data = request.get_json()
        users = data.get('users', [])
        
        # Perform migration
        success = db.migrate_from_localstorage(users)
        
        if success:
            return jsonify({'message': 'Migration successful'}), 200
        else:
            return jsonify({'error': 'Migration failed'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/migration-status')
def check_migration_status():
    # Check if any users exist in MongoDB
    has_users = db_mongo.users.count_documents({}) > 0
    return jsonify({'migrated': has_users})

# Test route for database connection
@app.route('/test-db')
def test_db():
    try:
        # Test database connection
        client.admin.command('ping')
        # Get some basic stats
        stats = {
            'users': db_mongo.users.count_documents({}),
            'campaigns': db_mongo.campaigns.count_documents({}),
            'donations': db_mongo.donations.count_documents({})
        }
        return jsonify({
            'status': 'success',
            'message': 'Database connection successful',
            'stats': stats
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': f'Database error: {str(e)}'
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500
