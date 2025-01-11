from datetime import datetime
from bson import ObjectId

class Message:
    def __init__(self, sender_id, receiver_id, content):
        self.sender_id = sender_id
        self.receiver_id = receiver_id
        self.content = content
        self.created_at = datetime.utcnow()
        self.read = False
        self.deleted_by = []
        
    def to_dict(self):
        return {
            'sender_id': self.sender_id,
            'receiver_id': self.receiver_id,
            'content': self.content,
            'created_at': self.created_at,
            'read': self.read,
            'deleted_by': self.deleted_by
        }
    
    @staticmethod
    def from_dict(data):
        message = Message(
            sender_id=data['sender_id'],
            receiver_id=data['receiver_id'],
            content=data['content']
        )
        message.created_at = data.get('created_at', datetime.utcnow())
        message.read = data.get('read', False)
        message.deleted_by = data.get('deleted_by', [])
        return message
