from datetime import datetime
from bson import ObjectId

class Category:
    def __init__(self, name, description):
        self.name = name
        self.description = description
        self.slug = self._generate_slug(name)
        self.icon = None
        self.parent_id = None
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.campaign_count = 0
        self.is_active = True
        
    def _generate_slug(self, name):
        # Convert name to lowercase and replace spaces with hyphens
        return name.lower().replace(' ', '-')
        
    def to_dict(self):
        return {
            'name': self.name,
            'description': self.description,
            'slug': self.slug,
            'icon': self.icon,
            'parent_id': self.parent_id,
            'created_at': self.created_at,
            'updated_at': self.updated_at,
            'campaign_count': self.campaign_count,
            'is_active': self.is_active
        }
    
    @staticmethod
    def from_dict(data):
        category = Category(
            name=data['name'],
            description=data['description']
        )
        category.slug = data.get('slug', category._generate_slug(data['name']))
        category.icon = data.get('icon')
        category.parent_id = data.get('parent_id')
        category.created_at = data.get('created_at', datetime.utcnow())
        category.updated_at = data.get('updated_at', datetime.utcnow())
        category.campaign_count = data.get('campaign_count', 0)
        category.is_active = data.get('is_active', True)
        return category
