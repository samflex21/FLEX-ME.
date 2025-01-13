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
import time
from werkzeug.utils import secure_filename

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
app.config['UPLOAD_FOLDER'] = 'static/uploads'

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
    token = request.cookies.get('token')
    if token:
        return redirect('/dashboard')
    return render_template('home.html')

@app.route('/dashboard')
@jwt_required()
def dashboard():
    print("Dashboard endpoint")
    print("Headers:", dict(request.headers))
    try:
        # Get user ID from token
        current_user_id = get_jwt_identity()
        if not current_user_id:
            print("No user ID in token")
            return jsonify({"error": "Invalid token"}), 401

        print(f"Current user ID: {current_user_id}")
        
        # Find user in database
        user = db_mongo.users.find_one({'_id': ObjectId(current_user_id)})
        if not user:
            print("User not found in database")
            return jsonify({"error": "User not found"}), 404
            
        print(f"User found: {user['username']}")
        
        # Convert ObjectId to string for JSON serialization
        user_data = {
            '_id': str(current_user_id),
            'username': user['username'],
            'email': user.get('email', ''),
            'full_name': user.get('full_name', ''),
            'level': user.get('level', 'Bronze'),
            'points': user.get('points', 0),
            'totalDonated': user.get('totalDonated', 0),
            'peopleHelped': user.get('peopleHelped', 0)
        }
        
        # Get campaigns for this user
        campaigns = list(db_mongo.campaigns.find({'user_id': ObjectId(current_user_id)}))
        campaign_data = []
        for campaign in campaigns:
            campaign_data.append({
                'id': str(campaign['_id']),
                'title': campaign.get('title', ''),
                'goal': campaign.get('goal', 0),
                'raised': campaign.get('raised', 0),
                'status': campaign.get('status', 'active')
            })
            
        # Get recent donations
        donations = list(db_mongo.donations.find(
            {'user_id': ObjectId(current_user_id)}
        ).sort('date', -1).limit(5))
        donation_data = []
        for donation in donations:
            donation_data.append({
                'id': str(donation['_id']),
                'amount': donation.get('amount', 0),
                'campaign': donation.get('campaign_title', ''),
                'date': donation.get('date', '')
            })
        
        # Check if request wants JSON
        if request.headers.get('Accept') == 'application/json':
            return jsonify({
                'user': user_data,
                'campaigns': campaign_data,
                'recent_donations': donation_data
            })
        
        # Otherwise render template
        return render_template(
            'dashboard.html',
            user=user_data,
            campaigns=campaign_data,
            recent_donations=donation_data
        )
        
    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/dashboard-data')
@jwt_required()
def dashboard_data():
    try:
        current_user_id = get_jwt_identity()
        user = db_mongo.users.find_one({'_id': ObjectId(current_user_id)})
        if user:
            user_data = {
                '_id': str(current_user_id),
                'username': user['username'],
                'email': user.get('email', ''),
                'level': user.get('level', 'Bronze'),
                'points': user.get('points', 0),
                'totalDonated': user.get('totalDonated', 0),
                'peopleHelped': user.get('peopleHelped', 0)
            }
            return jsonify(user_data)
        return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        print(f"Dashboard data error: {str(e)}")
        return jsonify({'error': str(e)}), 500

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
def dashboard_data_old():
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
    try:
        current_user = get_jwt_identity()
        print(f"Loading profile page for user: {current_user}")
        return render_template('profile.html')
    except Exception as e:
        print(f"Error loading profile page: {str(e)}")
        return redirect(url_for('login'))

