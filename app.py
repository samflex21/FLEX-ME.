from flask import Flask, render_template, request, jsonify, redirect, url_for, make_response
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, get_jwt_identity, jwt_required, decode_token
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import bcrypt
from database import db
from bson import ObjectId
from datetime import datetime, timedelta
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

# Define allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Create uploads directory if it doesn't exist
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static', 'uploads', 'profile_pictures')
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

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

# Public routes that don't require authentication
@app.route('/')
def home():
    return render_template('home.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/contact')
def contact():
    return render_template('contact.html')

@app.route('/dashboard')
def dashboard():
    try:
        # Get token from cookie
        token = request.cookies.get('token')
        if not token:
            print("No token in cookies")
            return redirect(url_for('login'))

        try:
            # Verify and decode the token
            decoded_token = decode_token(token)
            current_user = decoded_token['sub']
            
            # Get user data from database
            user = db_mongo.users.find_one({'_id': ObjectId(current_user)})
            if not user:
                print("User not found in database")
                return redirect(url_for('login'))

            # Format user data
            user_data = {
                'username': user['username'],
                'email': user.get('email', ''),
                'firstName': user.get('firstName', ''),
                'lastName': user.get('lastName', ''),
                'profile_image': user.get('profile_image', ''),
                'level': user.get('level', 'Bronze'),
                'points': user.get('points', 0),
                'totalDonated': user.get('totalDonated', 0),
                'peopleHelped': user.get('peopleHelped', 0)
            }

            # Get user's campaigns
            campaigns = list(db_mongo.campaigns.find({'user_id': ObjectId(current_user)}).limit(5))
            
            # Format campaign data
            campaign_data = []
            for campaign in campaigns:
                campaign_data.append({
                    'id': str(campaign['_id']),
                    'title': campaign.get('title', ''),
                    'description': campaign.get('description', ''),
                    'goal': campaign.get('goal', 0),
                    'current': campaign.get('current', 0),
                    'status': campaign.get('status', 'active'),
                    'created_at': campaign.get('created_at', datetime.utcnow()).strftime('%Y-%m-%d')
                })

            print("Dashboard loaded successfully for user:", user['username'])
            return render_template('dashboard.html', user=user_data, campaigns=campaign_data)

        except Exception as e:
            print("Token verification error:", str(e))
            return redirect(url_for('login'))

    except Exception as e:
        print(f"Dashboard error: {str(e)}")
        return redirect(url_for('login'))

@app.route('/profile')
def profile():
    try:
        # Get token from cookie
        token = request.cookies.get('token')
        if not token:
            print("No token in cookies for profile")
            return redirect(url_for('login'))

        try:
            # Verify and decode the token
            decoded_token = decode_token(token)
            current_user = decoded_token['sub']
            
            # Get user data from database
            user = db_mongo.users.find_one({'_id': ObjectId(current_user)})
            if not user:
                print("User not found in database for profile")
                return redirect(url_for('login'))

            # Format user data for template
            user_data = {
                'username': user.get('username', ''),
                'firstName': user.get('firstName', ''),
                'lastName': user.get('lastName', ''),
                'email': user.get('email', ''),
                'profile_image': user.get('profile_image', ''),
                'phone': user.get('phone', ''),
                'address': user.get('address', ''),
                'city': user.get('city', ''),
                'state': user.get('state', ''),
                'zipCode': user.get('zip_code', ''),
                'country': user.get('country', ''),
                'securityQuestion': user.get('securityQuestion', ''),
                'securityAnswer': user.get('securityAnswer', ''),
                'role': user.get('role', 'user'),
                'status': user.get('status', 'active'),
                'created_at': user.get('created_at', datetime.utcnow()).strftime('%Y-%m-%d')
            }

            print("Profile loaded successfully for user:", user['username'])
            return render_template('profile.html', user=user_data)

        except Exception as e:
            print("Token verification error in profile:", str(e))
            return redirect(url_for('login'))

    except Exception as e:
        print(f"Error in profile route: {str(e)}")
        return redirect(url_for('login'))

