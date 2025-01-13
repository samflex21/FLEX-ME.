// User state management
let currentUser = {
    username: null,
    email: null,
    level: 'Bronze',
    points: 0,
    totalDonated: 0,
    peopleHelped: 0
};

// Campaign tracking
const campaignDonors = new Map();
let campaigns = [
    {
        id: 1,
        creator: "Samuel Olumide Adebimpe",
        title: "Help me fund my education",
        description: "I need help funding my education",
        amount_needed: 1200,
        amount_raised: 400,
        image: "https://via.placeholder.com/120",
        deadline: "2025-02-09"
    }
];

// Level configuration
const LEVEL_CONFIG = {
    Bronze: { maxDonation: 1000, maxCampaign: 1000, nextLevel: 'Silver', pointsNeeded: 1000 },
    Silver: { maxDonation: 5000, maxCampaign: 5000, nextLevel: 'Gold', pointsNeeded: 2500 },
    Gold: { maxDonation: 10000, maxCampaign: 10000, nextLevel: 'Platinum', pointsNeeded: 5000 },
    Platinum: { maxDonation: 50000, maxCampaign: 50000, nextLevel: null, pointsNeeded: 10000 }
};

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async function() {
    await initializeDashboard();
    setupEventListeners();
});
function redirect(redirectUrl, localToken) {
    return new Promise(async (resolve, reject) => {
      try {
        // Instead of redirecting, fetch dashboard with token
        const dashboardResponse = await fetch(redirectUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localToken}`,
            'Content-Type': 'application/json'
          }
        });

        if (dashboardResponse.ok) {
          const html = await dashboardResponse.text();
          document.documentElement.innerHTML = html;
          // Update URL without reloading
          window.history.pushState({}, '', redirectUrl);
          resolve();
        } else {
          reject(new Error('Failed to load dashboard'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

function setupEventListeners() {
    // Set up profile navigation
    const profileLink = document.querySelector('#profile-link');
    if (profileLink) {
        profileLink.addEventListener('click', async function(event) {
            console.log('Profile link clicked');
            event.preventDefault();
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
                return;
            }

            try {
              await redirect('/profile', token);
            } catch (error) {
              console.error('Error redirecting to profile:', error);
            }
        });
    }
}

async function initializeDashboard() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        // Fetch user data
        const response = await fetch('/api/dashboard-data', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        currentUser = { ...currentUser, ...userData };

        // Update UI with user data
        updateUserInterface();
        
        // Initialize other dashboard components
        updateCampaignList(campaigns);
        initializeLiveFeed();
        updateUserStats();
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
        window.location.href = '/login';
    }
}

function updateUserInterface() {
    // Update user name
    const userNameElements = document.querySelectorAll('.user-name');
    userNameElements.forEach(el => el.textContent = currentUser.username);

    // Update level
    const levelElement = document.querySelector('.user-level');
    if (levelElement) levelElement.textContent = currentUser.level;

    // Update points
    const pointsElement = document.querySelector('.user-points');
    if (pointsElement) pointsElement.textContent = currentUser.points;

    // Update total donated
    const donatedElement = document.querySelector('.total-donated');
    if (donatedElement) donatedElement.textContent = currentUser.totalDonated;

    // Update people helped
    const helpedElement = document.querySelector('.people-helped');
    if (helpedElement) helpedElement.textContent = currentUser.peopleHelped;

    // Update level progress bar
    updateLevelProgress();
}

function updateLevelProgress() {
    const levelBar = document.querySelector('.level-bar');
    if (!levelBar) return;

    const pointsToNextLevel = {
        'Bronze': 1000,
        'Silver': 5000,
        'Gold': 10000
    };

    const currentLevelPoints = pointsToNextLevel[currentUser.level] || 1000;
    const progress = (currentUser.points / currentLevelPoints) * 100;
    levelBar.style.width = `${Math.min(progress, 100)}%`;
}

// Authentication functions
async function checkAuthStatus() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return null;
    }

    try {
        const response = await fetch('/api/verify-token', {
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Invalid token');
        }

        const data = await response.json();
        if (data.valid) {
            currentUser.username = data.username;
            document.querySelector('.user-name').textContent = data.username;
            return data;
        } else {
            throw new Error('Invalid token');
        }
    } catch (error) {
        console.error('Authentication error:', error);
        handleLogout();
        return null;
    }
}

async function loadUserData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load user data');
        }

        const userData = await response.json();
        currentUser = {
            ...currentUser,
            ...userData
        };

        // Update UI with user data
        document.querySelector('.user-name').textContent = userData.username;
        updateUserStats();
        updateLevelProgress();
    } catch (error) {
        console.error('Failed to load user data:', error);
    }
}

function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = '/login';
}

// Campaign management
function updateCampaignList(campaigns) {
    const campaignList = document.querySelector('.campaign-list');
    campaignList.innerHTML = '<h2>Active Campaigns</h2>';

    if (!campaigns || campaigns.length === 0) {
        campaignList.innerHTML += '<p>No active campaigns at the moment.</p>';
        return;
    }

    campaigns.forEach(campaign => {
        campaignList.appendChild(createCampaignCard(campaign));
    });
}

function createCampaignCard(campaign) {
    const card = document.createElement('div');
    const isCompleted = campaign.amount_raised >= campaign.amount_needed;
    const amountLeft = campaign.amount_needed - campaign.amount_raised;
    const progressPercentage = (campaign.amount_raised / campaign.amount_needed) * 100;
    const daysLeft = calculateDaysLeft(campaign.deadline);

    card.className = `campaign-card ${isCompleted ? 'campaign-completed' : ''}`;
    card.dataset.campaignId = campaign.id;
    card.dataset.currentAmount = campaign.amount_raised;
    card.dataset.targetAmount = campaign.amount_needed;

    card.innerHTML = `
        <img src="${campaign.image || 'https://via.placeholder.com/120'}" alt="${campaign.title}" class="campaign-image">
        <div class="campaign-info">
            <div class="campaign-header">
                <h3>${campaign.title}</h3>
                <span class="campaign-status ${isCompleted ? 'status-completed' : ''}">${isCompleted ? 'Completed!' : 'Active'}</span>
            </div>
            <p>${campaign.description}</p>
            <div class="campaign-amount">
                <span class="amount-target">Target: $${campaign.amount_needed.toFixed(2)}</span>
                <span class="amount-raised">Raised: $${campaign.amount_raised.toFixed(2)}</span>
                <span class="amount-left">Left: $${amountLeft.toFixed(2)}</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercentage}%"></div>
            </div>
            <div class="campaign-deadline ${daysLeft <= 3 ? 'deadline-urgent' : ''}">
                <i class="fas fa-clock"></i>
                <span>${daysLeft > 0 ? `${daysLeft} days left` : 'Deadline passed'}</span>
            </div>
        </div>
        <button class="pay-button" onclick="openPaymentModal(${campaign.id})" ${isCompleted ? 'disabled' : ''}>
            ${isCompleted ? 'Completed' : 'Donate'}
        </button>
    `;

    return card;
}

// Payment handling
function openPaymentModal(campaignId) {
    const modal = document.getElementById('paymentModal');
    const campaign = campaigns.find(c => c.id === campaignId);
    
    document.getElementById('modal-campaign-name').textContent = `Campaign by: ${campaign.creator}`;
    document.getElementById('modal-amount-left').textContent = `Amount Left: $${(campaign.amount_needed - campaign.amount_raised).toFixed(2)}`;
    modal.dataset.campaignId = campaignId;
    modal.classList.add('active');
}

function closePayModal() {
    const modal = document.getElementById('paymentModal');
    modal.classList.remove('active');
    document.getElementById('payment-amount').value = '';
}

async function processPayment() {
    const modal = document.getElementById('paymentModal');
    const campaignId = parseInt(modal.dataset.campaignId);
    const amount = parseFloat(document.getElementById('payment-amount').value);

    if (!validatePayment(amount, campaignId)) return;

    try {
        const response = await submitDonation(campaignId, amount);
        if (response.ok) {
            const campaign = campaigns.find(c => c.id === campaignId);
            updateCampaignProgress(campaign, amount);
            updateUserStats(amount);
            addFeedItem(`You donated $${amount} to ${campaign.creator}'s campaign!`);
            closePayModal();
        }
    } catch (error) {
        console.error('Payment processing error:', error);
        alert('Failed to process payment. Please try again.');
    }
}