@app.route('/api/user/profile', methods=['GET', 'POST'])
@jwt_required()
def user_profile():
    try:
        current_user = get_jwt_identity()
        print(f"Processing {request.method} request for user: {current_user}")

        # Get user from database
        user = db_mongo.users.find_one({'_id': ObjectId(current_user)})
        if not user:
            print(f"User not found: {current_user}")
            return jsonify({'error': 'User not found'}), 404

        if request.method == 'GET':
            # Format user data
            user_data = {
                'id': str(user['_id']),
                'username': user['username'],
                'email': user.get('email', ''),
                'full_name': user.get('full_name', ''),
                'phone': user.get('phone', ''),
                'location': user.get('location', ''),
                'profile_pic': user.get('profile_pic', ''),
                'level': user.get('level', 'Bronze'),
                'points': user.get('points', 0)
            }
            print(f"Sending user data: {user_data}")
            return jsonify(user_data)

        elif request.method == 'POST':
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            # Update user data
            update_data = {
                'full_name': data.get('full_name'),
                'email': data.get('email'),
                'phone': data.get('phone'),
                'location': data.get('location')
            }

            # Remove None values
            update_data = {k: v for k, v in update_data.items() if v is not None}
            print(f"Updating user with data: {update_data}")

            # Update in database
            result = db_mongo.users.update_one(
                {'_id': ObjectId(current_user)},
                {'$set': update_data}
            )

            if result.modified_count > 0:
                # Get updated user data to return
                updated_user = db_mongo.users.find_one({'_id': ObjectId(current_user)})
                return jsonify({
                    'message': 'Profile updated successfully',
                    'data': {
                        'id': str(updated_user['_id']),
                        'username': updated_user['username'],
                        'email': updated_user.get('email', ''),
                        'full_name': updated_user.get('full_name', ''),
                        'phone': updated_user.get('phone', ''),
                        'location': updated_user.get('location', ''),
                        'profile_pic': updated_user.get('profile_pic', ''),
                        'level': updated_user.get('level', 'Bronze'),
                        'points': updated_user.get('points', 0)
                    }
                })
            else:
                return jsonify({
                    'message': 'No changes made to profile',
                    'data': update_data
                })

    except Exception as e:
        print(f"Error in user_profile: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/update-profile', methods=['POST'])
@jwt_required()
def update_profile():
    try:
        current_user_id = get_jwt_identity()
        data = request.get_json()
        
        # Validate the data
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        # Fields that can be updated
        allowed_fields = ['full_name', 'bio', 'phone', 'location']
        update_data = {k: v.strip() for k, v in data.items() if k in allowed_fields and v}
        
        # Update the user document
        result = db_mongo.users.update_one(
            {'_id': ObjectId(current_user_id)},
            {'$set': update_data}
        )
        
        if result.modified_count > 0:
            return jsonify({'message': 'Profile updated successfully'}), 200
        return jsonify({'message': 'No changes made'}), 200
            
    except Exception as e:
        print(f"Update profile error: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500

@app.route('/api/update-profile-pic', methods=['POST'])
@jwt_required()
def update_profile_pic():
    try:
        current_user_id = get_jwt_identity()
        
        if 'profile_pic' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
            
        file = request.files['profile_pic']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
            
        if file and allowed_file(file.filename):
            # Create a secure filename
            filename = secure_filename(file.filename)
            # Add timestamp to filename to make it unique
            filename = f"{int(time.time())}_{filename}"
            
            # Save file to uploads directory
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # Update user's profile pic in database
            db_mongo.users.update_one(
                {'_id': ObjectId(current_user_id)},
                {'$set': {'profile_pic': filename}}
            )
            
            return jsonify({
                'message': 'Profile picture updated successfully',
                'profile_pic_url': url_for('static', filename=f'uploads/{filename}')
            }), 200
            
        return jsonify({'error': 'Invalid file type'}), 400
        
    except Exception as e:
        print(f"Update profile picture error: {str(e)}")
        return jsonify({'error': 'Failed to update profile picture'}), 500

@app.route('/api/user/profile-picture', methods=['POST'])
@jwt_required()
def upload_profile_picture():
    try:
        current_user = get_jwt_identity()
        
        if 'profile_pic' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
            
        file = request.files['profile_pic']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
            
        if not file.content_type.startswith('image/'):
            return jsonify({'error': 'File must be an image'}), 400
            
        # Generate a secure filename
        filename = secure_filename(file.filename)
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        new_filename = f"{current_user}_{timestamp}_{filename}"
        
        # Save file to uploads directory
        upload_folder = os.path.join(app.static_folder, 'uploads', 'profile_pics')
        os.makedirs(upload_folder, exist_ok=True)
        file_path = os.path.join(upload_folder, new_filename)
        file.save(file_path)
        
        # Update user's profile picture URL in database
        profile_pic_url = url_for('static', filename=f'uploads/profile_pics/{new_filename}')
        
        # Update in MongoDB
        db_mongo.users.update_one(
            {'_id': ObjectId(current_user)},
            {'$set': {'profile_pic': profile_pic_url}}
        )
        
        return jsonify({
            'message': 'Profile picture uploaded successfully',
            'profile_pic': profile_pic_url
        })
        
    except Exception as e:
        print(f"Profile picture upload error: {str(e)}")
        return jsonify({'error': 'Failed to upload profile picture'}), 500

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}

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
    if request.method == 'POST':
        try:
            # Get JSON data
            data = request.get_json()
            if not data:
                print("No JSON data received")
                return jsonify({'error': 'No data received'}), 400

            username = data.get('username')
            password = data.get('password')

            # Validate input
            if not username or not password:
                print("Missing username or password")
                return jsonify({'error': 'Missing username or password'}), 400

            print(f"Login attempt for user: {username}")

            # Find user
            user = db_mongo.users.find_one({'username': username})
            if not user:
                print(f"User not found: {username}")
                return jsonify({'error': 'Invalid username or password'}), 401

            # Verify password
            if not bcrypt.checkpw(password.encode('utf-8'), user['password']):
                print(f"Invalid password for user: {username}")
                return jsonify({'error': 'Invalid username or password'}), 401

            # Create access token
            access_token = create_access_token(identity=str(user['_id']))
            print(f"Created token for user: {username}")

            # Prepare response
            response_data = {
                'token': access_token,
                'user': {
                    'id': str(user['_id']),
                    'username': user['username'],
                    'email': user.get('email', ''),
                    'full_name': user.get('full_name', ''),
                    'level': user.get('level', 'Bronze'),
                    'points': user.get('points', 0)
                }
            }

            print(f"Login successful for user: {username}")
            return jsonify(response_data), 200

        except Exception as e:
            print(f"Login error: {str(e)}")
            return jsonify({'error': 'An error occurred during login'}), 500

    # GET request - render login page
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

@app.route('/user-home')
@jwt_required()
def user_home():
    return render_template('user-home.html')

@app.route('/api/user/stats')
@jwt_required()
def get_user_stats():
    # This would normally fetch from your database
    # For now returning mock data
    return jsonify({
        'totalDonations': 2500,
        'activeCampaigns': 3,
        'totalSupporters': 150
    })

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500
