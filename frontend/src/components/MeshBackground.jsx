import React, { useEffect, useRef } from 'react';

const MeshBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        // Particle configuration
        let particles = [];
        const particleCount = 12; // Fewer particles for cleaner look

        const initParticles = () => {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            // Vibrant colors for visibility verification
            const blobColor1 = isLight ? 'rgba(79, 70, 229, 0.15)' : 'rgba(99, 102, 241, 0.25)';
            const blobColor2 = isLight ? 'rgba(99, 102, 241, 0.12)' : 'rgba(129, 140, 248, 0.2)';
            
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    radius: Math.random() * 800 + 400,
                    color: i % 2 === 0 ? blobColor1 : blobColor2,
                    vx: Math.random() * 1.2 - 0.6,
                    vy: Math.random() * 1.2 - 0.6
                });
            }
        };

        initParticles();

        const animate = () => {
            const isLight = document.documentElement.getAttribute('data-theme') === 'light';
            // Use a slightly different color than the CSS fallback to verify canvas is rendering
            const bgColor = isLight ? '#f1f5f9' : '#0a0d14'; 
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                if (p.x < -p.radius) p.x = canvas.width + p.radius;
                if (p.x > canvas.width + p.radius) p.x = -p.radius;
                if (p.y < -p.radius) p.y = canvas.height + p.radius;
                if (p.y > canvas.height + p.radius) p.y = -p.radius;

                const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
                gradient.addColorStop(0, p.color);
                gradient.addColorStop(1, 'transparent');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        const observer = new MutationObserver(() => initParticles());
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationFrameId);
            observer.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 1,
                pointerEvents: 'none'
            }}
        />
    );
};

export default MeshBackground;
