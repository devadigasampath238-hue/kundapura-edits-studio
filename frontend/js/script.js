// frontend/js/script.js
// ── Kundapura Edits Studio — Main Frontend JS ─

const API = '/api';

// ══════════════════════════════════════════════
//  NAVBAR
// ══════════════════════════════════════════════
(function initNavbar() {
  const navbar    = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  // Sticky
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    const btn = document.getElementById('backToTop');
    if (btn) btn.classList.toggle('visible', window.scrollY > 400);
  });

  // Hamburger
  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  navLinks?.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      hamburger?.classList.remove('open');
      navLinks.classList.remove('open');
    })
  );

  // Active link
  const sections = document.querySelectorAll('section[id]');
  window.addEventListener('scroll', () => {
    const pos = window.scrollY + 100;
    sections.forEach(s => {
      const link = document.querySelector(`.nav-link[href="#${s.id}"]`);
      if (link) link.classList.toggle('active', pos >= s.offsetTop && pos < s.offsetTop + s.offsetHeight);
    });
  });
})();

// ══════════════════════════════════════════════
//  SCROLL REVEAL
// ══════════════════════════════════════════════
const revealObs = new IntersectionObserver(
  entries => entries.forEach(e => e.isIntersecting && e.target.classList.add('in-view')),
  { threshold: 0.1 }
);

function observeReveal(el) {
  el.classList.add('reveal');
  revealObs.observe(el);
}

document.querySelectorAll('.service-card, .why-card, .testi-card, .contact-card')
  .forEach(observeReveal);

// ══════════════════════════════════════════════
//  PORTFOLIO — Dynamic from API
// ══════════════════════════════════════════════
let allVideos = [];
let activeFilter = 'all';

async function loadPortfolio() {
  const grid = document.getElementById('portfolioGrid');
  if (!grid) return;

  grid.innerHTML = `<div class="portfolio-loading"><div class="loader-ring"></div><span>Loading videos...</span></div>`;

  try {
    const res  = await fetch(`${API}/videos`);
    const data = await res.json();

    allVideos = data.videos || [];

    if (allVideos.length === 0) {
      grid.innerHTML = `<div class="portfolio-empty"><span>🎬</span><p>No videos yet. Check back soon!</p></div>`;
      return;
    }

    renderPortfolio(allVideos);
  } catch (err) {
    grid.innerHTML = `<div class="portfolio-empty"><span>⚠️</span><p>Could not load videos. Please refresh.</p></div>`;
  }
}

function renderPortfolio(videos) {
  const grid = document.getElementById('portfolioGrid');
  if (!grid) return;

  grid.innerHTML = '';

  videos.forEach((video, i) => {
    const item = document.createElement('div');
    item.className = 'portfolio-item';
    item.dataset.category = video.category;
    item.style.animationDelay = `${i * 0.07}s`;

    const catLabel = { wedding: 'Wedding', reels: 'Reels', youtube: 'YouTube', ads: 'Business Ads' };
    const date = new Date(video.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    item.innerHTML = `
      <div class="portfolio-thumb" onclick="openVideoModal('${video._id}', '${escHtml(video.title)}', '${escHtml(video.videoUrl)}', '${video.category}')">
        <video class="thumb-video" src="${video.videoUrl}" muted preload="metadata" loading="lazy">
          <source src="${video.videoUrl}" type="video/mp4">
        </video>
        <div class="thumb-overlay">
          <span class="play-btn">▶</span>
        </div>
        <div class="thumb-label">${catLabel[video.category] || video.category}</div>
        <div class="thumb-gradient"></div>
      </div>
      <div class="portfolio-info">
        <h4>${escHtml(video.title)}</h4>
        <div class="portfolio-meta">
          <span class="portfolio-tag">${catLabel[video.category] || video.category}</span>
          <span class="portfolio-date">${date}</span>
        </div>
      </div>
      <div class="portfolio-reviews-preview" id="preview-${video._id}">
        <div class="reviews-loading-sm">Loading reviews…</div>
      </div>
      <div class="review-form-wrap" id="review-form-${video._id}">
        ${buildReviewForm(video._id)}
      </div>
    `;

    grid.appendChild(item);
    observeReveal(item);

    // Load reviews for this video
    loadVideoReviews(video._id);
  });
}

// ── Portfolio Filter ───────────────────────────
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;

    const filtered = activeFilter === 'all'
      ? allVideos
      : allVideos.filter(v => v.category === activeFilter);

    renderPortfolio(filtered);
  });
});

