from datetime import datetime
from bson import ObjectId

class Donation:
    def __init__(self, campaign_id, donor_id, amount, message=""):
        self.campaign_id = campaign_id
        self.donor_id = donor_id
        self.amount = float(amount)
        self.message = message
        self.created_at = datetime.utcnow()
        self.status = 'completed'
    
    def to_dict(self):
        return {
            'campaign_id': self.campaign_id,
            'donor_id': self.donor_id,
            'amount': self.amount,
            'message': self.message,
            'created_at': self.created_at,
            'status': self.status
        }
    
    @staticmethod
    def from_dict(data):
        donation = Donation(
            campaign_id=data['campaign_id'],
            donor_id=data['donor_id'],
            amount=data['amount'],
            message=data.get('message', '')
        )
        donation.created_at = data.get('created_at', datetime.utcnow())
        donation.status = data.get('status', 'completed')
        return donation
