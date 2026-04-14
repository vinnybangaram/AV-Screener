import React from 'react';
import { ThumbsUp, MessageSquare, AlertCircle } from 'lucide-react';

const CommentCard = ({ comment, onLike }) => {
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const mins = Math.floor(seconds / 60);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div style={{
      padding: '1.25rem',
      backgroundColor: 'rgba(255,255,255,0.02)',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.04)',
      display: 'flex',
      gap: '1rem',
      marginBottom: '1rem'
    }}>
      {/* Avatar */}
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        background: 'rgba(99, 102, 241, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(99, 102, 241, 0.2)',
        flexShrink: 0,
        overflow: 'hidden'
      }}>
        {comment.user.picture ? (
            <img src={comment.user.picture} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
            <span style={{ fontSize: '0.9rem', fontWeight: '900', color: 'var(--accent-primary)' }}>
                {comment.user.name.charAt(0)}
            </span>
        )}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-primary)' }}>{comment.user.name}</span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '600' }}>{timeAgo(comment.createdAt)}</span>
        </div>
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {comment.message}
        </p>

        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.75rem' }}>
          <button 
            onClick={() => onLike(comment.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}
          >
            <ThumbsUp size={14} />
            <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>{comment.likes}</span>
          </button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
            <MessageSquare size={14} />
            <span style={{ fontSize: '0.75rem', fontWeight: '800' }}>Reply</span>
          </button>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            <AlertCircle size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentCard;
