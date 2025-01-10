import api from './api.js';
import { showError, showSuccess, formatDate, validateForm } from '../utils.js';

class ProfileService {
    constructor() {
        this.profileForm = document.getElementById('profileForm');
        this.avatarPreview = document.getElementById('avatarPreview');
        this.avatarInput = document.getElementById('avatarInput');
        this.profileStats = document.getElementById('profileStats');
        this.activityFeed = document.getElementById('activityFeed');
        this.achievementsList = document.getElementById('achievementsList');
    }

    async initialize() {
        try {
            const profile = await api.getProfile();
            this.renderProfile(profile);
            this.setupProfileForm();
            this.setupAvatarUpload();
            await this.loadActivityFeed();
            this.loadAchievements();
            this.setupSettingsTabs();
        } catch (error) {
            showError('Failed to load profile');
            console.error('Profile initialization error:', error);
        }
    }

    renderProfile(profile) {
        // Update profile header
        const profileHeader = document.getElementById('profileHeader');
        if (profileHeader) {
            profileHeader.innerHTML = `
                <div class="profile-cover">
                    <img src="${profile.cover_image || 'images/default-cover.jpg'}" alt="Cover">
                </div>
                <div class="profile-info">
                    <div class="profile-avatar">
                        <img src="${profile.avatar || 'images/default-avatar.jpg'}" 
                             alt="${profile.username}"
                             class="rounded-circle">
                        <button class="btn btn-sm btn-light edit-avatar" id="editAvatar">
                            <i class="fas fa-camera"></i>
                        </button>
                    </div>
                    <div class="profile-details">
                        <h2>${profile.username}</h2>
                        <p class="text-muted">Member since ${formatDate(profile.createdAt)}</p>
                        <div class="profile-badges">
                            ${this.renderBadges(profile.badges)}
                        </div>
                    </div>
                </div>
            `;
        }

        // Update profile stats
        if (this.profileStats) {
            this.profileStats.innerHTML = `
                <div class="row">
                    <div class="col-md-3">
                        <div class="stat-card">
                            <h4>Level</h4>
                            <p class="level-${profile.level.toLowerCase()}">${profile.level}</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <h4>Points</h4>
                            <p>${profile.points}</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <h4>Campaigns</h4>
                            <p>${profile.campaigns_count}</p>
                        </div>
                    </div>
                    <div class="col-md-3">
                        <div class="stat-card">
                            <h4>Donations</h4>
                            <p>${profile.donations_count}</p>
                        </div>
                    </div>
                </div>
            `;
        }

        // Populate form fields
        if (this.profileForm) {
            const fields = ['username', 'email', 'first_name', 'last_name', 'bio', 'location'];
            fields.forEach(field => {
                const input = this.profileForm.querySelector(`[name="${field}"]`);
                if (input) {
                    input.value = profile[field] || '';
                }
            });
        }
    }

    renderBadges(badges) {
        return badges.map(badge => `
            <span class="badge badge-${badge.type}" 
                  data-toggle="tooltip" 
                  title="${badge.description}">
                <i class="${badge.icon}"></i>
                ${badge.name}
            </span>
        `).join('');
    }