// ══════════════════════════════════════════════
//  VIDEO MODAL
// ══════════════════════════════════════════════
function openVideoModal(id, title, url, category) {
  const modal = document.getElementById('videoModal');
  const player = document.getElementById('modalVideoPlayer');
  const titleEl = document.getElementById('modalVideoTitle');
  const catEl  = document.getElementById('modalVideoCategory');

  if (!modal || !player) return;

  titleEl.textContent = title;
  catEl.textContent   = { wedding: 'Wedding', reels: 'Instagram Reels', youtube: 'YouTube', ads: 'Business Ads' }[category] || category;
  player.src = url;
  player.load();

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
  const modal  = document.getElementById('videoModal');
  const player = document.getElementById('modalVideoPlayer');
  if (!modal) return;

  player.pause();
  player.src = '';
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

// Close modal on backdrop click
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('videoModal')?.addEventListener('click', function (e) {
    if (e.target === this) closeVideoModal();
  });
  document.addEventListener('keydown', e => e.key === 'Escape' && closeVideoModal());
});

window.openVideoModal  = openVideoModal;
window.closeVideoModal = closeVideoModal;

// ══════════════════════════════════════════════
//  REVIEWS
// ══════════════════════════════════════════════
async function loadVideoReviews(videoId) {
  const container = document.getElementById(`preview-${videoId}`);
  if (!container) return;

  try {
    const res  = await fetch(`${API}/reviews/${videoId}`);
    const data = await res.json();

    if (!data.success || data.reviews.length === 0) {
      container.innerHTML = `<p class="no-reviews">No reviews yet. Be the first! 👇</p>`;
      return;
    }

    const starsHtml = r => '★'.repeat(r) + '☆'.repeat(5 - r);

    container.innerHTML = `
      <div class="reviews-summary">
        <span class="avg-rating">${data.avgRating} <span class="stars-orange">${starsHtml(Math.round(data.avgRating))}</span></span>
        <span class="review-count">${data.count} review${data.count !== 1 ? 's' : ''}</span>
      </div>
      <div class="reviews-list">
        ${data.reviews.slice(0, 3).map(r => `
          <div class="review-item">
            <div class="review-header">
              <div class="reviewer-avatar">${r.name[0].toUpperCase()}</div>
              <div>
                <strong>${escHtml(r.name)}</strong>
                <span class="stars-sm">${starsHtml(r.rating)}</span>
              </div>
            </div>
            <p>${escHtml(r.comment)}</p>
          </div>
        `).join('')}
        ${data.reviews.length > 3 ? `<p class="more-reviews">+${data.reviews.length - 3} more reviews</p>` : ''}
      </div>
    `;
  } catch (_) {
    container.innerHTML = '';
  }
}

function buildReviewForm(videoId) {
  return `
    <div class="review-form-header">
      <span class="review-form-title">✍️ Leave a Review</span>
    </div>
    <form class="review-form" id="rf-${videoId}" onsubmit="submitReview(event, '${videoId}')">
      <div class="rf-row">
        <input type="text" name="name" placeholder="Your name" required maxlength="80" />
        <select name="rating" required>
          <option value="" disabled selected>Rating ⭐</option>
          <option value="5">⭐⭐⭐⭐⭐ (5)</option>
          <option value="4">⭐⭐⭐⭐ (4)</option>
          <option value="3">⭐⭐⭐ (3)</option>
          <option value="2">⭐⭐ (2)</option>
          <option value="1">⭐ (1)</option>
        </select>
      </div>
      <textarea name="comment" placeholder="Share your experience..." required maxlength="600" rows="3"></textarea>
      <button type="submit" class="btn-review-submit">Submit Review</button>
    </form>
  `;
}

