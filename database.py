from pymongo import MongoClient
from models.user import User
from models.campaign import Campaign
from models.donation import Donation
from models.notification import Notification
from models.message import Message
from models.comment import Comment
from models.activity_log import ActivityLog
from models.report import Report
from models.achievement import Achievement
from models.user_settings import UserSettings
from models.campaign_update import CampaignUpdate
from models.transaction import Transaction
from models.category import Category
from bson import ObjectId
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Database:
    def __init__(self):
        self.client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
        self.db = self.client['flex_me']
        self._ensure_indexes()
    
    def _ensure_indexes(self):
        # User indexes
        self.db.users.create_index('username', unique=True)
        self.db.users.create_index('email', unique=True)
        
        # Campaign indexes
        self.db.campaigns.create_index('creator_id')
        self.db.campaigns.create_index('status')
        self.db.campaigns.create_index('created_at')
        
        # Donation indexes
        self.db.donations.create_index('campaign_id')
        self.db.donations.create_index('donor_id')
        self.db.donations.create_index('created_at')

        # Notification indexes
        self.db.notifications.create_index('user_id')
        self.db.notifications.create_index('created_at')

        # Message indexes
        self.db.messages.create_index([('sender_id', 1), ('receiver_id', 1)])
        self.db.messages.create_index('created_at')

        # Comment indexes
        self.db.comments.create_index('campaign_id')
        self.db.comments.create_index('user_id')
        self.db.comments.create_index('created_at')

        # Activity log indexes
        self.db.activity_logs.create_index('user_id')
        self.db.activity_logs.create_index('timestamp')

        # Report indexes
        self.db.reports.create_index('content_id')
        self.db.reports.create_index('status')

        # Achievement indexes
        self.db.achievements.create_index('user_id')
        self.db.achievements.create_index('achievement_type')

        # User settings indexes
        self.db.user_settings.create_index('user_id', unique=True)

        # Campaign update indexes
        self.db.campaign_updates.create_index('campaign_id')
        self.db.campaign_updates.create_index('created_at')

        # Transaction indexes
        self.db.transactions.create_index('user_id')
        self.db.transactions.create_index('campaign_id')
        self.db.transactions.create_index('status')
        self.db.transactions.create_index('created_at')

        # Category indexes
        self.db.categories.create_index('slug', unique=True)
        self.db.categories.create_index('parent_id')

    # Collection operations for each model...
    # Users
    def create_user(self, user_data):
        user = User.from_dict(user_data)
        result = self.db.users.insert_one(user.to_dict())
        return str(result.inserted_id)
    
    def get_user_by_username(self, username):
        data = self.db.users.find_one({'username': username})
        return User.from_dict(data) if data else None

    # Campaigns
    def create_campaign(self, campaign_data):
        campaign = Campaign.from_dict(campaign_data)
        result = self.db.campaigns.insert_one(campaign.to_dict())
        return str(result.inserted_id)
    
    def get_campaign(self, campaign_id):
        data = self.db.campaigns.find_one({'_id': ObjectId(campaign_id)})
        return Campaign.from_dict(data) if data else None

    # Donations
    def create_donation(self, donation_data):
        donation = Donation.from_dict(donation_data)
        result = self.db.donations.insert_one(donation.to_dict())
        return str(result.inserted_id)

    # Notifications
    def create_notification(self, notification_data):
        notification = Notification.from_dict(notification_data)
        result = self.db.notifications.insert_one(notification.to_dict())
        return str(result.inserted_id)

    def get_user_notifications(self, user_id):
        cursor = self.db.notifications.find({'user_id': user_id}).sort('created_at', -1)
        return [Notification.from_dict(data) for data in cursor]

    # Messages
    def create_message(self, message_data):
        message = Message.from_dict(message_data)
        result = self.db.messages.insert_one(message.to_dict())
        return str(result.inserted_id)

    def get_user_messages(self, user_id):
        cursor = self.db.messages.find({
            '$or': [{'sender_id': user_id}, {'receiver_id': user_id}]
        }).sort('created_at', -1)
        return [Message.from_dict(data) for data in cursor]

    # Comments
    def create_comment(self, comment_data):
        comment = Comment.from_dict(comment_data)
        result = self.db.comments.insert_one(comment.to_dict())
        return str(result.inserted_id)

    def get_campaign_comments(self, campaign_id):
        cursor = self.db.comments.find({'campaign_id': campaign_id}).sort('created_at', -1)
        return [Comment.from_dict(data) for data in cursor]

    # Activity Logs
    def log_activity(self, activity_data):
        log = ActivityLog.from_dict(activity_data)
        result = self.db.activity_logs.insert_one(log.to_dict())
        return str(result.inserted_id)

    # Reports
    def create_report(self, report_data):
        report = Report.from_dict(report_data)
        result = self.db.reports.insert_one(report.to_dict())
        return str(result.inserted_id)

    # Achievements
    def create_achievement(self, achievement_data):
        achievement = Achievement.from_dict(achievement_data)
        result = self.db.achievements.insert_one(achievement.to_dict())
        return str(result.inserted_id)

    def get_user_achievements(self, user_id):
        cursor = self.db.achievements.find({'user_id': user_id})
        return [Achievement.from_dict(data) for data in cursor]

    # User Settings
    def get_user_settings(self, user_id):
        data = self.db.user_settings.find_one({'user_id': user_id})
        return UserSettings.from_dict(data) if data else UserSettings(user_id)

    def update_user_settings(self, user_id, settings_data):
        settings = UserSettings.from_dict(settings_data)
        self.db.user_settings.update_one(
            {'user_id': user_id},
            {'$set': settings.to_dict()},
            upsert=True
        )

    # Campaign Updates
    def create_campaign_update(self, update_data):
        update = CampaignUpdate.from_dict(update_data)
        result = self.db.campaign_updates.insert_one(update.to_dict())
        return str(result.inserted_id)

    def get_campaign_updates(self, campaign_id):
        cursor = self.db.campaign_updates.find({'campaign_id': campaign_id}).sort('created_at', -1)
        return [CampaignUpdate.from_dict(data) for data in cursor]

    # Transactions
    def create_transaction(self, transaction_data):
        transaction = Transaction.from_dict(transaction_data)
        result = self.db.transactions.insert_one(transaction.to_dict())
        return str(result.inserted_id)

    def get_user_transactions(self, user_id):
        cursor = self.db.transactions.find({'user_id': user_id}).sort('created_at', -1)
        return [Transaction.from_dict(data) for data in cursor]

    # Categories
    def create_category(self, category_data):
        category = Category.from_dict(category_data)
        result = self.db.categories.insert_one(category.to_dict())
        return str(result.inserted_id)

    def get_all_categories(self):
        cursor = self.db.categories.find({'is_active': True})
        return [Category.from_dict(data) for data in cursor]

    # Migration helper
    def migrate_from_localstorage(self, users_data):
        """
        Migrate data from localStorage to MongoDB
        users_data: List of user objects from localStorage
        """
        for user_data in users_data:
            # Check if user already exists
            if not self.db.users.find_one({'username': user_data['username']}):
                self.create_user(user_data)
        
        return True

# Create a global instance
db = Database()
