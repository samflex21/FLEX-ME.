from datetime import datetime
from bson import ObjectId

class ActivityLog:
    def __init__(self, user_id, action_type, details):
        self.user_id = user_id
        self.action_type = action_type  # 'login', 'campaign_create', 'donation', etc.
        self.details = details
        self.timestamp = datetime.utcnow()
        self.ip_address = None
        self.user_agent = None
        
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'action_type': self.action_type,
            'details': self.details,
            'timestamp': self.timestamp,
            'ip_address': self.ip_address,
            'user_agent': self.user_agent
        }
    
    @staticmethod
    def from_dict(data):
        log = ActivityLog(
            user_id=data['user_id'],
            action_type=data['action_type'],
            details=data['details']
        )
        log.timestamp = data.get('timestamp', datetime.utcnow())
        log.ip_address = data.get('ip_address')
        log.user_agent = data.get('user_agent')
        return log