@app.route('/api/user/profile', methods=['GET', 'POST'])
@jwt_required()
def user_profile():
    try:
        current_user = get_jwt_identity()
        user = db_mongo.users.find_one({'_id': ObjectId(current_user)})
        
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if request.method == 'GET':
            # Parse name components
            full_name = user.get('full_name', '')
            name_parts = full_name.split(' ', 1)
            first_name = name_parts[0] if name_parts else ''
            last_name = name_parts[1] if len(name_parts) > 1 else ''

            # Parse location components
            location = user.get('location', '')
            loc_parts = [x.strip() for x in location.split(',')]
            address = loc_parts[0] if len(loc_parts) > 0 else ''
            city = loc_parts[1] if len(loc_parts) > 1 else ''
            state = loc_parts[2] if len(loc_parts) > 2 else ''
            zip_code = loc_parts[3] if len(loc_parts) > 3 else ''
            country = loc_parts[4] if len(loc_parts) > 4 else ''

            # Return formatted user data
            return jsonify({
                'username': user.get('username', ''),
                'email': user.get('email', ''),
                'first_name': first_name,
                'last_name': last_name,
                'phone': user.get('phone', ''),
                'address': address,
                'city': city,
                'state': state,
                'zip_code': zip_code,
                'country': country,
                'profile_pic': user.get('profile_pic', ''),
                'level': user.get('level', 'Bronze'),
                'points': user.get('points', 0)
            })

        elif request.method == 'POST':
            data = request.get_json()
            if not data:
                return jsonify({'error': 'No data provided'}), 400

            # Build location string
            location_parts = [
                data.get('address', '').strip(),
                data.get('city', '').strip(),
                data.get('state', '').strip(),
                data.get('zip_code', '').strip(),
                data.get('country', '').strip()
            ]
            location = ', '.join(filter(None, location_parts))

            # Build full name
            first_name = data.get('first_name', '').strip()
            last_name = data.get('last_name', '').strip()
            full_name = ' '.join(filter(None, [first_name, last_name]))

            # Update user data
            update_data = {
                'full_name': full_name,
                'email': data.get('email'),
                'phone': data.get('phone'),
                'location': location
            }

            # Remove empty values
            update_data = {k: v for k, v in update_data.items() if v}

            # Update in database
            result = db_mongo.users.update_one(
                {'_id': ObjectId(current_user)},
                {'$set': update_data}
            )

            if result.modified_count > 0:
                return jsonify({'message': 'Profile updated successfully'})
            return jsonify({'message': 'No changes made to profile'})

    except Exception as e:
        print(f"Error in user_profile: {str(e)}")
        return jsonify({'error': str(e)}), 500

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

@app.route('/api/update-profile', methods=['POST'])
@jwt_required()
def update_profile():
    try:
        current_user = get_jwt_identity()
        user = db_mongo.users.find_one({'_id': ObjectId(current_user)})
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        
        # Update user document
        update_data = {
            'firstName': data.get('firstName'),
            'lastName': data.get('lastName'),
            'email': data.get('email'),
            'phone': {
                'countryCode': data.get('countryCode'),
                'number': data.get('phone')
            },
            'address': {
                'street': data.get('street'),
                'city': data.get('city'),
                'state': data.get('state'),
                'country': data.get('country'),
                'postal': data.get('postal')
            },
            'securityQuestion': data.get('securityQuestion'),
            'securityAnswer': data.get('securityAnswer')
        }
        
        # Handle profile image if provided
        if 'profile_image' in data and data['profile_image']:
            image_data = data['profile_image'].split(',')[1] if ',' in data['profile_image'] else data['profile_image']
            update_data['profile_image'] = image_data

        # Update in database
        result = db_mongo.users.update_one(
            {'_id': ObjectId(current_user)},
            {'$set': update_data}
        )
        
        if result.modified_count > 0:
            return jsonify({'message': 'Profile updated successfully'}), 200
        return jsonify({'message': 'No changes made'}), 200
        
    except Exception as e:
        print(f"Error updating profile: {str(e)}")
        return jsonify({'error': 'Failed to update profile'}), 500

@app.route('/api/get-profile', methods=['GET'])
@jwt_required()
def get_profile():
    try:
        current_user = get_jwt_identity()
        user = db_mongo.users.find_one({'_id': ObjectId(current_user)})
        
        if user:
            # Convert ObjectId to string for JSON serialization
            user['_id'] = str(user['_id'])
            
            # Prepare response data
            profile_data = {
                'username': user.get('username'),
                'firstName': user.get('first_name'),
                'lastName': user.get('last_name'),
                'email': user.get('email'),
                'phone': user.get('phone'),
                'address': user.get('address'),
                'city': user.get('city'),
                'state': user.get('state'),
                'zipCode': user.get('zip_code'),
                'country': user.get('country'),
                'profile_picture': user.get('profile_picture')
            }

            # Add security questions if they exist
            if 'security_questions' in user:
                for i, q in enumerate(user['security_questions'], 1):
                    profile_data[f'security_question{i}'] = q.get('question')
                    profile_data[f'security_answer{i}'] = q.get('answer')

            return jsonify(profile_data), 200
        else:
            return jsonify({'error': 'User not found'}), 404
    except Exception as e:
        print(f"Error getting profile: {str(e)}")
        return jsonify({'error': 'Failed to get profile'}), 500

@app.route('/history')
def history():
    try:
        # Serve the history page without requiring user data
        return render_template('history.html')
    except Exception as e:
        print(f"Error in history route: {str(e)}")
        return redirect(url_for('home'))

