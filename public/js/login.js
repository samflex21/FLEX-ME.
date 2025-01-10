import api from './services/api.js';
import { showError, showSuccess, validateForm } from './utils.js';

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    try {
        const formData = {
            email: document.getElementById('email').value,
            password: document.getElementById('password').value
        };
        const rememberMe = document.getElementById('rememberMe').checked;

        // Validate form data
        const validationRules = {
            email: { required: true, email: true },
            password: { required: true }
        };

        const errors = validateForm(formData, validationRules);
        if (Object.keys(errors).length > 0) {
            const errorMessages = Object.values(errors).join('\n');
            showError(errorMessages);
            return;
        }

        // Login user
        const userData = await api.login(formData);
        
        if (rememberMe) {
            localStorage.setItem('rememberedEmail', formData.email);
        } else {
            localStorage.removeItem('rememberedEmail');
        }

        showSuccess('Login successful! Redirecting...');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1500);
    } catch (error) {
        showError(error.message || 'Login failed. Please check your credentials.');
    }
}

// Toggle password visibility
function togglePasswordVisibility() {
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.querySelector('.toggle-password');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Check for remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
        document.getElementById('email').value = rememberedEmail;
        document.getElementById('rememberMe').checked = true;
    }

    // Add form submit handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Add password toggle handler
    const togglePassword = document.querySelector('.toggle-password');
    if (togglePassword) {
        togglePassword.addEventListener('click', togglePasswordVisibility);
    }

    // Add input handlers for real-time validation
    const inputs = document.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            this.classList.remove('is-invalid');
            const errorElement = document.getElementById(`${this.id}Error`);
            if (errorElement) {
                errorElement.style.display = 'none';
            }
        });
    });
});
