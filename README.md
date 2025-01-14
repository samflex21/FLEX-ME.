# Flex Me - Crowdfunding Platform

## Project Description
Flex Me is a modern crowdfunding platform that enables users to create and manage fundraising campaigns. The platform features a clean, intuitive interface with a dark/light theme toggle for enhanced user experience. Users can create campaigns, track donations, and manage their fundraising efforts through a comprehensive dashboard.

### Key Features
- **User Authentication**
  - Secure JWT-based authentication system
  - Login and registration functionality
  - Password hashing for security
  - Token-based session management

- **Campaign Management**
  - Create campaigns with title, description, and goal amount
  - Upload campaign images
  - Set campaign categories
  - Track campaign progress
  - Edit campaign details

- **Dashboard Features**
  - Overview of all user campaigns
  - Real-time donation tracking
  - Campaign statistics and analytics
  - User profile management

- **Public Access**
  - About page with platform information
  - Contact page for user support
  - Public campaign viewing
  - Responsive navigation

## Technology Stack
- **Backend**
  - Python Flask for server-side logic
  - Flask-JWT-Extended for authentication
  - PyMongo for database operations
  - Werkzeug for file handling and security

- **Database**
  - MongoDB for storing user data and campaigns
  - Collections: users, campaigns, donations

- **Frontend**
  - HTML5 for structure
  - CSS3 with Flexbox for layout
  - Custom CSS variables for theming
  - JavaScript for interactive features
  - FontAwesome for icons

- **Security**
  - JWT token authentication
  - Password hashing
  - Secure route protection
  - CSRF protection

## Setup Instructions

### Prerequisites
- Python 3.8 or higher
- MongoDB installed and running
- Modern web browser
- Internet connection for CDN resources

### Installation Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/flex-me.git
   cd flex-me
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install flask
   pip install flask-jwt-extended
   pip install pymongo
   pip install python-dotenv
   ```

4. Set up environment variables:
   Create a `.env` file in the root directory with:
   ```
   MONGODB_URI=mongodb://localhost:27017/flexme
   JWT_SECRET_KEY=your_secure_jwt_secret
   ```

5. Initialize MongoDB:
   - Start MongoDB service
   - Create 'flexme' database
   - Create collections: users, campaigns, donations

6. Run the application:
   ```bash
   python app.py
   ```

The application will run on `http://localhost:5000`

## Project Structure
```
flex-me/
├── app.py                  # Main Flask application
├── templates/             
│   ├── home.html          # Landing page
│   ├── login.html         # Authentication page
│   ├── profile.html       # User profile
│   ├── create-campaign.html # Campaign creation
│   ├── history.html       # Campaign history
│   ├── about.html         # About page
│   └── contact.html       # Contact page
├── static/            
│   ├── css/
│   │   ├── style.css     # Main styles
│   │   └── theme.css     # Theme variables
│   ├── js/
│   │   ├── auth.js       # Authentication logic
│   │   └── main.js       # Main functionality
│   └── images/           # Image assets
├── requirements.txt       # Python dependencies
└── README.md             # Documentation
```

## Features in Detail

### Authentication System
- JWT-based token authentication
- Token storage in cookies
- Protected routes for authenticated users
- Automatic token refresh

### Campaign Management
- Form-based campaign creation
- Image upload functionality
- Campaign categorization
- Progress tracking
- Donation management

### User Interface
- Responsive design
- Dark/Light theme toggle
- Interactive navigation
- Real-time updates
- Form validation

## Team Member

### Samuel Olumide Adebimpe
**Role**: Full Stack Developer

**Responsibilities**:
- Designed and implemented the Flask backend architecture
- Created the MongoDB database schema and operations
- Developed the JWT authentication system
- Built responsive frontend templates
- Implemented theme switching functionality
- Created campaign management system
- Designed and implemented navigation system
- Set up route protection and security measures
- Integrated FontAwesome icons
- Implemented form validation
- Created user profile management

## Future Enhancements
- Payment gateway integration
- Social media sharing
- Email notifications
- Campaign comments
- Advanced analytics
- Mobile app version

## Contact
For any inquiries about the project, please contact:
- Samuel Olumide Adebimpe
- Email: sadebimpe21@gmail.com	
- GitHub: samflex 21


---
Last Updated: January 14, 2025