async function submitReview(e, videoId) {
  e.preventDefault();
  const form   = e.target;
  const btn    = form.querySelector('button[type="submit"]');
  const { name, rating, comment } = Object.fromEntries(new FormData(form));

  btn.textContent = 'Submitting…';
  btn.disabled    = true;

  try {
    const res  = await fetch(`${API}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ videoId, name, rating: parseInt(rating), comment }),
    });
    const data = await res.json();

    if (data.success) {
      Toast.success(data.message);
      form.reset();
      loadVideoReviews(videoId); // Refresh reviews
    } else {
      Toast.error(data.message || 'Failed to submit review');
    }
  } catch (_) {
    Toast.error('Network error. Please try again.');
  } finally {
    btn.textContent = 'Submit Review';
    btn.disabled    = false;
  }
}

window.submitReview = submitReview;

// ══════════════════════════════════════════════
//  BOOKING FORMS
// ══════════════════════════════════════════════
async function submitSessionForm(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form));

  btn.textContent = 'Submitting…';
  btn.disabled    = true;
  const dismiss   = Toast.loading('Sending your request…');

  try {
    const res  = await fetch(`${API}/bookings/session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data['s-name'], email: data['s-email'],
        phone: data['s-phone'], projectType: data['s-type'],
        message: data['s-message'],
      }),
    });
    const result = await res.json();
    dismiss();

    if (result.success) {
      Toast.success(result.message, 6000);
      form.reset();
      showFormSuccess('sessionFormSuccess');
    } else {
      Toast.error(result.message || 'Submission failed');
    }
  } catch (_) {
    dismiss();
    Toast.error('Network error. Please try again.');
  } finally {
    btn.textContent = 'Submit & Book Session';
    btn.disabled    = false;
  }
}

async function submitCounsellorForm(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button[type="submit"]');
  const data = Object.fromEntries(new FormData(form));

  btn.textContent = 'Submitting…';
  btn.disabled    = true;
  const dismiss   = Toast.loading('Sending your application…');

  try {
    const res = await fetch(`${API}/bookings/counsellor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data['c-name'], email: data['c-email'] || '',
        skills: data['c-skills'], experience: data['c-exp'],
        portfolioLink: data['c-portfolio'], message: data['c-message'],
      }),
    });
    const result = await res.json();
    dismiss();

    if (result.success) {
      Toast.success(result.message, 6000);
      form.reset();
      showFormSuccess('counsellorFormSuccess');
    } else {
      Toast.error(result.message || 'Submission failed');
    }
  } catch (_) {
    dismiss();
    Toast.error('Network error. Please try again.');
  } finally {
    btn.textContent = 'Submit Application';
    btn.disabled    = false;
  }
}

function showFormSuccess(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 6000);
  }
}

function handlePayment(e) {
  e.preventDefault();
  Toast.info('Payment gateway integration coming soon! Please contact us directly via WhatsApp or Phone. 📞', 6000);
}

window.submitSessionForm   = submitSessionForm;
window.submitCounsellorForm = submitCounsellorForm;
window.handlePayment       = handlePayment;

// ══════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Lazy load videos on scroll
function initLazyVideo() {
  const lazyObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const vid = entry.target;
        if (vid.dataset.src) {
          vid.src = vid.dataset.src;
          vid.load();
          lazyObs.unobserve(vid);
        }
      }
    });
  }, { rootMargin: '200px' });

  document.querySelectorAll('video[loading="lazy"]').forEach(v => lazyObs.observe(v));
}

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  loadPortfolio().then(initLazyVideo);
});