    setupProfileForm() {
        this.profileForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleProfileUpdate(e);
        });

        // Setup form validation
        const inputs = this.profileForm?.querySelectorAll('input, textarea');
        inputs?.forEach(input => {
            input.addEventListener('input', () => this.validateField(input));
            input.addEventListener('blur', () => this.validateField(input));
        });
    }

    setupAvatarUpload() {
        const editAvatarBtn = document.getElementById('editAvatar');
        editAvatarBtn?.addEventListener('click', () => {
            this.avatarInput?.click();
        });

        this.avatarInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                showError('Please select an image file');
                return;
            }

            try {
                const formData = new FormData();
                formData.append('avatar', file);
                await api.updateAvatar(formData);
                
                // Update avatar preview
                const reader = new FileReader();
                reader.onload = (event) => {
                    const avatarImages = document.querySelectorAll('.profile-avatar img');
                    avatarImages.forEach(img => {
                        img.src = event.target.result;
                    });
                };
                reader.readAsDataURL(file);

                showSuccess('Profile picture updated successfully');
            } catch (error) {
                showError('Failed to update profile picture');
            }
        });
    }

    async handleProfileUpdate(event) {
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const loadingSpinner = form.querySelector('.spinner-border');

        try {
            if (!this.validateForm()) {
                return;
            }

            submitBtn.disabled = true;
            loadingSpinner.style.display = 'inline-block';

            const formData = new FormData(form);
            const profileData = {
                username: formData.get('username'),
                email: formData.get('email'),
                first_name: formData.get('first_name'),
                last_name: formData.get('last_name'),
                bio: formData.get('bio'),
                location: formData.get('location')
            };

            const updatedProfile = await api.updateProfile(profileData);
            this.renderProfile(updatedProfile);
            showSuccess('Profile updated successfully');
        } catch (error) {
            showError(error.message || 'Failed to update profile');
        } finally {
            submitBtn.disabled = false;
            loadingSpinner.style.display = 'none';
        }
    }

    validateForm() {
        const rules = {
            username: { required: true, minLength: 3, maxLength: 30 },
            email: { required: true, email: true },
            first_name: { required: true },
            last_name: { required: true },
            bio: { maxLength: 500 }
        };

        const formData = new FormData(this.profileForm);
        const data = {};
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        const errors = validateForm(data, rules);
        
        if (Object.keys(errors).length > 0) {
            Object.entries(errors).forEach(([field, message]) => {
                const input = this.profileForm?.querySelector(`[name="${field}"]`);
                if (input) {
                    this.showFieldError(input, message);
                }
            });
            return false;
        }

        return true;
    }

    validateField(input) {
        const value = input.value.trim();
        const name = input.name;

        switch (name) {
            case 'username':
                if (!value) {
                    this.showFieldError(input, 'Username is required');
                } else if (value.length < 3) {
                    this.showFieldError(input, 'Username must be at least 3 characters');
                } else if (value.length > 30) {
                    this.showFieldError(input, 'Username must be less than 30 characters');
                } else {
                    this.clearFieldError(input);
                }
                break;

            case 'email':
                if (!value) {
                    this.showFieldError(input, 'Email is required');
                } else if (!this.isValidEmail(value)) {
                    this.showFieldError(input, 'Please enter a valid email');
                } else {
                    this.clearFieldError(input);
                }
                break;

            case 'bio':
                if (value.length > 500) {
                    this.showFieldError(input, 'Bio must be less than 500 characters');
                } else {
                    this.clearFieldError(input);
                }
                break;

            default:
                if (input.required && !value) {
                    this.showFieldError(input, `${input.name.replace('_', ' ')} is required`);
                } else {
                    this.clearFieldError(input);
                }
        }
    }

    showFieldError(input, message) {
        input.classList.add('is-invalid');
        const errorDiv = input.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
            errorDiv.textContent = message;
        } else {
            const div = document.createElement('div');
            div.className = 'invalid-feedback';
            div.textContent = message;
            input.parentNode.insertBefore(div, input.nextSibling);
        }
    }

    clearFieldError(input) {
        input.classList.remove('is-invalid');
        const errorDiv = input.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('invalid-feedback')) {
            errorDiv.textContent = '';
        }
    }

    isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    async loadActivityFeed() {
        try {
            const activities = await api.getUserActivities();
            this.renderActivityFeed(activities);
        } catch (error) {
            showError('Failed to load activity feed');
        }
    }

    renderActivityFeed(activities) {
        if (!this.activityFeed) return;

        if (activities.length === 0) {
            this.activityFeed.innerHTML = `
                <div class="text-center my-4">
                    <p>No recent activity</p>
                </div>
            `;
            return;
        }

        this.activityFeed.innerHTML = activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-content">
                    <p>${this.formatActivityMessage(activity)}</p>
                    <small class="text-muted">${formatDate(activity.createdAt)}</small>
                </div>
            </div>
        `).join('');
    }

    getActivityIcon(type) {
        const icons = {
            campaign_created: 'fas fa-plus-circle',
            campaign_updated: 'fas fa-edit',
            donation_made: 'fas fa-hand-holding-heart',
            level_up: 'fas fa-arrow-up',
            badge_earned: 'fas fa-award'
        };
        return icons[type] || 'fas fa-circle';
    }

    formatActivityMessage(activity) {
        switch (activity.type) {
            case 'campaign_created':
                return `Created a new campaign: <a href="campaign-details.html?id=${activity.campaign._id}">${activity.campaign.title}</a>`;
            case 'campaign_updated':
                return `Updated campaign: <a href="campaign-details.html?id=${activity.campaign._id}">${activity.campaign.title}</a>`;
            case 'donation_made':
                return `Donated ${activity.amount} to <a href="campaign-details.html?id=${activity.campaign._id}">${activity.campaign.title}</a>`;
            case 'level_up':
                return `Reached ${activity.level} level!`;
            case 'badge_earned':
                return `Earned the ${activity.badge.name} badge`;
            default:
                return activity.message;
        }
    }

    loadAchievements() {
        if (!this.achievementsList) return;

        // This would typically come from the API
        const achievements = [
            {
                name: 'First Campaign',
                description: 'Created your first campaign',
                icon: 'fas fa-flag',
                progress: 100,
                completed: true
            },
            {
                name: 'Generous Donor',
                description: 'Made 5 donations',
                icon: 'fas fa-gift',
                progress: 60,
                completed: false,
                current: 3,
                target: 5
            }
            // Add more achievements
        ];

        this.achievementsList.innerHTML = achievements.map(achievement => `
            <div class="achievement-card ${achievement.completed ? 'completed' : ''}">
                <div class="achievement-icon">
                    <i class="${achievement.icon}"></i>
                </div>
                <div class="achievement-content">
                    <h4>${achievement.name}</h4>
                    <p>${achievement.description}</p>
                    ${!achievement.completed ? `
                        <div class="progress">
                            <div class="progress-bar" 
                                 role="progressbar" 
                                 style="width: ${achievement.progress}%"
                                 aria-valuenow="${achievement.progress}" 
                                 aria-valuemin="0" 
                                 aria-valuemax="100">
                                ${achievement.current}/${achievement.target}
                            </div>
                        </div>
                    ` : ''}
                </div>
                ${achievement.completed ? `
                    <div class="achievement-completed">
                        <i class="fas fa-check-circle"></i>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    setupSettingsTabs() {
        const tabs = document.querySelectorAll('.settings-tab');
        const tabContents = document.querySelectorAll('.settings-content');

        tabs?.forEach(tab => {
            tab.addEventListener('click', () => {
                const target = tab.dataset.target;

                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                // Show selected content
                tabContents.forEach(content => {
                    content.style.display = content.id === target ? 'block' : 'none';
                });
            });
        });
    }
}

export default new ProfileService();
