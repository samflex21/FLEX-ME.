from datetime import datetime
from bson import ObjectId

class Achievement:
    def __init__(self, user_id, achievement_type, title, description):
        self.user_id = user_id
        self.achievement_type = achievement_type  # 'donation_milestone', 'campaign_success', etc.
        self.title = title
        self.description = description
        self.earned_at = datetime.utcnow()
        self.badge_icon = None
        self.progress = 100  # Percentage complete
        self.metadata = {}  # Additional achievement-specific data
        
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'achievement_type': self.achievement_type,
            'title': self.title,
            'description': self.description,
            'earned_at': self.earned_at,
            'badge_icon': self.badge_icon,
            'progress': self.progress,
            'metadata': self.metadata
        }
    
    @staticmethod
    def from_dict(data):
        achievement = Achievement(
            user_id=data['user_id'],
            achievement_type=data['achievement_type'],
            title=data['title'],
            description=data['description']
        )
        achievement.earned_at = data.get('earned_at', datetime.utcnow())
        achievement.badge_icon = data.get('badge_icon')
        achievement.progress = data.get('progress', 100)
        achievement.metadata = data.get('metadata', {})
        return achievement