// Helper functions
function calculateDaysLeft(deadline) {
    const deadlineDate = new Date(deadline);
    const today = new Date('2025-01-12T01:14:03+01:00');
    return Math.ceil((deadlineDate - today) / (1000 * 60 * 60 * 24));
}

function validatePayment(amount, campaignId) {
    if (!amount || amount <= 0) {
        alert('Please enter a valid amount');
        return false;
    }

    const campaign = campaigns.find(c => c.id === campaignId);
    const amountLeft = campaign.amount_needed - campaign.amount_raised;
    const maxDonation = LEVEL_CONFIG[currentUser.level].maxDonation;

    if (amount > maxDonation) {
        alert(`Your current level only allows donations up to $${maxDonation}. Level up to donate more!`);
        return false;
    }

    if (amount > amountLeft) {
        alert(`The maximum amount needed is $${amountLeft}`);
        return false;
    }

    return true;
}

// Live feed management
function initializeLiveFeed() {
    addFeedItem("Welcome to your dashboard!");
    addFeedItem("Check out the latest campaigns below.");
}

function addFeedItem(message) {
    const feedContainer = document.querySelector('.feed-items');
    const feedItem = document.createElement('div');
    feedItem.className = 'feed-item new';
    feedItem.innerHTML = `<p>${message}</p>`;
    
    feedContainer.insertBefore(feedItem, feedContainer.firstChild);
    setTimeout(() => feedItem.classList.remove('new'), 2000);

    const items = feedContainer.getElementsByClassName('feed-item');
    if (items.length > 10) {
        feedContainer.removeChild(items[items.length - 1]);
    }
}

// User stats management
function updateUserStats(donationAmount = 0) {
    if (donationAmount > 0) {
        currentUser.totalDonated += donationAmount;
        currentUser.points += Math.floor(donationAmount / 10);
        updateLevelProgress();
    }

    document.querySelector('.total-donated').textContent = currentUser.totalDonated;
    document.querySelector('.people-helped').textContent = currentUser.peopleHelped;
    document.querySelector('.user-points').textContent = currentUser.points;
}

// API calls
async function submitDonation(campaignId, amount) {
    const token = localStorage.getItem('token');
    return fetch('/api/donations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ campaignId, amount })
    });
}

function updateUserData(userData) {
    currentUser = { ...currentUser, ...userData };
    updateUserStats();
    updateLevelProgress();
}
