import api from './api.js';
import { showError, showSuccess } from '../utils.js';

class NotificationService {
    constructor() {
        this.notificationsList = document.getElementById('notificationsList');
        this.notificationBadge = document.getElementById('notificationBadge');
        this.emailPreferences = document.getElementById('emailPreferences');
        this.unreadCount = 0;
        this.socket = null;
    }

    async initialize() {
        try {
            await this.setupWebSocket();
            await this.loadNotifications();
            await this.loadEmailPreferences();
            this.setupNotificationHandlers();
            this.setupEmailPreferencesForm();
        } catch (error) {
            console.error('Notification initialization error:', error);
        }
    }

    async setupWebSocket() {
        try {
            this.socket = new WebSocket(api.getWebSocketUrl());
            
            this.socket.onmessage = (event) => {
                const notification = JSON.parse(event.data);
                this.handleNewNotification(notification);
            };

            this.socket.onclose = () => {
                setTimeout(() => this.setupWebSocket(), 5000); // Reconnect after 5 seconds
            };
        } catch (error) {
            console.error('WebSocket connection error:', error);
        }
    }

    async loadNotifications(page = 1) {
        try {
            const response = await api.getNotifications(page);
            this.renderNotifications(response.notifications);
            this.updateUnreadCount(response.unread_count);
            return response;
        } catch (error) {
            showError('Failed to load notifications');
            return null;
        }
    }

    async loadEmailPreferences() {
        try {
            const preferences = await api.getEmailPreferences();
            this.renderEmailPreferences(preferences);
        } catch (error) {
            showError('Failed to load email preferences');
        }
    }

