from pymongo import MongoClient
from werkzeug.security import generate_password_hash, check_password_hash
import os

# MongoDB connection
try:
    client = MongoClient('mongodb://localhost:27017/')
    db = client['FlexMe']  # database name
    login_collection = db['login']  # collection name
    print("Connected to MongoDB successfully!")
except Exception as e:
    print(f"Error connecting to MongoDB: {e}")

def get_user(email):
    """Get user by email"""
    return login_collection.find_one({"email": email})

def verify_user(email, password):
    """Verify user credentials"""
    user = get_user(email)
    if user and check_password_hash(user['password'], password):
        return user
    return None

def create_user(email, password, first_name, last_name):
    """Create new user"""
    if get_user(email):
        return False, "Email already exists"
    
    try:
        user = {
            "email": email,
            "password": generate_password_hash(password),
            "first_name": first_name,
            "last_name": last_name,
            "trust_level": "Bronze",  # Default trust level
            "help_limit": 200  # Default help limit in euros
        }
        login_collection.insert_one(user)
        return True, "User created successfully"
    except Exception as e:
        return False, f"Error creating user: {e}"