@app.route('/create-campaign')
def create_campaign():
    try:
        # Serve the create-campaign page without requiring user data
        return render_template('create-campaign.html')
    except Exception as e:
        print(f"Error in create_campaign route: {str(e)}")
        return redirect(url_for('home'))

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        try:
            data = request.get_json()
            print("Login request data:", data)
            
            email = data.get('email')
            password = data.get('password')

            if not email or not password:
                print("Missing email/username or password")
                return jsonify({'error': 'Email/username and password are required'}), 400

            # Try to find user by email or username
            user = db_mongo.users.find_one({
                '$or': [
                    {'email': email},
                    {'username': email}  # Try username if email fails
                ]
            })
            print("Found user:", user is not None)
            
            if not user:
                print("User not found for:", email)
                return jsonify({'error': 'Invalid email/username or password'}), 401

            # Verify password using bcrypt
            try:
                is_valid = bcrypt.checkpw(password.encode('utf-8'), user['password'])
                print("Password verification result:", is_valid)
            except Exception as e:
                print("Password verification error:", str(e))
                return jsonify({'error': 'Invalid email/username or password'}), 401

            if is_valid:
                # Create access token with 1 hour expiry
                expires = timedelta(hours=1)
                access_token = create_access_token(
                    identity=str(user['_id']),
                    expires_delta=expires
                )
                print("Created access token")
                
                # Create response
                response = jsonify({
                    'message': 'Login successful',
                    'user': {
                        'username': user['username'],
                        'email': user.get('email', '')
                    }
                })
                
                # Set token as HTTP-only cookie
                response.set_cookie(
                    'token',
                    access_token,
                    httponly=True,
                    secure=False,  # Set to True in production with HTTPS
                    samesite='Lax',
                    max_age=3600  # 1 hour
                )
                
                print("Login successful for user:", user['username'])
                return response, 200
            else:
                print("Invalid password for user:", user['username'])
                return jsonify({'error': 'Invalid email/username or password'}), 401

        except Exception as e:
            print(f"Login error: {str(e)}")
            return jsonify({'error': 'Login failed'}), 500

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
                'role': 'user',
                'profile_image': None  # Initialize as None
            }

            # Handle profile image if provided
            if 'profile_image' in data and data['profile_image']:
                # Remove the data:image/[type];base64, prefix
                image_data = data['profile_image'].split(',')[1] if ',' in data['profile_image'] else data['profile_image']
                user['profile_image'] = image_data
            
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
        current_user = get_jwt_identity()
        
        # Get form data
        title = request.form.get('title')
        description = request.form.get('description')
        goal_amount = float(request.form.get('goal_amount'))
        category = request.form.get('category')
        
        # Initialize campaign data
        campaign = {
            'creator_id': current_user,
            'title': title,
            'description': description,
            'goal_amount': goal_amount,
            'current_amount': 0,
            'category': category,
            'status': 'active',
            'created_at': datetime.utcnow(),
            'supporters': [],
            'updates': []
        }
        
        # Handle campaign image
        if 'campaign_image' in request.files:
            file = request.files['campaign_image']
            if file and file.filename:
                # Generate secure filename
                filename = secure_filename(f"{current_user}_{int(time.time())}_{file.filename}")
                
                # Ensure upload directory exists
                if not os.path.exists(app.config['UPLOAD_FOLDER']):
                    os.makedirs(app.config['UPLOAD_FOLDER'])
                
                # Save file
                filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(filepath)
                
                # Store image path in campaign data
                campaign['image_url'] = f'/static/uploads/{filename}'
        
        # Save campaign to database
        result = db_mongo.campaigns.insert_one(campaign)
        
        # Update user's active campaigns
        db_mongo.users.update_one(
            {'_id': ObjectId(current_user)},
            {'$push': {'active_campaigns': str(result.inserted_id)}}
        )
        
        return jsonify({
            'message': 'Campaign created successfully',
            'campaign_id': str(result.inserted_id)
        }), 201
        
    except Exception as e:
        print(f"Error creating campaign: {str(e)}")
        return jsonify({'error': str(e)}), 500

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

@app.route('/logout')
def logout():
    # Clear any server-side session data if needed
    return render_template('home.html')

@app.route('/debug/check-user/<username>')
def check_user(username):
    try:
        # Find user by username
        user = db_mongo.users.find_one({'username': username})
        if user:
            return jsonify({
                'found': True,
                'username': user['username'],
                'email': user.get('email', 'No email'),
                'has_password': bool(user.get('password')),
                'firstName': user.get('firstName', 'No first name'),
                'lastName': user.get('lastName', 'No last name')
            })
        return jsonify({'found': False, 'message': 'User not found'})
    except Exception as e:
        return jsonify({'error': str(e)})

# Error handlers
@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500
