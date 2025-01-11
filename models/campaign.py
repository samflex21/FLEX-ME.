from datetime import datetime
from bson import ObjectId

class Campaign:
    def __init__(self, title, description, goal, creator_id):
        self.title = title
        self.description = description
        self.goal = float(goal)
        self.creator_id = creator_id
        self.current_amount = 0.0
        self.status = 'active'
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.donors = []
        self.images = []
        self.updates = []
        self.comments = []
    
    def to_dict(self):
        return {
            'title': self.title,
            'description': self.description,
            'goal': self.goal,
            'creator_id': self.creator_id,
            'current_amount': self.current_amount,
            'status': self.status,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'donors': self.donors,
            'images': self.images,
            'updates': self.updates,
            'comments': self.comments
        }
    
    @staticmethod
    def from_dict(data):
        campaign = Campaign(
            title=data['title'],
            description=data['description'],
            goal=data['goal'],
            creator_id=data['creator_id']
        )
        campaign.current_amount = data.get('current_amount', 0.0)
        campaign.status = data.get('status', 'active')
        campaign.created_at = data.get('created_at', datetime.utcnow())
        campaign.updated_at = data.get('updated_at', datetime.utcnow())
        campaign.donors = data.get('donors', [])
        campaign.images = data.get('images', [])
        campaign.updates = data.get('updates', [])
        campaign.comments = data.get('comments', [])
        return campaign
