from datetime import datetime
from bson import ObjectId

class CampaignUpdate:
    def __init__(self, campaign_id, user_id, title, content):
        self.campaign_id = campaign_id
        self.user_id = user_id
        self.title = title
        self.content = content
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.images = []
        self.likes = []
        self.comments = []
        self.pinned = False
        
    def to_dict(self):
        return {
            'campaign_id': self.campaign_id,
            'user_id': self.user_id,
            'title': self.title,
            'content': self.content,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'images': self.images,
            'likes': self.likes,
            'comments': self.comments,
            'pinned': self.pinned
        }
    
    @staticmethod
    def from_dict(data):
        update = CampaignUpdate(
            campaign_id=data['campaign_id'],
            user_id=data['user_id'],
            title=data['title'],
            content=data['content']
        )
        update.created_at = data.get('created_at', datetime.utcnow())
        update.updated_at = data.get('updated_at', datetime.utcnow())
        update.images = data.get('images', [])
        update.likes = data.get('likes', [])
        update.comments = data.get('comments', [])
        update.pinned = data.get('pinned', False)
        return update
