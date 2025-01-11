from datetime import datetime
from bson import ObjectId

class User:
    def __init__(self, username, email, password_hash, security_question, security_answer):
        self.username = username
        self.email = email
        self.password_hash = password_hash
        self.security_question = security_question
        self.security_answer = security_answer
        self.created_at = datetime.utcnow()
        self.profile_image = None
        self.bio = ""
        self.campaigns = []
        self.donations = []
    
    def to_dict(self):
        return {
            'username': self.username,
            'email': self.email,
            'password': self.password_hash,
            'security_question': self.security_question,
            'security_answer': self.security_answer,
            'created_at': self.created_at,
            'profile_image': self.profile_image,
            'bio': self.bio,
            'campaigns': self.campaigns,
            'donations': self.donations
        }
    
    @staticmethod
    def from_dict(data):
        user = User(
            username=data['username'],
            email=data['email'],
            password_hash=data['password'],
            security_question=data['security_question'],
            security_answer=data['security_answer']
        )
        user.created_at = data.get('created_at', datetime.utcnow())
        user.profile_image = data.get('profile_image')
        user.bio = data.get('bio', '')
        user.campaigns = data.get('campaigns', [])
        user.donations = data.get('donations', [])
        return user
