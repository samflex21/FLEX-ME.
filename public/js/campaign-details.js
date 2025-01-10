// Load campaign details
function loadCampaignDetails() {
    // Get campaign ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const campaignId = parseInt(urlParams.get('id'));
    
    if (!campaignId) {
        window.location.href = 'index.html';
        return;
    }

    // Get campaign data
    const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
    const campaign = campaigns.find(c => c.id === campaignId);
    
    if (!campaign) {
        window.location.href = 'index.html';
        return;
    }

    // Update page content
    document.title = `${campaign.title} - Campaign Details`;
    updateCampaignContent(campaign);
    initializeImageGallery(campaign.images);
    loadComments(campaignId);
    setupDonationForm(campaign);
}

// Update campaign content
function updateCampaignContent(campaign) {
    document.querySelector('.campaign-title').textContent = campaign.title;
    document.querySelector('.campaign-description').textContent = campaign.description;
    
    // Update progress bar
    const progress = (campaign.currentAmount / campaign.targetAmount) * 100;
    document.querySelector('.progress-bar').style.width = `${progress}%`;
    document.querySelector('.current-amount').textContent = `€${campaign.currentAmount}`;
    document.querySelector('.target-amount').textContent = `€${campaign.targetAmount}`;
    
    // Update campaign stats
    document.querySelector('.donors-count').textContent = campaign.donors?.length || 0;
    document.querySelector('.days-left').textContent = calculateDaysLeft(campaign.deadline);
    document.querySelector('.campaign-status').textContent = campaign.status;
}

// Initialize image gallery
function initializeImageGallery(images) {
    const gallery = document.querySelector('.campaign-gallery');
    const mainImage = document.querySelector('.main-image img');
    
    // Set main image
    mainImage.src = images[0] || 'images/default-campaign.jpg';
    
    // Create thumbnails
    const thumbnailsHTML = images.map((img, index) => `
        <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeMainImage('${img}', this)">
            <img src="${img}" alt="Campaign image ${index + 1}">
        </div>
    `).join('');
    
    gallery.querySelector('.thumbnails').innerHTML = thumbnailsHTML;
}

// Change main image
function changeMainImage(src, thumbnail) {
    document.querySelector('.main-image img').src = src;
    document.querySelectorAll('.thumbnail').forEach(thumb => thumb.classList.remove('active'));
    thumbnail.classList.add('active');
}

// Calculate days left
function calculateDaysLeft(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
}

// Load comments
function loadComments(campaignId) {
    const comments = JSON.parse(localStorage.getItem(`comments_${campaignId}`) || '[]');
    const commentsContainer = document.querySelector('.comments-container');
    
    if (!comments.length) {
        commentsContainer.innerHTML = '<p>No comments yet. Be the first to comment!</p>';
        return;
    }
    
    const commentsHTML = comments.map(comment => `
        <div class="comment">
            <div class="comment-header">
                <span class="comment-author">${comment.author}</span>
                <span class="comment-date">${new Date(comment.date).toLocaleDateString()}</span>
            </div>
            <div class="comment-content">${comment.content}</div>
        </div>
    `).join('');
    
    commentsContainer.innerHTML = commentsHTML;
}

// Handle comment submission
function handleCommentSubmit(event) {
    event.preventDefault();
    
    if (!localStorage.getItem('isLoggedIn')) {
        showError('Please log in to comment');
        return;
    }
    
    const content = document.getElementById('commentContent').value;
    if (!content.trim()) {
        showError('Please enter a comment');
        return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const campaignId = parseInt(urlParams.get('id'));
    const user = JSON.parse(localStorage.getItem('user'));
    
    const comment = {
        author: user.username,
        content: content,
        date: new Date().toISOString()
    };
    
    // Save comment
    const comments = JSON.parse(localStorage.getItem(`comments_${campaignId}`) || '[]');
    comments.push(comment);
    localStorage.setItem(`comments_${campaignId}`, JSON.stringify(comments));
    
    // Refresh comments
    loadComments(campaignId);
    
    // Clear form
    document.getElementById('commentContent').value = '';
    showSuccess('Comment added successfully');
}

// Setup donation form
function setupDonationForm(campaign) {
    const form = document.getElementById('donationForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!localStorage.getItem('isLoggedIn')) {
            showError('Please log in to donate');
            return;
        }
        
        const amount = parseFloat(document.getElementById('donationAmount').value);
        if (!amount || amount <= 0) {
            showError('Please enter a valid amount');
            return;
        }
        
        // Update campaign
        campaign.currentAmount = (campaign.currentAmount || 0) + amount;
        campaign.donors = campaign.donors || [];
        campaign.donors.push({
            user: JSON.parse(localStorage.getItem('user')).username,
            amount: amount,
            date: new Date().toISOString()
        });
        
        // Save updated campaign
        const campaigns = JSON.parse(localStorage.getItem('campaigns') || '[]');
        const index = campaigns.findIndex(c => c.id === campaign.id);
        campaigns[index] = campaign;
        localStorage.setItem('campaigns', JSON.stringify(campaigns));
        
        // Update display
        updateCampaignContent(campaign);
        showSuccess('Thank you for your donation!');
        form.reset();
    });
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    loadCampaignDetails();
    checkAuthStatus();
    
    // Add comment form handler
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', handleCommentSubmit);
    }
});
