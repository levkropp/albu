// Floating KOSL-style nested geometry animation
// Draws squares-in-circles-in-squares motifs floating across the hero

(function() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, dpr;
  const NAVY = '#434e64';

  function resize() {
    dpr = window.devicePixelRatio || 1;
    const rect = canvas.parentElement.getBoundingClientRect();
    W = rect.width;
    H = rect.height;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // Motif: nested square > circle > square > circle > dot
  function drawMotif(x, y, size, rotation, opacity) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = NAVY;
    ctx.lineWidth = 1.2;

    // Outer square (rotated)
    ctx.save();
    ctx.rotate(rotation);
    ctx.strokeRect(-size/2, -size/2, size, size);
    ctx.restore();

    // Outer circle
    const r1 = size * 0.42;
    ctx.beginPath();
    ctx.arc(0, 0, r1, 0, Math.PI * 2);
    ctx.stroke();

    // Inner square (rotated opposite)
    const s2 = size * 0.56;
    ctx.save();
    ctx.rotate(-rotation + Math.PI/4);
    ctx.strokeRect(-s2/2, -s2/2, s2, s2);
    ctx.restore();

    // Inner circle
    const r2 = size * 0.23;
    ctx.beginPath();
    ctx.arc(0, 0, r2, 0, Math.PI * 2);
    ctx.stroke();

    // Innermost square
    const s3 = size * 0.28;
    ctx.save();
    ctx.rotate(rotation * 1.5);
    ctx.strokeRect(-s3/2, -s3/2, s3, s3);
    ctx.restore();

    // Center dot
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fillStyle = NAVY;
    ctx.fill();

    ctx.restore();
  }

  // Particles
  const COUNT = 14;
  let particles = [];

  function initParticles() {
    particles = [];
    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        size: 20 + Math.random() * 50,
        speed: 0.15 + Math.random() * 0.3,
        rotSpeed: (Math.random() - 0.5) * 0.008,
        rotation: Math.random() * Math.PI * 2,
        opacity: 0.04 + Math.random() * 0.08,
        drift: (Math.random() - 0.5) * 0.3,
      });
    }
  }

  function animate() {
    ctx.clearRect(0, 0, W, H);
    for (const p of particles) {
      drawMotif(p.x, p.y, p.size, p.rotation, p.opacity);
      p.y -= p.speed;
      p.x += p.drift;
      p.rotation += p.rotSpeed;

      // wrap
      if (p.y < -p.size) { p.y = H + p.size; p.x = Math.random() * W; }
      if (p.x < -p.size) p.x = W + p.size;
      if (p.x > W + p.size) p.x = -p.size;
    }
    requestAnimationFrame(animate);
  }

  resize();
  initParticles();
  animate();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { resize(); initParticles(); }, 200);
  });
})();
