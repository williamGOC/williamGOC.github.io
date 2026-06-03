/* ── particle canvas ── */
const canvas = document.getElementById('canvas-bg');
const ctx = canvas.getContext('2d');
let W, H, pts;
let mouse = { x: -9999, y: -9999 };

window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
function init() {
  resize();
  pts = Array.from({length: 120}, () => ({
    x: Math.random() * W, y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.9,
    vy: (Math.random() - 0.5) * 0.9,
    r: Math.random() * 2.2 + 0.8,
    pulse: Math.random() * Math.PI * 2
  }));
}
function draw() {
  ctx.clearRect(0, 0, W, H);
  const D = 200;
  const MOUSE_R = 160;

  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];

    const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
    const mdist = Math.sqrt(mdx*mdx + mdy*mdy);
    if (mdist < MOUSE_R && mdist > 0) {
      const force = (1 - mdist / MOUSE_R) * 0.8;
      p.vx += (mdx / mdist) * force;
      p.vy += (mdy / mdist) * force;
    }

    const speed = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
    if (speed > 2.5) { p.vx *= 2.5 / speed; p.vy *= 2.5 / speed; }

    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
    if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

    p.pulse += 0.025;
    const glowR = Math.max(0.5, p.r + Math.sin(p.pulse) * 1.2);
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR * 3.5);
    grad.addColorStop(0, 'rgba(91,138,240,0.9)');
    grad.addColorStop(0.5, 'rgba(91,138,240,0.25)');
    grad.addColorStop(1, 'rgba(91,138,240,0)');
    ctx.beginPath();
    ctx.arc(p.x, p.y, glowR * 3.5, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
    ctx.fillStyle = '#a8c4ff';
    ctx.fill();

    for (let j = i + 1; j < pts.length; j++) {
      const q = pts[j];
      const dx = p.x - q.x, dy = p.y - q.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < D) {
        const alpha = (1 - dist/D);
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = `rgba(91,138,240,${alpha * 0.75})`;
        ctx.lineWidth = alpha * 1.2;
        ctx.stroke();
      }
    }
  }
  requestAnimationFrame(draw);
}
window.addEventListener('resize', resize);
init(); draw();

/* ── accordion ── */
document.querySelectorAll('.acc-header').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.acc-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.acc-item.open').forEach(i => {
      i.classList.remove('open');
      i.querySelector('.acc-header').setAttribute('aria-expanded', 'false');
    });
    if (!isOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});

/* ── scroll reveal ── */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
  });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* ── scroll progress bar ── */
const progressBar = document.getElementById('progress-bar');
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';
}, { passive: true });

