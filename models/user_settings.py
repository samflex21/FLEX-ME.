from datetime import datetime
from bson import ObjectId

class UserSettings:
    def __init__(self, user_id):
        self.user_id = user_id
        self.email_notifications = True
        self.push_notifications = True
        self.newsletter_subscription = True
        self.privacy_settings = {
            'profile_visibility': 'public',  # public, private, friends
            'show_donations': True,
            'show_campaigns': True
        }
        self.theme = 'light'  # light, dark
        self.language = 'en'
        self.currency = 'EUR'
        self.updated_at = datetime.utcnow()
        
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'email_notifications': self.email_notifications,
            'push_notifications': self.push_notifications,
            'newsletter_subscription': self.newsletter_subscription,
            'privacy_settings': self.privacy_settings,
            'theme': self.theme,
            'language': self.language,
            'currency': self.currency,
            'updated_at': self.updated_at
        }
    
    @staticmethod
    def from_dict(data):
        settings = UserSettings(user_id=data['user_id'])
        settings.email_notifications = data.get('email_notifications', True)
        settings.push_notifications = data.get('push_notifications', True)
        settings.newsletter_subscription = data.get('newsletter_subscription', True)
        settings.privacy_settings = data.get('privacy_settings', {
            'profile_visibility': 'public',
            'show_donations': True,
            'show_campaigns': True
        })
        settings.theme = data.get('theme', 'light')
        settings.language = data.get('language', 'en')
        settings.currency = data.get('currency', 'EUR')
        settings.updated_at = data.get('updated_at', datetime.utcnow())
        return settings
