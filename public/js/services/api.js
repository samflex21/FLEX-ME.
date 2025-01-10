class ApiService {
    constructor() {
        this.baseUrl = '/api';
        this.token = localStorage.getItem('token');
    }

    // Set auth token
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // Clear auth token
    clearToken() {
        this.token = null;
        localStorage.removeItem('token');
    }

    // Headers for authenticated requests
    get authHeaders() {
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };
    }

    // Basic headers for non-authenticated requests
    get headers() {
        return {
            'Content-Type': 'application/json'
        };
    }

    // Authentication APIs
    async register(userData) {
        const response = await fetch(`${this.baseUrl}/auth/register`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(userData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        this.setToken(data.token);
        return data;
    }

    async login(credentials) {
        const response = await fetch(`${this.baseUrl}/auth/login`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify(credentials)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        this.setToken(data.token);
        return data;
    }

    async getProfile() {
        const response = await fetch(`${this.baseUrl}/auth/profile`, {
            headers: this.authHeaders
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    }

    async updateProfile(profileData) {
        const response = await fetch(`${this.baseUrl}/auth/profile`, {
            method: 'PUT',
            headers: this.authHeaders,
            body: JSON.stringify(profileData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    }

    // Campaign APIs
    async createCampaign(campaignData) {
        const response = await fetch(`${this.baseUrl}/campaigns`, {
            method: 'POST',
            headers: this.authHeaders,
            body: JSON.stringify(campaignData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    }

    async getCampaigns(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${this.baseUrl}/campaigns?${queryString}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    }

    async getCampaign(id) {
        const response = await fetch(`${this.baseUrl}/campaigns/${id}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    }

    async updateCampaign(id, campaignData) {
        const response = await fetch(`${this.baseUrl}/campaigns/${id}`, {
            method: 'PUT',
            headers: this.authHeaders,
            body: JSON.stringify(campaignData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    }

    async deleteCampaign(id) {
        const response = await fetch(`${this.baseUrl}/campaigns/${id}`, {
            method: 'DELETE',
            headers: this.authHeaders
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    }

    // Donation APIs
    async createDonation(donationData) {
        const response = await fetch(`${this.baseUrl}/donations`, {
            method: 'POST',
            headers: this.authHeaders,
            body: JSON.stringify(donationData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    }

    async getUserDonations() {
        const response = await fetch(`${this.baseUrl}/donations/user`, {
            headers: this.authHeaders
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    }

    async getCampaignDonations(campaignId) {
        const response = await fetch(`${this.baseUrl}/donations/campaign/${campaignId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        return data;
    }
}

// Create a single instance to use throughout the application
const api = new ApiService();
export default api;