/* ── news carousel ── */
(async function() {
  const track   = document.getElementById('newsTrack');
  const dotsWrap = document.getElementById('newsDots');
  const prevBtn  = document.getElementById('newsPrev');
  const nextBtn  = document.getElementById('newsNext');
  let current = 0;
  let slides  = [];
  let autoTimer;

  const FEEDS = [
    'https://www.newscientist.com/feed/home/',
    'https://phys.org/rss-feed/physics-news/',
    'https://www.sciencedaily.com/rss/matter_energy/physics.xml'
  ];

  const PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';

  const ICONS = ['⚛','∿','◎','∞','⊛','≋','⊕'];

  function fmtDate(str) {
    try {
      return new Date(str).toLocaleDateString('en-GB', {day:'numeric',month:'short',year:'numeric'});
    } catch { return ''; }
  }

  function buildSlide(item, source) {
    const div = document.createElement('div');
    div.className = 'news-slide';

    const imgWrap = document.createElement('div');
    imgWrap.className = 'news-img-wrap';

    if (item.thumbnail && item.thumbnail.startsWith('http')) {
      const img = document.createElement('img');
      img.src = item.thumbnail;
      img.alt = '';
      img.loading = 'lazy';
      img.onerror = () => {
        imgWrap.innerHTML = '<div class="news-img-placeholder">' + ICONS[Math.floor(Math.random()*ICONS.length)] + '</div>';
      };
      imgWrap.appendChild(img);
    } else {
      imgWrap.innerHTML = '<div class="news-img-placeholder">' + ICONS[Math.floor(Math.random()*ICONS.length)] + '</div>';
    }

    const src  = document.createElement('div');
    src.className = 'news-source';
    src.textContent = source;

    const title = document.createElement('div');
    title.className = 'news-title';
    const a = document.createElement('a');
    a.href = item.link || '#';
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = item.title || 'Untitled';
    title.appendChild(a);

    const date = document.createElement('div');
    date.className = 'news-date';
    date.textContent = fmtDate(item.pubDate);

    div.appendChild(imgWrap);
    div.appendChild(src);
    div.appendChild(title);
    div.appendChild(date);
    return div;
  }

  function render() {
    track.innerHTML = '';
    dotsWrap.innerHTML = '';
    slides.forEach((s, i) => {
      track.appendChild(s);
      const dot = document.createElement('div');
      dot.className = 'news-dot' + (i === 0 ? ' active' : '');
      dot.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(dot);
    });
    goTo(0, false);
  }

  function goTo(idx, animate = true) {
    current = ((idx % slides.length) + slides.length) % slides.length;
    if (!animate) track.style.transition = 'none';
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    if (!animate) requestAnimationFrame(() => { track.style.transition = ''; });
    dotsWrap.querySelectorAll('.news-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
    resetAuto();
  }

  function resetAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 5000);
  }

  prevBtn.addEventListener('click', () => goTo(current - 1));
  nextBtn.addEventListener('click', () => goTo(current + 1));
  // pause auto on hover
  document.getElementById('newsCarousel').addEventListener('mouseenter', () => clearInterval(autoTimer));
  document.getElementById('newsCarousel').addEventListener('mouseleave', resetAuto);

  // fetch all feeds concurrently
  const results = await Promise.allSettled(
    FEEDS.map(url =>
      fetch(PROXY + encodeURIComponent(url))
        .then(r => r.json())
        .catch(() => null)
    )
  );

  const allItems = [];
  const sourceNames = ['New Scientist', 'Phys.org', 'Science Daily'];
  results.forEach((res, fi) => {
    if (res.status === 'fulfilled' && res.value && res.value.items) {
      res.value.items.slice(0, 3).forEach(item => {
        allItems.push({ item, source: sourceNames[fi] });
      });
    }
  });

  if (allItems.length === 0) {
    // fallback static items
    const fallback = [
      { title: 'Physicists detect quantum interference in room-temperature molecules', link: 'https://phys.org', pubDate: new Date().toISOString(), thumbnail: '' },
      { title: 'New gravitational wave event hints at neutron star–black hole merger', link: 'https://phys.org', pubDate: new Date().toISOString(), thumbnail: '' },
      { title: 'Entanglement entropy probed in novel 2D material at low temperature', link: 'https://phys.org', pubDate: new Date().toISOString(), thumbnail: '' },
      { title: 'Quantum computing milestone: logical qubit holds coherence for 1 second', link: 'https://phys.org', pubDate: new Date().toISOString(), thumbnail: '' },
      { title: 'Dark energy constraints tightened by new galaxy survey data', link: 'https://phys.org', pubDate: new Date().toISOString(), thumbnail: '' },
      { title: 'First direct image of an electron orbital captured in lab', link: 'https://phys.org', pubDate: new Date().toISOString(), thumbnail: '' },
    ];
    fallback.forEach(item => allItems.push({ item, source: 'Physics News' }));
  }

  slides = allItems.map(({ item, source }) => buildSlide(item, source));
  render();
  resetAuto();
})();


/* ── second background: trailing particles ── */
const canvas2 = document.getElementById('canvas-bg2');
const ctx2 = canvas2.getContext('2d');
let W2, H2, particles;

function resizeCanvas2() {
  W2 = canvas2.width = window.innerWidth;
  H2 = canvas2.height = window.innerHeight;
}

function initParticles() {
  resizeCanvas2();
  particles = Array.from({ length: 60 }, () => ({
    x: Math.random() * W2,
    y: Math.random() * H2,
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 1.5,
    age: 0,
    life: 180 + Math.random() * 120,
    hue: 210 + Math.random() * 40
  }));
}

function drawParticles() {
  ctx2.fillStyle = 'rgba(8,10,14,0.18)';
  ctx2.fillRect(0, 0, W2, H2);

  particles.forEach((p, i) => {
    p.angle = (p.angle || Math.atan2(p.vy, p.vx)) + (Math.random() - 0.5) * 0.15;
    p.vx = Math.cos(p.angle) * 1.8;
    p.vy = Math.sin(p.angle) * 1.8;
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > 2) { p.vx *= 2 / speed; p.vy *= 2 / speed; }

    p.x += p.vx; p.y += p.vy;
    if (p.x < 0) p.x = W2; if (p.x > W2) p.x = 0;
    if (p.y < 0) p.y = H2; if (p.y > H2) p.y = 0;

    p.age++;
    if (p.age > p.life) {
      particles[i] = {
        x: Math.random() * W2, y: Math.random() * H2,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        age: 0, life: 180 + Math.random() * 120,
        hue: 210 + Math.random() * 40
      };
    }

    const alpha = Math.sin((p.age / p.life) * Math.PI) * 0.8;
    ctx2.beginPath();
    ctx2.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
    ctx2.fillStyle = `hsla(${p.hue}, 80%, 70%, ${alpha})`;
    ctx2.fill();
  });

  requestAnimationFrame(drawParticles);
}

