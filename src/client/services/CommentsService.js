// Comments Service - Rich text journal functionality with monthly filtering
class CommentsService {
  constructor() {
    this.storageKey = 'release_management_comments';
    this.comments = this.loadComments();
  }

  // Load comments from localStorage
  loadComments() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading comments:', error);
      return [];
    }
  }

  // Save comments to localStorage
  saveComments() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.comments));
    } catch (error) {
      console.error('Error saving comments:', error);
    }
  }

  // Add new comment
  addComment(commentText, userDisplayName = 'Anonymous User') {
    if (!commentText || !commentText.trim()) {
      return null;
    }

    const newComment = {
      id: Date.now() + Math.random(),
      text: commentText.trim(),
      user: userDisplayName,
      timestamp: new Date().toISOString(),
      createdAt: new Date(),
      month: new Date().getMonth(),
      year: new Date().getFullYear()
    };

    this.comments.unshift(newComment); // Add to beginning for chronological order
    this.saveComments();
    return newComment;
  }

  // Get comments for specific month/year
  getCommentsForMonth(year, month) {
    return this.comments.filter(comment => {
      const commentDate = new Date(comment.timestamp);
      return commentDate.getFullYear() === year && commentDate.getMonth() === month;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Most recent first
  }

  // Get all comments
  getAllComments() {
    return this.comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // Update comment
  updateComment(commentId, newText) {
    const commentIndex = this.comments.findIndex(comment => comment.id === commentId);
    if (commentIndex !== -1) {
      this.comments[commentIndex].text = newText;
      this.comments[commentIndex].updatedAt = new Date().toISOString();
      this.saveComments();
      return this.comments[commentIndex];
    }
    return null;
  }

  // Delete comment
  deleteComment(commentId) {
    const commentIndex = this.comments.findIndex(comment => comment.id === commentId);
    if (commentIndex !== -1) {
      const deletedComment = this.comments.splice(commentIndex, 1)[0];
      this.saveComments();
      return deletedComment;
    }
    return null;
  }

  // Format timestamp for display
  formatTimestamp(timestamp) {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffTime = now - date;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffTime / (1000 * 60));

      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Unknown time';
    }
  }

  // Get current user (mock implementation)
  getCurrentUser() {
    // In real implementation, this would get from ServiceNow user context
    return {
      name: window.g_user?.displayName || window.g_user?.name || 'Current User',
      userId: window.g_user?.userId || 'current_user'
    };
  }

  // Clear all comments (for testing)
  clearAllComments() {
    this.comments = [];
    this.saveComments();
  }

  // Export comments
  exportComments() {
    return JSON.stringify(this.comments, null, 2);
  }

  // Import comments
  importComments(jsonData) {
    try {
      const imported = JSON.parse(jsonData);
      if (Array.isArray(imported)) {
        this.comments = [...this.comments, ...imported];
        this.saveComments();
        return true;
      }
    } catch (error) {
      console.error('Error importing comments:', error);
    }
    return false;
  }

  // Get comment statistics
  getCommentStats() {
    const totalComments = this.comments.length;
    const thisMonth = this.getCommentsForMonth(new Date().getFullYear(), new Date().getMonth()).length;
    const users = [...new Set(this.comments.map(comment => comment.user))];
    
    return {
      total: totalComments,
      thisMonth: thisMonth,
      users: users.length,
      userList: users
    };
  }
}

export default new CommentsService();