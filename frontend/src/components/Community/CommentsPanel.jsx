import React, { useState, useEffect } from 'react';
import { fetchComments, postComment, likeComment } from '../../services/api';
import CommentCard from './CommentCard';
import { Send, MessageSquare } from 'lucide-react';

const CommentsPanel = ({ symbol }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (symbol) loadComments();
  }, [symbol]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await fetchComments(symbol);
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await postComment(symbol, newComment);
      setNewComment('');
      loadComments();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (id) => {
    try {
      await likeComment(id);
      setComments(comments.map(c => c.id === id ? { ...c, likes: c.likes + 1 } : c));
    } catch (err) {
        console.error(err);
    }
  };

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <MessageSquare size={20} color="var(--accent-primary)" />
        <h3 style={{ fontSize: '1rem', fontWeight: '950', margin: 0 }}>DISCUSSION FEED</h3>
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} style={{ position: 'relative' }}>
          <textarea 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your technical insight..."
            style={{
                width: '100%',
                minHeight: '80px',
                padding: '1rem',
                backgroundColor: 'rgba(0,0,0,0.2)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none',
                resize: 'none'
            }}
          />
          <button 
            type="submit"
            disabled={submitting || !newComment.trim()}
            style={{
                position: 'absolute',
                bottom: '12px',
                right: '12px',
                backgroundColor: 'var(--accent-primary)',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontWeight: '900',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                opacity: (submitting || !newComment.trim()) ? 0.5 : 1
            }}
          >
            {submitting ? 'Posting...' : 'Post Insight'} <Send size={14} />
          </button>
      </form>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.5rem' }}>
          {loading ? (
              <div className="shimmer-loader" style={{ height: '200px', width: '100%' }} />
          ) : comments.length > 0 ? (
              comments.map(c => <CommentCard key={c.id} comment={c} onLike={handleLike} />)
          ) : (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', opacity: 0.5 }}>
                  <p style={{ fontSize: '0.85rem', fontWeight: '700' }}>No discussions yet. Be the first to share your view!</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default CommentsPanel;
