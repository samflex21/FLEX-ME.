// User Authentication and Registration
function validateRegistration() {
    const username = document.getElementById('username').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Reset error messages
    document.querySelectorAll('.error-message').forEach(msg => msg.style.display = 'none');

    let isValid = true;

    // Username validation
    if (username.length < 3) {
        document.getElementById('usernameError').style.display = 'block';
        isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        document.getElementById('emailError').style.display = 'block';
        isValid = false;
    }

    // Password validation
    if (password.length < 6) {
        document.getElementById('passwordError').style.display = 'block';
        isValid = false;
    }

    // Confirm password
    if (password !== confirmPassword) {
        document.getElementById('confirmPasswordError').style.display = 'block';
        isValid = false;
    }

    if (isValid) {
        // Store user data (in real app, this would be sent to a server)
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', JSON.stringify({
            username,
            email,
            level: 'Bronze',
            points: 0
        }));
        window.location.href = 'dashboard.html';
    }

    return isValid;
}

// User Level Management
function updateUserLevel(points) {
    const levels = {
        Bronze: { min: 0, max: 500 },
        Silver: { min: 501, max: 2000 },
        Gold: { min: 2001, max: 5000 },
        Platinum: { min: 5001, max: Infinity }
    };

    let currentLevel = 'Bronze';
    for (const [level, range] of Object.entries(levels)) {
        if (points >= range.min && points <= range.max) {
            currentLevel = level;
            break;
        }
    }

    const user = JSON.parse(localStorage.getItem('user'));
    user.level = currentLevel;
    user.points = points;
    localStorage.setItem('user', JSON.stringify(user));
    
    return currentLevel;
}

function calculateProgress(points) {
    const levels = {
        Bronze: { target: 500 },
        Silver: { target: 2000 },
        Gold: { target: 5000 }
    };

    const user = JSON.parse(localStorage.getItem('user'));
    const currentLevel = user.level;
    
    if (currentLevel === 'Platinum') return 100;
    
    const targetPoints = levels[currentLevel].target;
    return Math.min((points / targetPoints) * 100, 100);
}

// Campaign Management
function saveCampaign(campaignData) {
    // Get existing campaigns or initialize empty array
    let campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
    
    // Add new campaign
    campaignData.id = Date.now(); // Simple way to generate unique ID
    campaignData.status = 'active';
    campaignData.createdAt = new Date().toISOString();
    campaignData.creator = JSON.parse(localStorage.getItem('user')).username;
    
    campaigns.push(campaignData);
    localStorage.setItem('campaigns', JSON.stringify(campaigns));
    
    return campaignData.id;
}

function getCampaigns(filter = 'all') {
    const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
    const user = JSON.parse(localStorage.getItem('user'));
    
    switch(filter) {
        case 'my':
            return campaigns.filter(c => c.creator === user.username);
        case 'active':
            return campaigns.filter(c => c.status === 'active');
        case 'completed':
            return campaigns.filter(c => c.status === 'completed');
        default:
            return campaigns;
    }
}

// Contact Form Handling
function handleContactSubmission(event) {
    event.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    // Validate inputs
    if (!name || !email || !message) {
        showError('Please fill in all fields');
        return;
    }
    
    // In a real app, this would send to a server
    // For now, just show success message
    showSuccess('Message sent successfully! We will get back to you soon.');
    
    // Clear form
    event.target.reset();
}

function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-danger';
    errorDiv.textContent = message;
    
    const form = document.querySelector('form');
    form.insertBefore(errorDiv, form.firstChild);
    
    setTimeout(() => errorDiv.remove(), 3000);
}

function showSuccess(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success';
    successDiv.textContent = message;
    
    const form = document.querySelector('form');
    form.insertBefore(successDiv, form.firstChild);
    
    setTimeout(() => successDiv.remove(), 3000);
}

// Navigation and Authentication Status
function checkAuthStatus() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const authHideElements = document.querySelectorAll('.auth-hide');
    const authShowElements = document.querySelectorAll('.auth-show');
    
    if (isLoggedIn) {
        authHideElements.forEach(el => el.style.display = 'none');
        authShowElements.forEach(el => el.style.display = 'block');
        updateUserInfo();
    } else {
        authHideElements.forEach(el => el.style.display = 'block');
        authShowElements.forEach(el => el.style.display = 'none');
    }
}

function updateUserInfo() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    // Update level progress bar
    const progressBar = document.querySelector('.level-bar');
    if (progressBar) {
        const progress = calculateProgress(user.points);
        progressBar.style.width = `${progress}%`;
    }

    // Update user level
    const levelElement = document.querySelector('.user-level');
    if (levelElement) {
        levelElement.textContent = user.level;
    }

    // Update points info
    const pointsInfo = document.querySelector('.points-info');
    if (pointsInfo) {
        const nextLevel = getNextLevel(user.level);
        const pointsToNext = getPointsToNextLevel(user.points, user.level);
        pointsInfo.textContent = `${user.points}/${pointsToNext} points to ${nextLevel}`;
    }
}

function getNextLevel(currentLevel) {
    const levels = ['Bronze', 'Silver', 'Gold', 'Platinum'];
    const currentIndex = levels.indexOf(currentLevel);
    return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : 'Max Level';
}

function getPointsToNextLevel(currentPoints, currentLevel) {
    const levelThresholds = {
        Bronze: 500,
        Silver: 2000,
        Gold: 5000,
        Platinum: Infinity
    };
    return currentLevel === 'Platinum' ? currentPoints : levelThresholds[currentLevel];
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    checkAuthStatus();
    
    // Add form submit handlers if forms exist
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateRegistration()) {
                this.submit();
            }
        });
    }

    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', handleContactSubmission);
    }

    const campaignForm = document.getElementById('campaignForm');
    if (campaignForm) {
        campaignForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const campaignData = Object.fromEntries(formData.entries());
            saveCampaign(campaignData);
        });
    }
});
