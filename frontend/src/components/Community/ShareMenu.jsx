import React, { useState } from 'react';
import { trackShare, API_BASE_URL } from '../../services/api';
import { Share2, Copy, Send, MessageCircle, Briefcase, Globe, Image as ImageIcon, Download } from 'lucide-react';
import toast from 'react-hot-toast';

const ShareMenu = ({ symbol, title = "" }) => {
  const [open, setOpen] = useState(false);
  
  // Point to the OG Proxy to enable thumbnails on WhatsApp/Twitter
  const shareUrl = `${API_BASE_URL}/share/v/${symbol}`;
  const shareText = `${symbol} Analysis - AV Screener Terminal.`;

  const handleShare = async (platform) => {
    try {
        await trackShare(symbol, platform);
        
        const urls = {
            whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText + " " + shareUrl)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
        };

        if (urls[platform]) {
            window.open(urls[platform], '_blank');
        }
        setOpen(false);
    } catch (err) {
        console.error(err);
    }
  };

  const downloadSnapshot = () => {
    // We point to our dynamic image-gen API
    const apiUrl = `${API_BASE_URL}/share/thumbnail/${symbol}`;
    const link = document.createElement('a');
    link.href = apiUrl;
    link.download = `${symbol}_analysis.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Generating high-res snapshot...");
    trackShare(symbol, "download_card");
    setOpen(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied to clipboard!");
    trackShare(symbol, "clipboard");
    setOpen(false);
  };

  const Option = ({ icon, label, onClick, color }) => (
      <div 
        onClick={onClick}
        style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '12px', 
            padding: '10px', 
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'background 0.2s'
        }}
        onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)'}
        onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
      >
          <div style={{ color }}>{icon}</div>
          <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-primary)' }}>{label}</span>
      </div>
  );

  return (
    <div style={{ position: 'relative' }}>
      <button 
        onClick={() => setOpen(!open)}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '8px 16px',
            borderRadius: '12px',
            color: 'var(--text-primary)',
            fontSize: '0.8rem',
            fontWeight: '900',
            cursor: 'pointer',
            transition: 'all 0.2s'
        }}
      >
        <Share2 size={16} color="var(--accent-primary)" /> SHARE
      </button>

      {open && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000 }} onClick={() => setOpen(false)} />
            <div className="card" style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '200px',
                padding: '8px',
                zIndex: 1001,
                boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                animation: 'slideInDown 0.2s ease-out'
            }}>
                <Option icon={<Download size={16} />} label="Download Snapshot" onClick={downloadSnapshot} color="var(--accent-primary)" />
                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)', margin: '4px 0' }} />
                <Option icon={<Copy size={16} />} label="Copy Link" onClick={copyToClipboard} color="#94a3b8" />
                <Option icon={<MessageCircle size={16} />} label="WhatsApp" onClick={() => handleShare('whatsapp')} color="#25d366" />
                <Option icon={<Globe size={16} />} label="Twitter (X)" onClick={() => handleShare('twitter')} color="#1da1f2" />
                <Option icon={<Send size={16} />} label="Telegram" onClick={() => handleShare('telegram')} color="#0088cc" />
                <Option icon={<Briefcase size={16} />} label="LinkedIn" onClick={() => handleShare('linkedin')} color="#0077b5" />
            </div>
          </>
      )}

      <style>{`
        @keyframes slideInDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default ShareMenu;
