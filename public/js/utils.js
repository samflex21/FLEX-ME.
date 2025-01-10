// Format currency
export function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date
export function formatDate(date) {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(new Date(date));
}

// Calculate days left
export function calculateDaysLeft(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
}

// Calculate progress percentage
export function calculateProgress(current, target) {
    return Math.min(Math.round((current / target) * 100), 100);
}

// Show error message
export function showError(message, containerId = 'error-container') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }
}

// Show success message
export function showSuccess(message, containerId = 'success-container') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
    }
}

// Check if user is authenticated
export function isAuthenticated() {
    return !!localStorage.getItem('token');
}

// Redirect if not authenticated
export function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Get user level color
export function getLevelColor(level) {
    const colors = {
        'Bronze': '#CD7F32',
        'Silver': '#C0C0C0',
        'Gold': '#FFD700',
        'Platinum': '#E5E4E2'
    };
    return colors[level] || '#CD7F32';
}

// Format number with suffix
export function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

// Validate form data
export function validateForm(formData, rules) {
    const errors = {};
    
    for (const [field, value] of Object.entries(formData)) {
        if (rules[field]) {
            if (rules[field].required && !value) {
                errors[field] = `${field.replace('_', ' ')} is required`;
            }
            if (rules[field].minLength && value.length < rules[field].minLength) {
                errors[field] = `${field.replace('_', ' ')} must be at least ${rules[field].minLength} characters`;
            }
            if (rules[field].email && !/\S+@\S+\.\S+/.test(value)) {
                errors[field] = 'Please enter a valid email address';
            }
            if (rules[field].match && value !== formData[rules[field].match]) {
                errors[field] = `${field.replace('_', ' ')} must match ${rules[field].match.replace('_', ' ')}`;
            }
        }
    }

    return errors;
}

// Handle API errors
export function handleApiError(error) {
    console.error('API Error:', error);
    showError(error.message || 'Something went wrong. Please try again.');
}

// Update UI based on authentication state
export function updateAuthUI() {
    const authLinks = document.querySelectorAll('[data-auth-required]');
    const nonAuthLinks = document.querySelectorAll('[data-non-auth-only]');
    const isLoggedIn = isAuthenticated();

    authLinks.forEach(link => {
        link.style.display = isLoggedIn ? '' : 'none';
    });

    nonAuthLinks.forEach(link => {
        link.style.display = isLoggedIn ? 'none' : '';
    });
}
