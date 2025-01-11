from flask import Flask, request, jsonify, render_template
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
jwt = JWTManager(app)

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
    return render_template('home.html')

@app.route('/dashboard.html')
@jwt_required()
def dashboard_page():
    return render_template('dashboard.html')

@app.route('/profile.html')
@jwt_required()
def profile_page():
    return render_template('profile.html')

@app.route('/history.html')
@jwt_required()
def history_page():
    return render_template('history.html')

@app.route('/create-campaign.html')
@jwt_required()
def create_campaign_page():
    return render_template('create-campaign.html')

@app.route('/about.html')
def about_page():
    return render_template('about.html')

@app.route('/contact.html')
def contact_page():
    return render_template('contact.html')

@app.route('/admin.html')
def admin_page():
    return render_template('admin.html')

@app.route('/login.html', methods=['GET', 'POST'])
def login_page():
    if request.method == 'GET':
        return render_template('login.html')
    elif request.method == 'POST':
        data = request.get_json()
        user = db_mongo.users.find_one({'username': data['username']})
        
        if user and bcrypt.checkpw(data['password'].encode('utf-8'), user['password']):
            access_token = create_access_token(identity=str(user['_id']))
            return jsonify({
                'access_token': access_token,
                'username': user['username']
            })
        
        return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/register.html', methods=['GET', 'POST'])
def register_page():
    if request.method == 'GET':
        return render_template('register.html')
    elif request.method == 'POST':
        data = request.get_json()
        
        if db_mongo.users.find_one({'username': data['username']}):
            return jsonify({'error': 'Username already exists'}), 400
        
        # Hash the password
        hashed = bcrypt.hashpw(data['password'].encode('utf-8'), bcrypt.gensalt())
        
        user = {
            'username': data['username'],
            'password': hashed,
            'email': data['email'],
            'securityQuestion': data['securityQuestion'],
            'securityAnswer': data['securityAnswer']
        }
        
        db_mongo.users.insert_one(user)
        return jsonify({'message': 'Registration successful'}), 201

# Campaign routes
@app.route('/api/campaigns.html', methods=['GET'])
@jwt_required()
def get_campaigns():
    try:
        campaigns = list(db_mongo.campaigns.find())
        return jsonify(campaigns), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/campaigns.html', methods=['POST'])
@jwt_required()
def create_campaign():
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
@app.route('/api/donations.html', methods=['POST'])
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
@app.route('/api/users/profile.html', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = db_mongo.users.find_one({'_id': user_id})
    if user:
        del user['password']  # Don't send password
        return jsonify(user)
    return jsonify({'error': 'User not found'}), 404

@app.route('/api/users/profile.html', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # Don't allow password update through this route
    if 'password' in data:
        del data['password']
    
    db_mongo.users.update_one({'_id': user_id}, {'$set': data})
    return jsonify({'message': 'Profile updated successfully'})

# Migration routes
@app.route('/api/migrate.html', methods=['POST'])
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

@app.route('/api/migration-status.html')
def check_migration_status():
    # Check if any users exist in MongoDB
    has_users = db_mongo.users.count_documents({}) > 0
    return jsonify({'migrated': has_users})

# Test route for database connection
@app.route('/test-db.html')
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
