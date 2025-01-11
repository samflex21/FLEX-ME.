from datetime import datetime
from bson import ObjectId

class Report:
    def __init__(self, reporter_id, reported_id, reason, content_type, content_id):
        self.reporter_id = reporter_id
        self.reported_id = reported_id
        self.reason = reason
        self.content_type = content_type  # 'user', 'campaign', 'comment', etc.
        self.content_id = content_id
        self.created_at = datetime.utcnow()
        self.status = 'pending'  # pending, reviewed, resolved
        self.admin_notes = None
        self.resolution = None
        
    def to_dict(self):
        return {
            'reporter_id': self.reporter_id,
            'reported_id': self.reported_id,
            'reason': self.reason,
            'content_type': self.content_type,
            'content_id': self.content_id,
            'created_at': self.created_at,
            'status': self.status,
            'admin_notes': self.admin_notes,
            'resolution': self.resolution
        }
    
    @staticmethod
    def from_dict(data):
        report = Report(
            reporter_id=data['reporter_id'],
            reported_id=data['reported_id'],
            reason=data['reason'],
            content_type=data['content_type'],
            content_id=data['content_id']
        )
        report.created_at = data.get('created_at', datetime.utcnow())
        report.status = data.get('status', 'pending')
        report.admin_notes = data.get('admin_notes')
        report.resolution = data.get('resolution')
        return report
