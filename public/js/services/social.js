import api from './api.js';
import { showError, showSuccess } from '../utils.js';

class SocialService {
    constructor() {
        this.socialConnections = document.getElementById('socialConnections');
        this.shareButtons = document.querySelectorAll('.social-share');
        this.initialized = false;
    }

    async initialize() {
        try {
            await this.loadSocialSDKs();
            await this.loadConnectedAccounts();
            this.setupShareButtons();
            this.setupSocialLogin();
            this.setupAutoShare();
            this.initialized = true;
        } catch (error) {
            console.error('Social service initialization error:', error);
        }
    }

    async loadSocialSDKs() {
        return Promise.all([
            this.loadFacebookSDK(),
            this.loadTwitterSDK(),
            this.loadLinkedInSDK(),
            this.loadInstagramSDK()
        ]);
    }

    loadFacebookSDK() {
        return new Promise((resolve) => {
            if (document.getElementById('facebook-jssdk')) {
                resolve();
                return;
            }

            window.fbAsyncInit = () => {
                FB.init({
                    appId: api.getFacebookAppId(),
                    cookie: true,
                    xfbml: true,
                    version: 'v18.0'
                });
                resolve();
            };

            const script = document.createElement('script');
            script.id = 'facebook-jssdk';
            script.src = 'https://connect.facebook.net/en_US/sdk.js';
            document.head.appendChild(script);
        });
    }