    renderNotifications(notifications) {
        if (!this.notificationsList) return;

        this.notificationsList.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.read ? '' : 'unread'}" 
                 data-id="${notification._id}">
                <div class="notification-icon">
                    <i class="fas ${this.getNotificationIcon(notification.type)}"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-meta">
                        <small class="text-muted">${this.formatTimeAgo(notification.createdAt)}</small>
                        ${!notification.read ? `
                            <button class="btn btn-sm btn-link mark-read"
                                    data-id="${notification._id}">
                                Mark as read
                            </button>
                        ` : ''}
                    </div>
                </div>
                ${notification.action ? `
                    <a href="${notification.action.url}" 
                       class="btn btn-sm btn-primary notification-action">
                        ${notification.action.text}
                    </a>
                ` : ''}
            </div>
        `).join('');
    }

    renderEmailPreferences(preferences) {
        if (!this.emailPreferences) return;

        this.emailPreferences.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5>Email Notification Settings</h5>
                </div>
                <div class="card-body">
                    <form id="emailPreferencesForm">
                        <div class="mb-3">
                            <h6>Campaign Updates</h6>
                            <div class="form-check">
                                <input type="checkbox" 
                                       class="form-check-input" 
                                       id="newDonations" 
                                       name="campaign_donations" 
                                       ${preferences.campaign_donations ? 'checked' : ''}>
                                <label class="form-check-label" for="newDonations">
                                    New donations to my campaigns
                                </label>
                            </div>
                            <div class="form-check">
                                <input type="checkbox" 
                                       class="form-check-input" 
                                       id="campaignComments" 
                                       name="campaign_comments" 
                                       ${preferences.campaign_comments ? 'checked' : ''}>
                                <label class="form-check-label" for="campaignComments">
                                    New comments on my campaigns
                                </label>
                            </div>
                            <div class="form-check">
                                <input type="checkbox" 
                                       class="form-check-input" 
                                       id="campaignMilestones" 
                                       name="campaign_milestones" 
                                       ${preferences.campaign_milestones ? 'checked' : ''}>
                                <label class="form-check-label" for="campaignMilestones">
                                    Campaign milestones reached
                                </label>
                            </div>
                        </div>

                        <div class="mb-3">
                            <h6>Account Activity</h6>
                            <div class="form-check">
                                <input type="checkbox" 
                                       class="form-check-input" 
                                       id="accountSecurity" 
                                       name="account_security" 
                                       ${preferences.account_security ? 'checked' : ''}>
                                <label class="form-check-label" for="accountSecurity">
                                    Account security alerts
                                </label>
                            </div>
                            <div class="form-check">
                                <input type="checkbox" 
                                       class="form-check-input" 
                                       id="accountUpdates" 
                                       name="account_updates" 
                                       ${preferences.account_updates ? 'checked' : ''}>
                                <label class="form-check-label" for="accountUpdates">
                                    Account updates and changes
                                </label>
                            </div>
                        </div>

                        <div class="mb-3">
                            <h6>Marketing Communications</h6>
                            <div class="form-check">
                                <input type="checkbox" 
                                       class="form-check-input" 
                                       id="marketingUpdates" 
                                       name="marketing_updates" 
                                       ${preferences.marketing_updates ? 'checked' : ''}>
                                <label class="form-check-label" for="marketingUpdates">
                                    Platform updates and news
                                </label>
                            </div>
                            <div class="form-check">
                                <input type="checkbox" 
                                       class="form-check-input" 
                                       id="marketingPromotions" 
                                       name="marketing_promotions" 
                                       ${preferences.marketing_promotions ? 'checked' : ''}>
                                <label class="form-check-label" for="marketingPromotions">
                                    Special promotions and offers
                                </label>
                            </div>
                        </div>

                        <div class="mb-3">
                            <h6>Email Frequency</h6>
                            <select class="form-select" name="email_frequency">
                                <option value="immediate" 
                                        ${preferences.email_frequency === 'immediate' ? 'selected' : ''}>
                                    Send immediately
                                </option>
                                <option value="daily" 
                                        ${preferences.email_frequency === 'daily' ? 'selected' : ''}>
                                    Daily digest
                                </option>
                                <option value="weekly" 
                                        ${preferences.email_frequency === 'weekly' ? 'selected' : ''}>
                                    Weekly digest
                                </option>
                            </select>
                        </div>

                        <button type="submit" class="btn btn-primary">
                            Save Preferences
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    setupNotificationHandlers() {
        // Mark single notification as read
        this.notificationsList?.addEventListener('click', async (e) => {
            if (e.target.classList.contains('mark-read')) {
                const notificationId = e.target.dataset.id;
                await this.markAsRead(notificationId);
            }
        });

        // Mark all as read
        const markAllRead = document.getElementById('markAllRead');
        markAllRead?.addEventListener('click', async () => {
            await this.markAllAsRead();
        });

        // Load more notifications
        const loadMore = document.getElementById('loadMoreNotifications');
        loadMore?.addEventListener('click', async () => {
            const currentPage = parseInt(loadMore.dataset.page) || 1;
            const response = await this.loadNotifications(currentPage + 1);
            if (response?.notifications.length > 0) {
                loadMore.dataset.page = currentPage + 1;
            } else {
                loadMore.style.display = 'none';
            }
        });
    }

    setupEmailPreferencesForm() {
        const form = document.getElementById('emailPreferencesForm');
        form?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateEmailPreferences(new FormData(form));
        });
    }

    async markAsRead(notificationId) {
        try {
            await api.markNotificationAsRead(notificationId);
            const notification = this.notificationsList?.querySelector(`[data-id="${notificationId}"]`);
            notification?.classList.remove('unread');
            this.updateUnreadCount(this.unreadCount - 1);
        } catch (error) {
            showError('Failed to mark notification as read');
        }
    }

    async markAllAsRead() {
        try {
            await api.markAllNotificationsAsRead();
            const unreadNotifications = this.notificationsList?.querySelectorAll('.unread');
            unreadNotifications?.forEach(notification => {
                notification.classList.remove('unread');
            });
            this.updateUnreadCount(0);
            showSuccess('All notifications marked as read');
        } catch (error) {
            showError('Failed to mark all notifications as read');
        }
    }

    async updateEmailPreferences(formData) {
        try {
            const preferences = Object.fromEntries(formData.entries());
            await api.updateEmailPreferences(preferences);
            showSuccess('Email preferences updated successfully');
        } catch (error) {
            showError('Failed to update email preferences');
        }
    }

    handleNewNotification(notification) {
        // Add notification to the list
        if (this.notificationsList) {
            const notificationHTML = this.renderNotification(notification);
            this.notificationsList.insertAdjacentHTML('afterbegin', notificationHTML);
        }

        // Update unread count
        this.updateUnreadCount(this.unreadCount + 1);

        // Show browser notification if permitted
        this.showBrowserNotification(notification);
    }

    updateUnreadCount(count) {
        this.unreadCount = count;
        if (this.notificationBadge) {
            this.notificationBadge.textContent = count;
            this.notificationBadge.style.display = count > 0 ? 'block' : 'none';
        }
    }

    getNotificationIcon(type) {
        const icons = {
            'donation': 'fa-gift',
            'comment': 'fa-comment',
            'milestone': 'fa-flag',
            'update': 'fa-bell',
            'security': 'fa-shield-alt'
        };
        return icons[type] || 'fa-bell';
    }

    formatTimeAgo(date) {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000);
        
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + ' years ago';
        
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + ' months ago';
        
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + ' days ago';
        
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + ' hours ago';
        
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + ' minutes ago';
        
        return 'just now';
    }

    async showBrowserNotification(notification) {
        if (!('Notification' in window)) return;

        if (Notification.permission === 'granted') {
            new Notification(notification.title, {
                body: notification.message,
                icon: '/images/logo.png'
            });
        } else if (Notification.permission !== 'denied') {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                new Notification(notification.title, {
                    body: notification.message,
                    icon: '/images/logo.png'
                });
            }
        }
    }
}

export default new NotificationService();
