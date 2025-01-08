from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)

# Database Configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///flexme.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key'  # Change this to a secure secret key in production

db = SQLAlchemy(app)

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    campaigns = db.relationship('Campaign', backref='creator', lazy=True)
    donations = db.relationship('Donation', backref='donor', lazy=True)

class Campaign(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    creator_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    product = db.Column(db.String(200), nullable=False)
    amount_needed = db.Column(db.Float, nullable=False)
    amount_raised = db.Column(db.Float, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    active = db.Column(db.Boolean, default=True)
    donations = db.relationship('Donation', backref='campaign', lazy=True)

class Donation(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    donor_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    campaign_id = db.Column(db.Integer, db.ForeignKey('campaign.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Authentication decorator
def token_required(f):
    def decorator(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            token = token.split()[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
        except:
            return jsonify({'message': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    decorator.__name__ = f.__name__
    return decorator

# Routes
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already registered'}), 400
        
    hashed_password = generate_password_hash(data['password'])
    new_user = User(
        username=data['username'],
        email=data['email'],
        password_hash=hashed_password
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify({'message': 'User registered successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    
    if user and check_password_hash(user.password_hash, data['password']):
        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=1)
        }, app.config['SECRET_KEY'])
        
        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email
            }
        })
    
    return jsonify({'message': 'Invalid credentials'}), 401

@app.route('/api/campaigns', methods=['GET'])
def get_campaigns():
    campaigns = Campaign.query.filter_by(active=True).all()
    return jsonify([{
        'id': c.id,
        'creator': c.creator.username,
        'title': c.title,
        'product': c.product,
        'amount_needed': c.amount_needed,
        'amount_raised': c.amount_raised,
        'created_at': c.created_at.isoformat()
    } for c in campaigns])

@app.route('/api/campaigns', methods=['POST'])
@token_required
def create_campaign(current_user):
    data = request.get_json()
    
    new_campaign = Campaign(
        creator_id=current_user.id,
        title=data['title'],
        product=data['product'],
        amount_needed=float(data['amount_needed'])
    )
    
    db.session.add(new_campaign)
    db.session.commit()
    
    return jsonify({
        'message': 'Campaign created successfully',
        'campaign_id': new_campaign.id
    }), 201

@app.route('/api/campaigns/<int:campaign_id>/donate', methods=['POST'])
@token_required
def donate(current_user, campaign_id):
    data = request.get_json()
    campaign = Campaign.query.get_or_404(campaign_id)
    
    if not campaign.active:
        return jsonify({'message': 'Campaign is no longer active'}), 400
        
    amount = float(data['amount'])
    
    new_donation = Donation(
        donor_id=current_user.id,
        campaign_id=campaign_id,
        amount=amount
    )
    
    campaign.amount_raised += amount
    if campaign.amount_raised >= campaign.amount_needed:
        campaign.active = False
    
    db.session.add(new_donation)
    db.session.commit()
    
    return jsonify({
        'message': 'Donation successful',
        'campaign': {
            'id': campaign.id,
            'amount_raised': campaign.amount_raised,
            'active': campaign.active
        }
    })

@app.route('/api/user/campaigns', methods=['GET'])
@token_required
def get_user_campaigns(current_user):
    campaigns = Campaign.query.filter_by(creator_id=current_user.id).all()
    return jsonify([{
        'id': c.id,
        'title': c.title,
        'product': c.product,
        'amount_needed': c.amount_needed,
        'amount_raised': c.amount_raised,
        'active': c.active,
        'created_at': c.created_at.isoformat()
    } for c in campaigns])

@app.route('/api/user/donations', methods=['GET'])
@token_required
def get_user_donations(current_user):
    donations = Donation.query.filter_by(donor_id=current_user.id).all()
    return jsonify([{
        'id': d.id,
        'campaign_title': d.campaign.title,
        'amount': d.amount,
        'created_at': d.created_at.isoformat()
    } for d in donations])

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
