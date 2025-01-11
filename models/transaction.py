from datetime import datetime
from bson import ObjectId

class Transaction:
    def __init__(self, user_id, campaign_id, amount, payment_method):
        self.user_id = user_id
        self.campaign_id = campaign_id
        self.amount = float(amount)
        self.payment_method = payment_method  # 'credit_card', 'paypal', 'bank_transfer'
        self.status = 'pending'  # pending, completed, failed, refunded
        self.created_at = datetime.utcnow()
        self.completed_at = None
        self.transaction_id = None
        self.payment_details = {}
        self.refund_details = None
        
    def to_dict(self):
        return {
            'user_id': self.user_id,
            'campaign_id': self.campaign_id,
            'amount': self.amount,
            'payment_method': self.payment_method,
            'status': self.status,
            'created_at': self.created_at,
            'completed_at': self.completed_at,
            'transaction_id': self.transaction_id,
            'payment_details': self.payment_details,
            'refund_details': self.refund_details
        }
    
    @staticmethod
    def from_dict(data):
        transaction = Transaction(
            user_id=data['user_id'],
            campaign_id=data['campaign_id'],
            amount=data['amount'],
            payment_method=data['payment_method']
        )
        transaction.status = data.get('status', 'pending')
        transaction.created_at = data.get('created_at', datetime.utcnow())
        transaction.completed_at = data.get('completed_at')
        transaction.transaction_id = data.get('transaction_id')
        transaction.payment_details = data.get('payment_details', {})
        transaction.refund_details = data.get('refund_details')
        return transaction