window.addEventListener('resize', resizeCanvas2);
initParticles();
drawParticles();

window.bgState = 0;
document.getElementById('bg-toggle').addEventListener('click', () => {
  window.bgState = (window.bgState + 1) % 3;
  document.getElementById('canvas-bg').style.opacity  = window.bgState === 0 ? '0.32' : '0';
  document.getElementById('canvas-bg2').style.opacity = window.bgState === 1 ? '0.6'  : '0';
  document.getElementById('canvas-bg3').style.opacity = window.bgState === 2 ? '0.5'  : '0';
});


/* ── third background: soft matter droplets ── */
const canvas3 = document.getElementById('canvas-bg3');
const ctx3 = canvas3.getContext('2d');
let W3, H3, drops;

function resizeCanvas3() {
  W3 = canvas3.width = window.innerWidth;
  H3 = canvas3.height = window.innerHeight;
}

function initDrops() {
  resizeCanvas3();
  drops = Array.from({ length: 18 }, () => ({
    x: Math.random() * W3,
    y: Math.random() * H3,
    r: 20 + Math.random() * 40,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
  }));
}

function drawDrops() {
  ctx3.clearRect(0, 0, W3, H3);

  for (let i = 0; i < drops.length; i++) {
    for (let j = i + 1; j < drops.length; j++) {
      const a = drops[i], b = drops[j];
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const minDist = a.r + b.r;

      if (dist < minDist * 1.5 && dist > 0) {
        const force = 0.002 * (minDist - dist);
        a.vx += (dx / dist) * force;
        a.vy += (dy / dist) * force;
        b.vx -= (dx / dist) * force;
        b.vy -= (dy / dist) * force;
      }

      if (dist < minDist * 0.6) {
        const totalArea = Math.PI * a.r * a.r + Math.PI * b.r * b.r;
        a.r = Math.sqrt(totalArea / Math.PI);
        a.vx = (a.vx + b.vx) * 0.5;
        a.vy = (a.vy + b.vy) * 0.5;
        drops.splice(j, 1);
        j--;
      }
    }

    if (drops[i] && drops[i].r > 90) {
      const p = drops[i];
      const newR = p.r / Math.sqrt(2);
      drops.push({
        x: p.x + newR * 0.5, y: p.y,
        r: newR, vx: p.vx + 0.3, vy: p.vy,
        phase: Math.random() * Math.PI * 2
      });
      p.x -= newR * 0.5;
      p.r = newR;
      p.vx -= 0.3;
    }

    if (drops.length < 10) {
      drops.push({
        x: Math.random() * W3, y: Math.random() * H3,
        r: 15 + Math.random() * 25,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  drops.forEach(p => {
    p.x += p.vx; p.y += p.vy;
    if (p.x - p.r < 0) { p.x = p.r; p.vx *= -1; }
    if (p.x + p.r > W3) { p.x = W3 - p.r; p.vx *= -1; }
    if (p.y - p.r < 0) { p.y = p.r; p.vy *= -1; }
    if (p.y + p.r > H3) { p.y = H3 - p.r; p.vy *= -1; }

    p.phase = (p.phase || 0) + 0.08;

    const points = 16;
    ctx3.beginPath();
    for (let k = 0; k <= points; k++) {
      const angle = (k / points) * Math.PI * 2;
      const wobble = 1 + 0.45 * Math.sin(3 * angle + p.phase)
                       + 0.25 * Math.sin(5 * angle - p.phase * 1.7)
                       + 0.15 * Math.sin(7 * angle + p.phase * 0.9);
      const rx = p.x + Math.cos(angle) * p.r * wobble;
      const ry = p.y + Math.sin(angle) * p.r * wobble;
      k === 0 ? ctx3.moveTo(rx, ry) : ctx3.lineTo(rx, ry);
    }
    ctx3.closePath();

    const grad = ctx3.createRadialGradient(
      p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.1,
      p.x, p.y, p.r * 1.2
    );
    grad.addColorStop(0, 'rgba(139, 180, 255, 0.22)');
    grad.addColorStop(0.6, 'rgba(91, 138, 240, 0.12)');
    grad.addColorStop(1, 'rgba(91, 138, 240, 0.02)');

    ctx3.fillStyle = grad;
    ctx3.fill();
    ctx3.strokeStyle = 'rgba(139, 180, 255, 0.3)';
    ctx3.lineWidth = 1;
    ctx3.stroke();
  });

  requestAnimationFrame(drawDrops);
}

window.addEventListener('resize', resizeCanvas3);
initDrops();
drawDrops();