import React, { useState } from 'react';
import { submitFeedback } from '../../services/api';
import { MessageSquare, X, Send, Star } from 'lucide-react';
import toast from 'react-hot-toast';

const FeedbackWidget = () => {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('Suggestion');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);
    try {
        await submitFeedback({
            category,
            rating,
            message,
            page_context: window.location.pathname
        });
        toast.success("Feedback submitted. Thank you!");
        setMessage('');
        setOpen(false);
    } catch (err) {
        console.error(err);
        toast.error("Failed to submit feedback");
    } finally {
        setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 1000 }}>
      {/* Trigger Button */}
      <button 
        onClick={() => setOpen(!open)}
        style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent-primary)',
            color: '#000',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(99, 102, 241, 0.4)',
            transition: 'transform 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        {open ? <X size={24} /> : <MessageSquare size={24} />}
      </button>

      {/* Modal */}
      {open && (
          <div className="card" style={{
              position: 'absolute',
              bottom: '64px',
              left: 0,
              width: '320px',
              padding: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              animation: 'slideUp 0.3s ease-out',
              boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
              border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                      <h4 style={{ fontSize: '1rem', fontWeight: '950', margin: 0 }}>PRODUCT FEEDBACK</h4>
                      <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: '700' }}>HELP US IMPROVE THE TERMINAL</p>
                  </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)' }}>CATEGORY</label>
                  <select 
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    style={{ backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px', borderRadius: '8px', fontSize: '0.8rem', outline: 'none' }}
                  >
                      {['Bug', 'Suggestion', 'Accuracy', 'UI/UX', 'Mobile', 'Other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)' }}>EXPERIENCE RATING</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                          <Star 
                            key={star}
                            size={20} 
                            onClick={() => setRating(star)}
                            fill={star <= rating ? 'var(--accent-primary)' : 'none'}
                            color={star <= rating ? 'var(--accent-primary)' : 'rgba(255,255,255,0.2)'}
                            style={{ cursor: 'pointer' }}
                          />
                      ))}
                  </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-secondary)' }}>MESSAGE</label>
                  <textarea 
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Tell us what's on your mind..."
                    style={{ width: '100%', minHeight: '80px', padding: '10px', backgroundColor: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', fontSize: '0.8rem', outline: 'none', resize: 'none' }}
                  />
              </div>

              <button 
                onClick={handleSubmit}
                disabled={submitting || !message.trim()}
                style={{
                    backgroundColor: 'var(--accent-primary)',
                    color: '#000',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '12px',
                    fontWeight: '950',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    opacity: (submitting || !message.trim()) ? 0.6 : 1
                }}
              >
                {submitting ? 'SENDING...' : 'SUBMIT FEEDBACK'} <Send size={16} />
              </button>
          </div>
      )}

      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default FeedbackWidget;
