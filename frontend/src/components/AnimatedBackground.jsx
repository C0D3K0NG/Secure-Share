import React, { useEffect, useRef } from 'react';

const AnimatedBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width, height;

    // Configuration
    const blobs = [
      { id: 1, baseX: 0.3, baseY: 0.3, radius: 200, color: 'rgba(0, 255, 157, 0.6)', speed: 0.001, offset: 0 },
      { id: 2, baseX: 0.7, baseY: 0.7, radius: 250, color: 'rgba(0, 180, 255, 0.4)', speed: 0.0015, offset: 100 },
      { id: 3, baseX: 0.2, baseY: 0.8, radius: 180, color: 'rgba(120, 50, 255, 0.3)', speed: 0.0012, offset: 200 },
    ];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const mouse = { x: -1000, y: -1000 };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const drawBlob = (blob, time) => {
      const cx = width * blob.baseX + Math.sin(time * blob.speed + blob.offset) * 100;
      const cy = height * blob.baseY + Math.cos(time * blob.speed + blob.offset) * 100;

      // Mouse interaction
      const dx = mouse.x - cx;
      const dy = mouse.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const pull = Math.max(0, (500 - dist) / 500);

      const finalX = cx + (dx * pull * 0.3);
      const finalY = cy + (dy * pull * 0.3);

      const gradient = ctx.createRadialGradient(finalX, finalY, 0, finalX, finalY, blob.radius * 2);
      // Ferrofluid look: Solid core, faded edge
      gradient.addColorStop(0, blob.color);
      gradient.addColorStop(0.5, 'rgba(0,0,0,0.8)'); // Dark core
      gradient.addColorStop(1, 'rgba(0,0,0,0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(finalX, finalY, blob.radius * (1 + pull * 0.5), 0, Math.PI * 2);
      ctx.fill();
    };

    const draw = (time) => {
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      // Composite mode for "Liquid" mixing
      ctx.globalCompositeOperation = 'screen';

      blobs.forEach(blob => drawBlob(blob, time));

      // Reset
      ctx.globalCompositeOperation = 'source-over';

      animationFrameId = requestAnimationFrame(draw);
    };

    resize();
    requestAnimationFrame(draw);

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-0"
    />
  );
};

export default AnimatedBackground;
