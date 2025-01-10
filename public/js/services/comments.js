import api from './api.js';
import { showError, showSuccess, formatDate } from '../utils.js';

class CommentsService {
    constructor() {
        this.commentsList = document.getElementById('commentsList');
        this.commentForm = document.getElementById('commentForm');
        this.loadMoreBtn = document.getElementById('loadMoreComments');
        this.currentPage = 1;
        this.hasMore = true;
    }

    async initialize(campaignId) {
        try {
            await this.loadComments(campaignId);
            this.setupCommentForm(campaignId);
            this.setupLoadMore(campaignId);
            this.setupReplyButtons();
            this.setupSortingOptions();
        } catch (error) {
            showError('Failed to initialize comments');
            console.error('Comments initialization error:', error);
        }
    }

    async loadComments(campaignId, page = 1, sort = 'newest') {
        try {
            const comments = await api.getCampaignComments(campaignId, page, sort);
            
            if (page === 1) {
                this.commentsList.innerHTML = '';
            }

            this.renderComments(comments.data);
            this.hasMore = comments.hasMore;
            this.updateLoadMoreButton();
        } catch (error) {
            showError('Failed to load comments');
        }
    }

    setupCommentForm(campaignId) {
        this.commentForm?.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleCommentSubmit(e, campaignId);
        });
    }

    setupLoadMore(campaignId) {
        this.loadMoreBtn?.addEventListener('click', async () => {
            this.currentPage++;
            await this.loadComments(campaignId, this.currentPage);
        });
    }

    setupReplyButtons() {
        this.commentsList?.addEventListener('click', async (e) => {
            if (e.target.matches('.reply-button')) {
                const commentId = e.target.dataset.commentId;
                this.showReplyForm(commentId);
            }
        });
    }

    setupSortingOptions() {
        const sortSelect = document.getElementById('commentSort');
        sortSelect?.addEventListener('change', async (e) => {
            const campaignId = this.commentForm?.dataset.campaignId;
            if (campaignId) {
                this.currentPage = 1;
                await this.loadComments(campaignId, 1, e.target.value);
            }
        });
    }

    async handleCommentSubmit(event, campaignId) {
        const form = event.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const loadingSpinner = form.querySelector('.spinner-border');
        const commentInput = form.querySelector('textarea');
        const parentId = form.dataset.parentId;

        try {
            const comment = commentInput.value.trim();
            if (!comment) {
                showError('Please enter a comment');
                return;
            }

            submitBtn.disabled = true;
            loadingSpinner.style.display = 'inline-block';

            const commentData = {
                content: comment,
                campaign: campaignId,
                parent: parentId || null
            };

            const newComment = await api.createComment(commentData);

            if (parentId) {
                // Add reply to existing comment
                const parentComment = this.commentsList.querySelector(`#comment-${parentId}`);
                const repliesList = parentComment.querySelector('.replies-list');
                if (!repliesList) {
                    parentComment.appendChild(this.createRepliesList([newComment]));
                } else {
                    repliesList.insertAdjacentHTML('beforeend', this.renderComment(newComment));
                }
                this.removeReplyForm(parentId);
            } else {
                // Add new top-level comment
                this.commentsList.insertAdjacentHTML('afterbegin', this.renderComment(newComment));
            }

            form.reset();
            showSuccess('Comment posted successfully');
        } catch (error) {
            showError('Failed to post comment');
        } finally {
            submitBtn.disabled = false;
            loadingSpinner.style.display = 'none';
        }
    }

    renderComments(comments) {
        const commentsHTML = comments.map(comment => this.renderComment(comment)).join('');
        
        if (this.currentPage === 1) {
            this.commentsList.innerHTML = commentsHTML;
        } else {
            this.commentsList.insertAdjacentHTML('beforeend', commentsHTML);
        }
    }

    renderComment(comment) {
        return `
            <div class="comment" id="comment-${comment._id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <img src="${comment.author.avatar || 'images/default-avatar.jpg'}" 
                             alt="${comment.author.username}"
                             class="rounded-circle">
                        <div class="author-info">
                            <h5>${comment.author.username}</h5>
                            <small class="text-muted">${formatDate(comment.createdAt)}</small>
                        </div>
                    </div>
                    ${comment.author._id === api.getCurrentUserId() ? `
                        <div class="comment-actions dropdown">
                            <button class="btn btn-link dropdown-toggle" 
                                    data-toggle="dropdown">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <div class="dropdown-menu">
                                <button class="dropdown-item edit-comment" 
                                        data-comment-id="${comment._id}">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="dropdown-item delete-comment" 
                                        data-comment-id="${comment._id}">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="comment-content">
                    <p>${this.formatCommentContent(comment.content)}</p>
                </div>
                <div class="comment-footer">
                    <button class="btn btn-sm btn-link reply-button" 
                            data-comment-id="${comment._id}">
                        <i class="fas fa-reply"></i> Reply
                    </button>
                    <button class="btn btn-sm btn-link like-button ${comment.liked ? 'liked' : ''}" 
                            data-comment-id="${comment._id}">
                        <i class="fas fa-heart"></i> 
                        <span class="likes-count">${comment.likes_count || 0}</span>
                    </button>
                </div>
                ${comment.replies?.length ? this.createRepliesList(comment.replies) : ''}
            </div>
        `;
    }

    createRepliesList(replies) {
        return `
            <div class="replies-list">
                ${replies.map(reply => this.renderComment(reply)).join('')}
            </div>
        `;
    }

    formatCommentContent(content) {
        // Convert URLs to links
        content = content.replace(
            /(https?:\/\/[^\s]+)/g,
            '<a href="$1" target="_blank">$1</a>'
        );

        // Convert @mentions to links
        content = content.replace(
            /@(\w+)/g,
            '<a href="profile.html?username=$1">@$1</a>'
        );

        return content;
    }

    showReplyForm(commentId) {
        const comment = this.commentsList.querySelector(`#comment-${commentId}`);
        if (!comment) return;

        // Remove any existing reply forms
        this.commentsList.querySelectorAll('.reply-form').forEach(form => {
            form.remove();
        });

        const replyForm = `
            <form class="reply-form comment-form" data-parent-id="${commentId}">
                <textarea class="form-control" 
                          rows="2" 
                          placeholder="Write a reply..."></textarea>
                <div class="form-actions">
                    <button type="button" class="btn btn-link cancel-reply">Cancel</button>
                    <button type="submit" class="btn btn-primary">
                        Reply
                        <span class="spinner-border spinner-border-sm" 
                              style="display: none;"></span>
                    </button>
                </div>
            </form>
        `;

        comment.insertAdjacentHTML('beforeend', replyForm);

        const form = comment.querySelector('.reply-form');
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const campaignId = this.commentForm?.dataset.campaignId;
            if (campaignId) {
                await this.handleCommentSubmit(e, campaignId);
            }
        });

        form.querySelector('.cancel-reply').addEventListener('click', () => {
            this.removeReplyForm(commentId);
        });

        // Focus the textarea
        form.querySelector('textarea').focus();
    }

    removeReplyForm(commentId) {
        const comment = this.commentsList.querySelector(`#comment-${commentId}`);
        const replyForm = comment?.querySelector('.reply-form');
        replyForm?.remove();
    }

    updateLoadMoreButton() {
        if (this.loadMoreBtn) {
            this.loadMoreBtn.style.display = this.hasMore ? 'block' : 'none';
        }
    }

    async handleCommentEdit(commentId, newContent) {
        try {
            const updatedComment = await api.updateComment(commentId, { content: newContent });
            const commentElement = this.commentsList.querySelector(`#comment-${commentId}`);
            if (commentElement) {
                const contentElement = commentElement.querySelector('.comment-content p');
                contentElement.innerHTML = this.formatCommentContent(updatedComment.content);
            }
            showSuccess('Comment updated successfully');
        } catch (error) {
            showError('Failed to update comment');
        }
    }

    async handleCommentDelete(commentId) {
        if (!confirm('Are you sure you want to delete this comment?')) {
            return;
        }

        try {
            await api.deleteComment(commentId);
            const commentElement = this.commentsList.querySelector(`#comment-${commentId}`);
            commentElement?.remove();
            showSuccess('Comment deleted successfully');
        } catch (error) {
            showError('Failed to delete comment');
        }
    }

    async handleCommentLike(commentId) {
        try {
            const result = await api.toggleCommentLike(commentId);
            const likeButton = this.commentsList.querySelector(`#comment-${commentId} .like-button`);
            const likesCount = likeButton?.querySelector('.likes-count');
            
            if (likeButton && likesCount) {
                likeButton.classList.toggle('liked', result.liked);
                likesCount.textContent = result.likes_count;
            }
        } catch (error) {
            showError('Failed to update like');
        }
    }
}

export default new CommentsService();