    loadTwitterSDK() {
        return new Promise((resolve) => {
            if (document.getElementById('twitter-jssdk')) {
                resolve();
                return;
            }

            window.twttr = {
                _e: [],
                ready(callback) {
                    this._e.push(callback);
                }
            };

            const script = document.createElement('script');
            script.id = 'twitter-jssdk';
            script.src = 'https://platform.twitter.com/widgets.js';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    loadLinkedInSDK() {
        return new Promise((resolve) => {
            if (document.getElementById('linkedin-jssdk')) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.id = 'linkedin-jssdk';
            script.src = 'https://platform.linkedin.com/in.js';
            script.type = 'text/javascript';
            script.innerHTML = 'lang: en_US';
            script.onload = resolve;
            document.head.appendChild(script);
        });
    }

    loadInstagramSDK() {
        // Instagram Graph API integration
        return Promise.resolve();
    }

    async loadConnectedAccounts() {
        try {
            const accounts = await api.getConnectedSocialAccounts();
            this.renderConnectedAccounts(accounts);
        } catch (error) {
            showError('Failed to load connected social accounts');
        }
    }

    renderConnectedAccounts(accounts) {
        if (!this.socialConnections) return;

        this.socialConnections.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5>Connected Social Accounts</h5>
                </div>
                <div class="card-body">
                    <div class="social-account-list">
                        ${this.renderFacebookConnection(accounts.facebook)}
                        ${this.renderTwitterConnection(accounts.twitter)}
                        ${this.renderLinkedInConnection(accounts.linkedin)}
                        ${this.renderInstagramConnection(accounts.instagram)}
                    </div>
                </div>
            </div>
        `;

        // Setup connect/disconnect handlers
        this.setupConnectionHandlers();
    }

    renderFacebookConnection(account) {
        return `
            <div class="social-account-item">
                <div class="social-account-info">
                    <i class="fab fa-facebook"></i>
                    <div class="account-details">
                        <h6>Facebook</h6>
                        ${account ? `
                            <p>Connected as ${account.name}</p>
                            <button class="btn btn-sm btn-danger disconnect-social" 
                                    data-platform="facebook">
                                Disconnect
                            </button>
                        ` : `
                            <p>Not connected</p>
                            <button class="btn btn-sm btn-primary connect-social" 
                                    data-platform="facebook">
                                Connect
                            </button>
                        `}
                    </div>
                </div>
                ${account ? `
                    <div class="social-account-settings">
                        <div class="form-check">
                            <input type="checkbox" 
                                   class="form-check-input" 
                                   id="facebookAutoShare" 
                                   ${account.auto_share ? 'checked' : ''}>
                            <label class="form-check-label" for="facebookAutoShare">
                                Auto-share updates
                            </label>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderTwitterConnection(account) {
        return `
            <div class="social-account-item">
                <div class="social-account-info">
                    <i class="fab fa-twitter"></i>
                    <div class="account-details">
                        <h6>Twitter</h6>
                        ${account ? `
                            <p>Connected as @${account.username}</p>
                            <button class="btn btn-sm btn-danger disconnect-social" 
                                    data-platform="twitter">
                                Disconnect
                            </button>
                        ` : `
                            <p>Not connected</p>
                            <button class="btn btn-sm btn-primary connect-social" 
                                    data-platform="twitter">
                                Connect
                            </button>
                        `}
                    </div>
                </div>
                ${account ? `
                    <div class="social-account-settings">
                        <div class="form-check">
                            <input type="checkbox" 
                                   class="form-check-input" 
                                   id="twitterAutoShare" 
                                   ${account.auto_share ? 'checked' : ''}>
                            <label class="form-check-label" for="twitterAutoShare">
                                Auto-share updates
                            </label>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderLinkedInConnection(account) {
        return `
            <div class="social-account-item">
                <div class="social-account-info">
                    <i class="fab fa-linkedin"></i>
                    <div class="account-details">
                        <h6>LinkedIn</h6>
                        ${account ? `
                            <p>Connected as ${account.name}</p>
                            <button class="btn btn-sm btn-danger disconnect-social" 
                                    data-platform="linkedin">
                                Disconnect
                            </button>
                        ` : `
                            <p>Not connected</p>
                            <button class="btn btn-sm btn-primary connect-social" 
                                    data-platform="linkedin">
                                Connect
                            </button>
                        `}
                    </div>
                </div>
                ${account ? `
                    <div class="social-account-settings">
                        <div class="form-check">
                            <input type="checkbox" 
                                   class="form-check-input" 
                                   id="linkedinAutoShare" 
                                   ${account.auto_share ? 'checked' : ''}>
                            <label class="form-check-label" for="linkedinAutoShare">
                                Auto-share updates
                            </label>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    renderInstagramConnection(account) {
        return `
            <div class="social-account-item">
                <div class="social-account-info">
                    <i class="fab fa-instagram"></i>
                    <div class="account-details">
                        <h6>Instagram</h6>
                        ${account ? `
                            <p>Connected as @${account.username}</p>
                            <button class="btn btn-sm btn-danger disconnect-social" 
                                    data-platform="instagram">
                                Disconnect
                            </button>
                        ` : `
                            <p>Not connected</p>
                            <button class="btn btn-sm btn-primary connect-social" 
                                    data-platform="instagram">
                                Connect
                            </button>
                        `}
                    </div>
                </div>
                ${account ? `
                    <div class="social-account-settings">
                        <div class="form-check">
                            <input type="checkbox" 
                                   class="form-check-input" 
                                   id="instagramAutoShare" 
                                   ${account.auto_share ? 'checked' : ''}>
                            <label class="form-check-label" for="instagramAutoShare">
                                Auto-share updates
                            </label>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    setupConnectionHandlers() {
        // Connect buttons
        document.querySelectorAll('.connect-social').forEach(button => {
            button.addEventListener('click', async () => {
                const platform = button.dataset.platform;
                await this.connectSocialAccount(platform);
            });
        });

        // Disconnect buttons
        document.querySelectorAll('.disconnect-social').forEach(button => {
            button.addEventListener('click', async () => {
                const platform = button.dataset.platform;
                await this.disconnectSocialAccount(platform);
            });
        });

        // Auto-share toggles
        document.querySelectorAll('.social-account-settings input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', async () => {
                const platform = checkbox.id.replace('AutoShare', '').toLowerCase();
                await this.updateAutoShareSettings(platform, checkbox.checked);
            });
        });
    }

    setupShareButtons() {
        this.shareButtons?.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = button.dataset.platform;
                const url = button.dataset.url;
                const title = button.dataset.title;
                const image = button.dataset.image;
                this.shareToPlatform(platform, { url, title, image });
            });
        });
    }

    setupSocialLogin() {
        const socialLoginButtons = document.querySelectorAll('.social-login');
        socialLoginButtons?.forEach(button => {
            button.addEventListener('click', async (e) => {
                e.preventDefault();
                const platform = button.dataset.platform;
                await this.handleSocialLogin(platform);
            });
        });
    }

    setupAutoShare() {
        const autoShareToggles = document.querySelectorAll('.auto-share-toggle');
        autoShareToggles?.forEach(toggle => {
            toggle.addEventListener('change', async (e) => {
                const platform = toggle.dataset.platform;
                const enabled = e.target.checked;
                await this.updateAutoShareSettings(platform, enabled);
            });
        });
    }

    async connectSocialAccount(platform) {
        try {
            let authWindow;
            switch (platform) {
                case 'facebook':
                    await this.connectFacebook();
                    break;
                case 'twitter':
                    authWindow = this.openAuthWindow('/auth/twitter');
                    break;
                case 'linkedin':
                    authWindow = this.openAuthWindow('/auth/linkedin');
                    break;
                case 'instagram':
                    authWindow = this.openAuthWindow('/auth/instagram');
                    break;
            }

            if (authWindow) {
                this.handleAuthWindowCallback(authWindow, platform);
            }
        } catch (error) {
            showError(`Failed to connect ${platform} account`);
        }
    }

    async connectFacebook() {
        return new Promise((resolve, reject) => {
            FB.login(async (response) => {
                if (response.authResponse) {
                    try {
                        await api.connectFacebookAccount(response.authResponse);
                        await this.loadConnectedAccounts();
                        showSuccess('Facebook account connected successfully');
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error('Facebook login cancelled'));
                }
            }, { scope: 'public_profile,email' });
        });
    }

    async disconnectSocialAccount(platform) {
        try {
            await api.disconnectSocialAccount(platform);
            await this.loadConnectedAccounts();
            showSuccess(`${platform} account disconnected successfully`);
        } catch (error) {
            showError(`Failed to disconnect ${platform} account`);
        }
    }

    async updateAutoShareSettings(platform, enabled) {
        try {
            await api.updateSocialAutoShare(platform, enabled);
            showSuccess(`Auto-share settings updated for ${platform}`);
        } catch (error) {
            showError(`Failed to update auto-share settings for ${platform}`);
        }
    }

    async shareToPlatform(platform, { url, title, image }) {
        try {
            switch (platform) {
                case 'facebook':
                    await this.shareToFacebook(url, title, image);
                    break;
                case 'twitter':
                    this.shareToTwitter(url, title);
                    break;
                case 'linkedin':
                    this.shareToLinkedIn(url, title);
                    break;
                case 'whatsapp':
                    this.shareToWhatsApp(url, title);
                    break;
                case 'email':
                    this.shareViaEmail(url, title);
                    break;
            }
        } catch (error) {
            showError(`Failed to share to ${platform}`);
        }
    }

    async shareToFacebook(url, title, image) {
        return new Promise((resolve, reject) => {
            FB.ui({
                method: 'share',
                href: url,
                quote: title,
                image: image
            }, (response) => {
                if (response && !response.error_message) {
                    showSuccess('Shared successfully to Facebook');
                    resolve();
                } else {
                    reject(new Error('Facebook share cancelled or failed'));
                }
            });
        });
    }

    shareToTwitter(url, title) {
        const text = encodeURIComponent(title);
        const shareUrl = encodeURIComponent(url);
        window.open(
            `https://twitter.com/intent/tweet?text=${text}&url=${shareUrl}`,
            'twitter-share',
            'width=550,height=400'
        );
    }

    shareToLinkedIn(url, title) {
        const shareUrl = encodeURIComponent(url);
        window.open(
            `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
            'linkedin-share',
            'width=550,height=400'
        );
    }

    shareToWhatsApp(url, title) {
        const text = encodeURIComponent(`${title} ${url}`);
        window.open(`https://wa.me/?text=${text}`);
    }

    shareViaEmail(url, title) {
        const subject = encodeURIComponent(title);
        const body = encodeURIComponent(`Check out this campaign: ${url}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    }

    openAuthWindow(url) {
        return window.open(
            url,
            'social-auth',
            'width=600,height=600,scrollbars=yes'
        );
    }

    handleAuthWindowCallback(authWindow, platform) {
        const checkWindow = setInterval(async () => {
            try {
                if (authWindow.closed) {
                    clearInterval(checkWindow);
                    await this.loadConnectedAccounts();
                    showSuccess(`${platform} account connected successfully`);
                }
            } catch (error) {
                clearInterval(checkWindow);
                showError(`Failed to connect ${platform} account`);
            }
        }, 1000);
    }

    async handleSocialLogin(platform) {
        try {
            switch (platform) {
                case 'facebook':
                    await this.handleFacebookLogin();
                    break;
                case 'google':
                    await this.handleGoogleLogin();
                    break;
                default:
                    const authWindow = this.openAuthWindow(`/auth/${platform}`);
                    this.handleAuthWindowCallback(authWindow, platform);
            }
        } catch (error) {
            showError(`Failed to login with ${platform}`);
        }
    }

    async handleFacebookLogin() {
        return new Promise((resolve, reject) => {
            FB.login(async (response) => {
                if (response.authResponse) {
                    try {
                        const result = await api.loginWithFacebook(response.authResponse);
                        window.location.href = result.redirect || '/';
                        resolve();
                    } catch (error) {
                        reject(error);
                    }
                } else {
                    reject(new Error('Facebook login cancelled'));
                }
            }, { scope: 'public_profile,email' });
        });
    }

    async handleGoogleLogin() {
        // Implement Google login logic
    }
}

export default new SocialService();
