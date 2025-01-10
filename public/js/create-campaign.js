// Handle image upload preview
function handleImageUpload(event) {
    const preview = document.getElementById('image-preview');
    preview.innerHTML = '';
    preview.style.display = 'flex';

    Array.from(event.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.style.width = '100px';
            img.style.height = '100px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '5px';
            preview.appendChild(img);
        }
        reader.readAsDataURL(file);
    });
}

// Get maximum amount allowed for user level
function getMaxAmountForLevel(level) {
    const maxAmounts = {
        'Bronze': 1000,
        'Silver': 5000,
        'Gold': 10000,
        'Platinum': 50000
    };
    return maxAmounts[level] || 1000;
}

// Validate campaign amount based on user level
function validateAmount() {
    const amount = document.getElementById('amount').value;
    const userLevel = document.querySelector('.user-level').textContent;
    const maxAmount = getMaxAmountForLevel(userLevel);
    
    if (amount > maxAmount) {
        showError(`Your current level (${userLevel}) only allows campaigns up to $${maxAmount}`);
        return false;
    }
    return true;
}

// Initialize campaign form
function initializeCampaignForm() {
    // Set minimum date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('deadline').min = today;

    // Add amount validation
    document.getElementById('amount').addEventListener('change', validateAmount);

    // Add form submission handler
    const form = document.getElementById('campaignForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!validateAmount()) return false;

            // Validate form
            const title = document.getElementById('title').value;
            const description = document.getElementById('description').value;
            const amount = document.getElementById('amount').value;
            const deadline = document.getElementById('deadline').value;
            const images = document.getElementById('images').files;

            let isValid = true;

            // Show error messages if fields are empty
            document.querySelectorAll('.form-control').forEach(input => {
                if (!input.value) {
                    input.nextElementSibling.style.display = 'block';
                    isValid = false;
                } else {
                    input.nextElementSibling.style.display = 'none';
                }
            });

            if (images.length === 0) {
                document.querySelector('#images').parentElement.nextElementSibling.nextElementSibling.style.display = 'block';
                isValid = false;
            }

            if (!isValid) return false;

            // Create campaign data
            const campaignData = {
                title,
                description,
                targetAmount: amount,
                deadline,
                images: Array.from(images).map(file => URL.createObjectURL(file))
            };

            // Save campaign
            const campaignId = saveCampaign(campaignData);

            // Show success message and redirect
            showSuccess('Campaign created successfully!');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);

            return false;
        });
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    initializeCampaignForm();
    checkAuthStatus();
});
