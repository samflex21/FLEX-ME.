from datetime import datetime
from bson import ObjectId

class Comment:
    def __init__(self, user_id, campaign_id, content):
        self.user_id = user_id
        self.campaign_id = campaign_id
        self.content = content
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.likes = []
        self.replies = []
        self.reported = False
        
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'campaign_id': self.campaign_id,
            'content': self.content,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'likes': self.likes,
            'replies': self.replies,
            'reported': self.reported
        }
    
    @staticmethod
    def from_dict(data):
        comment = Comment(
            user_id=data['user_id'],
            campaign_id=data['campaign_id'],
            content=data['content']
        )
        comment.created_at = data.get('created_at', datetime.utcnow())
        comment.updated_at = data.get('updated_at', datetime.utcnow())
        comment.likes = data.get('likes', [])
        comment.replies = data.get('replies', [])
        comment.reported = data.get('reported', False)
        return comment
