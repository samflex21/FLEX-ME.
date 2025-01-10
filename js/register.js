// Password toggle functionality
function initializePasswordToggles() {
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    togglePasswordButtons.forEach(button => {
        button.addEventListener('click', function() {
            const passwordField = this.previousElementSibling;
            const type = passwordField.type === 'password' ? 'text' : 'password';
            passwordField.type = type;
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });
}

// Password matching validation
function initializePasswordValidation() {
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');
    const matchMessage = document.querySelector('.password-match');
    const mismatchMessage = document.querySelector('.password-mismatch');

    function validatePasswords() {
        if (password.value && confirmPassword.value) {
            if (password.value === confirmPassword.value) {
                matchMessage.style.display = 'block';
                mismatchMessage.style.display = 'none';
                return true;
            } else {
                matchMessage.style.display = 'none';
                mismatchMessage.style.display = 'block';
                return false;
            }
        }
        return false;
    }

    password.addEventListener('input', validatePasswords);
    confirmPassword.addEventListener('input', validatePasswords);
}

// Form step navigation
function initializeFormSteps() {
    const formSteps = document.querySelectorAll('.form-step');
    const stepIndicators = document.querySelectorAll('.steps .step');
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    const submitBtn = document.getElementById('submitBtn');

    let currentStep = 1;
    const totalSteps = formSteps.length;

    function updateStepIndicators(step) {
        stepIndicators.forEach(indicator => {
            const stepNum = parseInt(indicator.dataset.step);
            if (stepNum <= step) {
                indicator.classList.add('active');
            } else {
                indicator.classList.remove('active');
            }
        });
    }

    function showStep(step) {
        formSteps.forEach(s => {
            s.style.display = 'none';
            s.classList.remove('active');
        });

        const currentStepElement = document.querySelector(`.form-step[data-step="${step}"]`);
        if (currentStepElement) {
            currentStepElement.style.display = 'block';
            currentStepElement.classList.add('active');

            prevBtn.style.display = step === 1 ? 'none' : 'inline-block';
            if (step === totalSteps) {
                nextBtn.style.display = 'none';
                submitBtn.style.display = 'inline-block';
            } else {
                nextBtn.style.display = 'inline-block';
                submitBtn.style.display = 'none';
            }

            updateStepIndicators(step);
        }
    }

    function validateStep(step) {
        const currentStepElement = document.querySelector(`.form-step[data-step="${step}"]`);
        if (!currentStepElement) return false;

        const requiredInputs = currentStepElement.querySelectorAll('input[required], select[required]');
        let isValid = true;

        requiredInputs.forEach(input => {
            if (!input.value.trim()) {
                isValid = false;
                input.classList.add('invalid');
                input.style.borderColor = '#dc3545';
            } else {
                input.classList.remove('invalid');
                input.style.borderColor = '';
            }
        });

        if (currentStepElement.contains(document.getElementById('password')) && 
            currentStepElement.contains(document.getElementById('confirmPassword'))) {
            if (!validatePasswords()) {
                isValid = false;
                showError('Passwords do not match!');
            }
        }

        return isValid;
    }

    // Initialize step navigation
    nextBtn.addEventListener('click', () => {
        if (validateStep(currentStep)) {
            currentStep++;
            showStep(currentStep);
        }
    });

    prevBtn.addEventListener('click', () => {
        currentStep--;
        showStep(currentStep);
    });

    // Show initial step
    showStep(1);
}

// Initialize registration page
document.addEventListener('DOMContentLoaded', function() {
    initializePasswordToggles();
    initializePasswordValidation();
    initializeFormSteps();

    const form = document.getElementById('registrationForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (validateRegistration()) {
                showSuccess('Registration successful! Redirecting to dashboard...');
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 2000);
            }
        });
    }
});
