// CURSOR
const cursor = document.getElementById('cursor');
const trail = document.getElementById('cursor-trail');
let mx = 0, my = 0, tx = 0, ty = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top = my + 'px';
});

setInterval(() => {
  tx += (mx - tx) * 0.15;
  ty += (my - ty) * 0.15;
  trail.style.left = tx + 'px';
  trail.style.top = ty + 'px';
}, 16);

document.querySelectorAll('a, button, .store-card, .team-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.transform = 'translate(-50%,-50%) scale(2.5)';
    cursor.style.background = 'transparent';
    cursor.style.border = '1px solid var(--sky)';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.transform = 'translate(-50%,-50%) scale(1)';
    cursor.style.background = 'var(--sky)';
    cursor.style.border = 'none';
  });
});

// STARS
const canvas = document.getElementById('stars-canvas');
const ctx = canvas.getContext('2d');
let stars = [];

function initStars() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  stars = [];
  for (let i = 0; i < 200; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.5 + 0.2,
      a: Math.random(),
      speed: Math.random() * 0.005 + 0.002,
      drift: (Math.random() - 0.5) * 0.1
    });
  }
}

function drawStars() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  stars.forEach(s => {
    s.a += s.speed;
    s.x += s.drift;
    if (s.x > canvas.width) s.x = 0;
    if (s.x < 0) s.x = canvas.width;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(91,200,245,${0.3 + 0.7 * Math.abs(Math.sin(s.a))})`;
    ctx.fill();
  });
  requestAnimationFrame(drawStars);
}

initStars();
drawStars();
window.addEventListener('resize', initStars);

// GAME PARTICLES
const gCanvas = document.getElementById('game-particles');
if (gCanvas) {
  const gCtx = gCanvas.getContext('2d');
  let gParticles = [];

  function initGameParticles() {
    const rect = gCanvas.parentElement.getBoundingClientRect();
    gCanvas.width = rect.width;
    gCanvas.height = rect.height;
    gParticles = [];
    for (let i = 0; i < 50; i++) {
      gParticles.push({
        x: Math.random() * gCanvas.width,
        y: Math.random() * gCanvas.height,
        r: Math.random() * 2 + 0.5,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        a: Math.random()
      });
    }
  }

  function drawGameParticles() {
    gCtx.clearRect(0, 0, gCanvas.width, gCanvas.height);
    gParticles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.a += 0.02;
      if (p.x < 0 || p.x > gCanvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > gCanvas.height) p.vy *= -1;
      gCtx.beginPath();
      gCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      gCtx.fillStyle = `rgba(91,200,245,${0.2 + 0.4 * Math.abs(Math.sin(p.a))})`;
      gCtx.fill();
    });
    requestAnimationFrame(drawGameParticles);
  }

  setTimeout(() => { initGameParticles(); drawGameParticles(); }, 500);
}

// REVEAL ON SCROLL
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 80);
    }
  });
}, { threshold: 0.1 });
reveals.forEach(r => observer.observe(r));

// TABS (formulario)
function switchTab(name, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  btn.classList.add('active');
}

// FORM SUBMIT
function showSubmitToast(message = 'Postulación enviada') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

function submitForm(e) {
  e.preventDefault();
  showSubmitToast();
  e.target.reset();
}

async function submitApplication(e) {
  e.preventDefault();

  const form = e.target;
  const submitButton = form.querySelector('button[type="submit"]');
  const data = new FormData(form);
  const payload = Object.fromEntries(data.entries());

  if (submitButton) submitButton.disabled = true;
  showSubmitToast('Enviando postulación');

  try {
    const response = await fetch('/.netlify/functions/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok || !result.ok) {
      throw new Error(result.message || 'No se pudo enviar la postulación.');
    }

    form.reset();
    showSubmitToast('Postulación recibida');
  } catch (error) {
    showSubmitToast(error.message || 'Error al enviar');
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

// CARRITO
let cart = [];

function addToCart(name, price, icon) {
  const existing = cart.find(i => i.name === name);
  if (existing) { existing.qty++; }
  else { cart.push({ name, price, icon, qty: 1 }); }
  renderCart();
  openCart();
}

function removeFromCart(name) {
  cart = cart.filter(i => i.name !== name);
  renderCart();
}

function renderCart() {
  const container = document.getElementById('cart-items');
  const totals = document.getElementById('cart-totals');
  const count = document.getElementById('cart-count');

  if (cart.length === 0) {
    container.innerHTML = '<div class="cart-empty">Tu carrito está vacío</div>';
    totals.style.display = 'none';
    count.style.display = 'none';
    return;
  }

  let total = 0;
  container.innerHTML = cart.map(item => {
    total += item.price * item.qty;
    return `
      <div class="cart-item">
        <div class="cart-item-icon">${item.icon}</div>
        <div class="cart-item-info">
          <div class="cart-item-name">${item.name}</div>
          <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)} ${item.qty > 1 ? `(x${item.qty})` : ''}</div>
        </div>
        <button class="cart-item-remove" onclick="removeFromCart('${item.name}')">×</button>
      </div>
    `;
  }).join('');

  document.getElementById('cart-subtotal').textContent = '$' + total.toFixed(2);
  document.getElementById('cart-total-display').textContent = '$' + total.toFixed(2);
  totals.style.display = 'block';

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  count.textContent = totalItems;
  count.style.display = 'flex';
}

function openCart() {
  document.getElementById('cart-sidebar').classList.add('open');
  document.getElementById('cart-overlay').classList.add('show');
}

function closeCart() {
  document.getElementById('cart-sidebar').classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('show');
}

document.getElementById('cart-btn').addEventListener('click', openCart);
document.getElementById('cart-close').addEventListener('click', closeCart);
document.getElementById('cart-overlay').addEventListener('click', closeCart);

function checkout() {
  alert('Integración con Stripe próximamente.\nTotal: $' + cart.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2));
}

// NAV SCROLL
window.addEventListener('scroll', () => {
  const nav = document.querySelector('nav');
  if (window.scrollY > 60) {
    nav.style.background = 'rgba(11,13,20,0.95)';
  } else {
    nav.style.background = 'rgba(11,13,20,0.75)';
  }
});

