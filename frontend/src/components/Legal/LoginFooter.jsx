import React, { useState } from 'react';
import LegalModal from './LegalModal';

const disclaimerContent = (
    <div style={{ whiteSpace: 'pre-line' }}>
        <strong>AV Screener is an informational and analytics platform designed to assist users with market research, screening, and data-driven insights.</strong>
        {"\n\n"}
        We are <strong>not a SEBI-registered investment advisor, broker, or financial planner</strong>. Nothing on this platform constitutes financial advice, investment recommendation, solicitation, or guarantee of returns.
        {"\n\n"}
        All stock data, analytics, forecasts, AI-generated insights, signals, scores, screeners, and market commentary are provided for educational and informational purposes only. Market investing and trading involve risk, including possible loss of capital.
        {"\n\n"}
        Users are solely responsible for their own investment decisions. You should conduct your own research and consult a qualified financial advisor before acting on any information.
        {"\n\n"}
        Past performance does not guarantee future results. Data may be delayed, incomplete, or subject to third-party source limitations.
        {"\n\n"}
        By using this platform, you acknowledge and accept these risks.
    </div>
);

const termsContent = (
    <div style={{ whiteSpace: 'pre-line' }}>
        By accessing or using AV Screener, you agree to the following terms:
        {"\n\n"}
        <strong>1. Eligibility</strong>{"\n"}
        You must be legally capable of entering into binding agreements under applicable law.
        {"\n\n"}
        <strong>2. Informational Use Only</strong>{"\n"}
        The platform provides tools, analytics, AI insights, watchlists, alerts, and educational content only.
        {"\n\n"}
        <strong>3. No Guarantees</strong>{"\n"}
        We do not guarantee accuracy, completeness, uptime, profitability, suitability, or future performance of any security or strategy.
        {"\n\n"}
        <strong>4. User Responsibility</strong>{"\n"}
        You are fully responsible for any action taken based on platform content, alerts, rankings, or AI outputs.
        {"\n\n"}
        <strong>5. Account Usage</strong>{"\n"}
        You are responsible for maintaining the confidentiality of your login credentials and activity under your account.
        {"\n\n"}
        <strong>6. Acceptable Use</strong>{"\n"}
        You agree not to misuse the platform, scrape data excessively, reverse engineer services, automate abuse, attempt unauthorized access, or disrupt operations.
        {"\n\n"}
        <strong>7. Subscription & Billing</strong>{"\n"}
        Paid plans, if introduced, may renew automatically unless canceled according to plan terms displayed at purchase.
        {"\n\n"}
        <strong>8. Intellectual Property</strong>{"\n"}
        All branding, design, software, scoring systems, and proprietary content belong to AV Screener unless otherwise stated.
        {"\n\n"}
        <strong>9. Service Changes</strong>{"\n"}
        We may modify, suspend, improve, or discontinue features at any time.
        {"\n\n"}
        <strong>10. Limitation of Liability</strong>{"\n"}
        To the maximum extent permitted by law, AV Screener shall not be liable for losses arising from use of the platform.
        {"\n\n"}
        <strong>11. Governing Law</strong>{"\n"}
        These terms shall be governed by applicable laws of India, subject to jurisdiction determined by law.
        {"\n\n"}
        <strong>12. Acceptance</strong>{"\n"}
        Continued use of the platform constitutes acceptance of these terms.
    </div>
);

const privacyContent = (
    <div style={{ whiteSpace: 'pre-line' }}>
        AV Screener respects your privacy.
        {"\n\n"}
        <strong>Data Collection:</strong> We use Google Login data purely for authentication and session management. We do not profile users for external advertising.
        {"\n\n"}
        <strong>Storage:</strong> Your preferences, watchlists, and alerts are stored securely in our encrypted database.
        {"\n\n"}
        <strong>No Sale of Data:</strong> We never sell your personal data to third parties.
        {"\n\n"}
        <strong>Security:</strong> We implement industry-standard secure handling practices to protect your intelligence data.
        {"\n\n"}
        <strong>Contact:</strong> For privacy-related concerns, please reach out via our feedback widget or official support channels.
    </div>
);

const LoginFooter = () => {
    const [modal, setModal] = useState({ open: false, title: '', content: null });

    const openModal = (title, content) => setModal({ open: true, title, content });
    const closeModal = () => setModal({ ...modal, open: false });

    return (
        <footer style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            background: 'transparent',
            position: 'relative',
            zIndex: 10,
            color: 'var(--text-secondary)'
        }}>
            <div style={{
                fontSize: '0.8rem',
                marginBottom: '1rem',
                opacity: 0.8,
                maxWidth: '600px',
                margin: '0 auto 1.5rem',
                fontWeight: '600',
                lineHeight: '1.5'
            }}>
                ⚠️ Markets involve risk. AV Screener provides analytics only — not investment advice. By continuing, you agree to Terms & Disclaimer.
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '1.5rem',
                fontSize: '0.75rem',
                fontWeight: '800',
                textTransform: 'uppercase',
                letterSpacing: '1px'
            }}>
                <span style={{ color: 'var(--text-muted)' }}>© 2026 AV Screener</span>
                <span className="footer-link" onClick={() => openModal('Disclaimer', disclaimerContent)}>Disclaimer</span>
                <span className="footer-link" onClick={() => openModal('Terms of Use', termsContent)}>Terms</span>
                <span className="footer-link" onClick={() => openModal('Privacy Policy', privacyContent)}>Privacy</span>
            </div>

            <LegalModal 
                isOpen={modal.open} 
                onClose={closeModal} 
                title={modal.title} 
                content={modal.content} 
            />

            <style>{`
                .footer-link {
                    cursor: pointer;
                    transition: color 0.2s;
                }
                .footer-link:hover {
                    color: var(--accent-primary);
                }
            `}</style>
        </footer>
    );
};

export default LoginFooter;
