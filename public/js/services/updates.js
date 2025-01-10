import api from './api.js';
import { showError, showSuccess, formatDate } from '../utils.js';

class UpdatesService {
    constructor() {
        this.updatesList = document.getElementById('updatesList');
        this.updateForm = document.getElementById('updateForm');
        this.updateModal = document.getElementById('updateModal');
        this.currentPage = 1;
        this.hasMore = true;
    }

    async initialize(campaignId) {
        try {
            await this.loadUpdates(campaignId);
            this.setupUpdateForm(campaignId);
            this.setupLoadMore(campaignId);
            this.setupUpdateModal();
        } catch (error) {
            showError('Failed to initialize updates');
            console.error('Updates initialization error:', error);
        }
    }

    async loadUpdates(campaignId, page = 1) {
        try {
            const updates = await api.getCampaignUpdates(campaignId, page);
            
            if (page === 1) {
                this.updatesList.innerHTML = '';
            }

            this.renderUpdates(updates.data);
            this.hasMore = updates.hasMore;
            this.updateLoadMoreButton();
        } catch (error) {
            showError('Failed to load updates');
        }
    }

    setupUpdateForm(campaignId) {
        this.updateForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleUpdateSubmit(e, campaignId);
        });
    }

    setupLoadMore(campaignId) {
        const loadMoreBtn = document.getElementById('loadMoreUpdates');
        loadMoreBtn?.addEventListener('click', async () => {
            this.currentPage++;
            await this.loadUpdates(campaignId, this.currentPage);
        });
    }

    setupUpdateModal() {
        // Setup rich text editor if available
        if (window.tinymce) {
            tinymce.init({
                selector: '#updateContent',
                plugins: 'link lists image',
                toolbar: 'undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link image',
                height: 300
            });
        }

        // Handle image uploads in the modal
        const imageInput = document.getElementById('updateImage');
        imageInput?.addEventListener('change', this.handleImagePreview.bind(this));
    }

    renderUpdates(updates) {
        const updatesHTML = updates.map(update => this.renderUpdate(update)).join('');
        
        if (this.currentPage === 1) {
            this.updatesList.innerHTML = updatesHTML;
        } else {
            this.updatesList.insertAdjacentHTML('beforeend', updatesHTML);
        }
    }

    renderUpdate(update) {
        return `
            <div class="update-card" id="update-${update._id}">
                <div class="update-header">
                    <div class="update-meta">
                        <h4>${update.title}</h4>
                        <small class="text-muted">
                            Posted by ${update.author.username} on ${formatDate(update.createdAt)}
                        </small>
                    </div>
                    ${update.author._id === api.getCurrentUserId() ? `
                        <div class="update-actions dropdown">
                            <button class="btn btn-link dropdown-toggle" 
                                    data-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="dropdown-menu dropdown-menu-right">
                                <button class="dropdown-item edit-update" 
                                        data-update-id="${update._id}">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="dropdown-item delete-update" 
                                        data-update-id="${update._id}">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    ` : ''}
                </div>

                ${update.image ? `
                    <div class="update-image">
                        <img src="${update.image}" 
                             alt="Update image" 
                             class="img-fluid rounded">
                    </div>
                ` : ''}

                <div class="update-content">
                    ${update.content}
                </div>

                <div class="update-footer">
                    <button class="btn btn-sm btn-link like-button ${update.liked ? 'liked' : ''}"
                            data-update-id="${update._id}">
                        <i class="fas fa-heart"></i>
                        <span class="likes-count">${update.likes_count || 0}</span>
                    </button>
                    <button class="btn btn-sm btn-link share-button"
                            data-update-title="${update.title}"
                            data-update-url="campaign-details.html?id=${update.campaign}&update=${update._id}">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                </div>
            </div>
        `;
    }

    async handleUpdateSubmit(event, campaignId) {
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const loadingSpinner = form.querySelector('.spinner-border');

        try {
            submitBtn.disabled = true;
            loadingSpinner.style.display = 'inline-block';

            const formData = new FormData(form);
            const updateData = {
                title: formData.get('title'),
                content: window.tinymce ? tinymce.get('updateContent').getContent() : formData.get('content'),
                campaign: campaignId
            };

            // Handle image upload
            const imageFile = formData.get('image');
            if (imageFile?.size > 0) {
                const imageUrl = await this.uploadImage(imageFile);
                updateData.image = imageUrl;
            }

            const newUpdate = await api.createUpdate(updateData);

            // Add new update to the list
            this.updatesList.insertAdjacentHTML('afterbegin', this.renderUpdate(newUpdate));

            // Reset form and close modal
            form.reset();
            if (window.tinymce) {
                tinymce.get('updateContent').setContent('');
            }
            const modal = bootstrap.Modal.getInstance(this.updateModal);
            modal?.hide();

            showSuccess('Update posted successfully');
        } catch (error) {
            showError('Failed to post update');
        } finally {
            submitBtn.disabled = false;
            loadingSpinner.style.display = 'none';
        }
    }

    async handleImagePreview(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            showError('Please select an image file');
            event.target.value = '';
            return;
        }

        const preview = document.getElementById('updateImagePreview');
        if (preview) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `
                    <img src="${e.target.result}" 
                         class="img-fluid rounded" 
                         alt="Update preview">
                    <button type="button" class="btn btn-sm btn-danger remove-image">
                        Remove Image
                    </button>
                `;

                preview.querySelector('.remove-image')?.addEventListener('click', () => {
                    event.target.value = '';
                    preview.innerHTML = '';
                });
            };
            reader.readAsDataURL(file);
        }
    }

    async uploadImage(file) {
        try {
            const formData = new FormData();
            formData.append('image', file);
            const response = await api.uploadImage(formData);
            return response.url;
        } catch (error) {
            throw new Error('Failed to upload image');
        }
    }

    updateLoadMoreButton() {
        const loadMoreBtn = document.getElementById('loadMoreUpdates');
        if (loadMoreBtn) {
            loadMoreBtn.style.display = this.hasMore ? 'block' : 'none';
        }
    }

    async handleUpdateEdit(updateId) {
        try {
            const update = await api.getUpdate(updateId);
            
            // Populate modal form
            const form = this.updateModal.querySelector('form');
            form.querySelector('[name="title"]').value = update.title;
            
            if (window.tinymce) {
                tinymce.get('updateContent').setContent(update.content);
            } else {
                form.querySelector('[name="content"]').value = update.content;
            }

            if (update.image) {
                const preview = document.getElementById('updateImagePreview');
                preview.innerHTML = `
                    <img src="${update.image}" 
                         class="img-fluid rounded" 
                         alt="Update preview">
                    <button type="button" class="btn btn-sm btn-danger remove-image">
                        Remove Image
                    </button>
                `;
            }

            // Update form action
            form.dataset.updateId = updateId;

            // Show modal
            const modal = new bootstrap.Modal(this.updateModal);
            modal.show();
        } catch (error) {
            showError('Failed to load update');
        }
    }

    async handleUpdateDelete(updateId) {
        if (!confirm('Are you sure you want to delete this update?')) {
            return;
        }

        try {
            await api.deleteUpdate(updateId);
            const updateElement = this.updatesList.querySelector(`#update-${updateId}`);
            updateElement?.remove();
            showSuccess('Update deleted successfully');
        } catch (error) {
            showError('Failed to delete update');
        }
    }

    async handleUpdateLike(updateId) {
        try {
            const result = await api.toggleUpdateLike(updateId);
            const likeButton = this.updatesList.querySelector(`#update-${updateId} .like-button`);
            const likesCount = likeButton?.querySelector('.likes-count');
            
            if (likeButton && likesCount) {
                likeButton.classList.toggle('liked', result.liked);
                likesCount.textContent = result.likes_count;
            }
        } catch (error) {
            showError('Failed to update like');
        }
    }

    handleShare(title, url) {
        if (navigator.share) {
            navigator.share({
                title: title,
                url: url
            }).catch(console.error);
        } else {
            // Fallback to copying to clipboard
            navigator.clipboard.writeText(url).then(() => {
                showSuccess('Link copied to clipboard');
            }).catch(() => {
                showError('Failed to copy link');
            });
        }
    }
}

export default new UpdatesService();
