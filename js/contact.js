// Initialize contact form with enhanced validation
function initializeContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    // Add real-time validation
    const inputs = form.querySelectorAll('input, textarea');
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateInput(this);
        });
    });

    // Form submission handler
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate all inputs
        let isValid = true;
        inputs.forEach(input => {
            if (!validateInput(input)) {
                isValid = false;
            }
        });

        if (isValid) {
            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                subject: document.getElementById('subject').value,
                message: document.getElementById('message').value
            };

            // In a real app, this would send to a server
            // For now, just show success message
            showSuccess('Thank you for your message! We will get back to you soon.');
            form.reset();

            // Clear any remaining validation styles
            inputs.forEach(input => {
                input.classList.remove('invalid', 'valid');
            });
        }
    });
}

// Validate individual input
function validateInput(input) {
    const value = input.value.trim();
    let isValid = true;

    // Remove existing validation classes
    input.classList.remove('invalid', 'valid');

    // Check if empty
    if (!value) {
        showInputError(input, 'This field is required');
        isValid = false;
    }
    // Email validation
    else if (input.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            showInputError(input, 'Please enter a valid email address');
            isValid = false;
        }
    }
    // Message length validation
    else if (input.id === 'message' && value.length < 10) {
        showInputError(input, 'Message must be at least 10 characters long');
        isValid = false;
    }

    if (isValid) {
        input.classList.add('valid');
    }

    return isValid;
}

// Show error for specific input
function showInputError(input, message) {
    input.classList.add('invalid');
    
    // Create or update error message
    let errorDiv = input.nextElementSibling;
    if (!errorDiv || !errorDiv.classList.contains('error-message')) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        input.parentNode.insertBefore(errorDiv, input.nextSibling);
    }
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeContactForm();
    checkAuthStatus();
});
