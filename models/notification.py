from datetime import datetime
from bson import ObjectId

class Notification:
    def __init__(self, user_id, title, message, notification_type):
        self.user_id = user_id
        self.title = title
        self.message = message
        self.notification_type = notification_type  # 'campaign', 'donation', 'system', etc.
        self.created_at = datetime.utcnow()
        self.read = False
        
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'notification_type': self.notification_type,
            'created_at': self.created_at,
            'read': self.read
        }
    
    @staticmethod
    def from_dict(data):
        notification = Notification(
            user_id=data['user_id'],
            title=data['title'],
            message=data['message'],
            notification_type=data['notification_type']
        )
        notification.created_at = data.get('created_at', datetime.utcnow())
        notification.read = data.get('read', False)
        return notification
