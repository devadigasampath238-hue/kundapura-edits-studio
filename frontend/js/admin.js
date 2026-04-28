// frontend/js/admin.js
// ── KE Studio Admin Panel ─────────────────────

const API = '/api';
let adminToken = localStorage.getItem('ke_admin_token') || '';

// ══════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════
async function adminLogin(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = form.querySelector('button[type="submit"]');
  const username = form.querySelector('#a-username').value.trim();
  const password = form.querySelector('#a-password').value;
  const errEl    = document.getElementById('loginError');

  btn.textContent = 'Logging in…';
  btn.disabled    = true;
  errEl.textContent = '';

  try {
    const res  = await fetch(`${API}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (data.success) {
      adminToken = data.token;
      localStorage.setItem('ke_admin_token', adminToken);
      showDashboard();
      Toast.success(`Welcome back, ${data.admin.username}! 🎬`);
      loadDashboardData();
    } else {
      errEl.textContent = data.message || 'Invalid credentials';
    }
  } catch (_) {
    errEl.textContent = 'Server error. Is the backend running?';
  } finally {
    btn.textContent = 'Login';
    btn.disabled    = false;
  }
}

function adminLogout() {
  adminToken = '';
  localStorage.removeItem('ke_admin_token');
  showLogin();
}

async function verifyToken() {
  if (!adminToken) return showLogin();
  try {
    const res  = await fetch(`${API}/admin/verify`, { headers: authHeader() });
    const data = await res.json();
    if (data.success) { showDashboard(); loadDashboardData(); }
    else { adminToken = ''; localStorage.removeItem('ke_admin_token'); showLogin(); }
  } catch (_) { showLogin(); }
}

function authHeader() {
  return { 'Authorization': `Bearer ${adminToken}`, 'Content-Type': 'application/json' };
}

function showDashboard() {
  document.getElementById('loginSection').style.display  = 'none';
  document.getElementById('dashboardSection').style.display = 'block';
}

function showLogin() {
  document.getElementById('loginSection').style.display  = 'flex';
  document.getElementById('dashboardSection').style.display = 'none';
}

window.adminLogin  = adminLogin;
window.adminLogout = adminLogout;

// ══════════════════════════════════════════════
//  TABS
// ══════════════════════════════════════════════
function switchTab(tabId) {
  document.querySelectorAll('.admin-tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${tabId}`)?.classList.add('active');
  document.querySelector(`[data-tab="${tabId}"]`)?.classList.add('active');

  // Load data for tab
  if (tabId === 'videos')   loadAdminVideos();
  if (tabId === 'bookings') loadBookings();
  if (tabId === 'reviews')  loadAdminReviews();
}

window.switchTab = switchTab;

// ══════════════════════════════════════════════
//  DASHBOARD STATS
// ══════════════════════════════════════════════
async function loadDashboardData() {
  try {
    const [videosRes, bookingsRes, reviewsRes] = await Promise.all([
      fetch(`${API}/videos`, { headers: authHeader() }),
      fetch(`${API}/bookings`, { headers: authHeader() }),
      fetch(`${API}/reviews`, { headers: authHeader() }),
    ]);

    const videos   = await videosRes.json();
    const bookings = await bookingsRes.json();
    const reviews  = await reviewsRes.json();

    setStat('stat-videos',   videos.total || 0);
    setStat('stat-bookings', bookings.total || 0);
    setStat('stat-reviews',  reviews.count || 0);

    const newBookings = (bookings.bookings || []).filter(b => b.status === 'new').length;
    setStat('stat-new', newBookings);
  } catch (_) {}
}

function setStat(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ══════════════════════════════════════════════
//  UPLOAD VIDEO
// ══════════════════════════════════════════════
// ══════════════════════════════════════════════
//  UPLOAD VIDEO (Cloudinary Direct Upload)
// ══════════════════════════════════════════════
async function uploadVideo(e) {
  e.preventDefault();

  const form = e.target;
  const btn  = form.querySelector('button[type="submit"]');
  const progressWrap = document.getElementById('uploadProgress');
  const progressBar  = document.getElementById('progressBar');

  const fileInput = document.getElementById('videoFile');
  const file = fileInput.files[0];

  const title = form.querySelector('[name="title"]').value;
  const category = form.querySelector('[name="category"]').value;
  const description = form.querySelector('[name="description"]')?.value || '';

  if (!file) {
    return Toast.warning("Please select a video file");
  }

  btn.disabled = true;
  btn.textContent = 'Uploading…';

  progressWrap.style.display = 'block';
  progressBar.style.width = '5%';

  try {
    // 🔥 STEP 1: Upload to Cloudinary (DIRECT)
    const cloudForm = new FormData();
    cloudForm.append("file", file);
    cloudForm.append("upload_preset", "kundapura_upload"); // ⚠️ change this
    cloudForm.append("resource_type", "video");

    const cloudRes = await fetch(
      "https://api.cloudinary.com/v1_1/dkghxpwy8/video/upload", // ⚠️ change this
      {
        method: "POST",
        body: cloudForm,
      }
    );

    const cloudData = await cloudRes.json();
    if (!cloudRes.ok) {
  console.error("Cloudinary error:", cloudData);
  throw new Error(cloudData.error?.message || "Upload failed");
}

    

    progressBar.style.width = '70%';

    // 🔥 STEP 2: Send URL to backend
    const res = await fetch(`${API}/videos`, {
      method: 'POST',
      headers: authHeader(),
      body: JSON.stringify({
        title,
        category,
        description,
        videoUrl: cloudData.secure_url,
      }),
    });

    const data = await res.json();

    progressBar.style.width = '100%';

    if (data.success) {
      Toast.success("Video uploaded successfully 🎬");
      form.reset();
      document.getElementById('fileNameDisplay').textContent = 'No file chosen';
      switchTab('videos');
    } else {
      Toast.error(data.message || 'Upload failed');
    }

  } catch (err) {
    console.error(err);
    Toast.error("Upload failed. Check connection.");
  } finally {
    btn.disabled = false;
    btn.textContent = 'Upload Video';

    setTimeout(() => {
      progressWrap.style.display = 'none';
      progressBar.style.width = '0';
    }, 1500);
  }
}

// ══════════════════════════════════════════════
//  MANAGE VIDEOS
// ══════════════════════════════════════════════
async function loadAdminVideos() {
  const container = document.getElementById('adminVideosList');
  if (!container) return;
  container.innerHTML = '<div class="admin-loading">Loading videos…</div>';

  try {
    const res  = await fetch(`${API}/videos`, { headers: authHeader() });
    const data = await res.json();

    if (!data.videos?.length) {
      container.innerHTML = '<p class="admin-empty">No videos uploaded yet.</p>';
      return;
    }

    container.innerHTML = data.videos.map(v => `
      <div class="admin-video-row" id="vrow-${v._id}">
        <video src="${v.videoUrl}" class="admin-thumb-video" muted></video>
        <div class="admin-video-info">
          <strong id="vtitle-${v._id}">${escHtml(v.title)}</strong>
          <span class="cat-badge ${v.category}">${v.category}</span>
          <small>${new Date(v.createdAt).toLocaleDateString('en-IN')} · ${v.views} views</small>
        </div>
        <div class="admin-video-actions">
          <button class="admin-btn edit-btn" onclick="toggleEditVideo('${v._id}', '${escHtml(v.title)}', '${v.category}')">Edit</button>
          <button class="admin-btn delete-btn" onclick="deleteVideo('${v._id}')">Delete</button>
        </div>
        <div class="edit-form-inline" id="edit-${v._id}" style="display:none">
          <input type="text" id="edit-title-${v._id}" value="${escHtml(v.title)}" placeholder="Video title" />
          <select id="edit-cat-${v._id}">
            ${['wedding','reels','youtube','ads'].map(c => `<option value="${c}" ${v.category===c?'selected':''}>${c}</option>`).join('')}
          </select>
          <div style="display:flex;gap:8px">
            <button class="admin-btn save-btn" onclick="saveVideoEdit('${v._id}')">Save</button>
            <button class="admin-btn" onclick="document.getElementById('edit-${v._id}').style.display='none'">Cancel</button>
          </div>
        </div>
      </div>
    `).join('');
  } catch (_) {
    container.innerHTML = '<p class="admin-empty">Failed to load videos.</p>';
  }
}

function toggleEditVideo(id, title, cat) {
  const el = document.getElementById(`edit-${id}`);
  if (el) el.style.display = el.style.display === 'none' ? 'flex' : 'none';
}

async function saveVideoEdit(id) {
  const title    = document.getElementById(`edit-title-${id}`)?.value.trim();
  const category = document.getElementById(`edit-cat-${id}`)?.value;
  if (!title) return Toast.warning('Title cannot be empty');

  try {
    const res  = await fetch(`${API}/videos/${id}`, {
      method: 'PUT',
      headers: authHeader(),
      body: JSON.stringify({ title, category }),
    });
    const data = await res.json();
    if (data.success) {
      Toast.success('Video updated!');
      document.getElementById(`vtitle-${id}`).textContent = title;
      document.getElementById(`edit-${id}`).style.display  = 'none';
    } else {
      Toast.error(data.message);
    }
  } catch (_) {
    Toast.error('Update failed');
  }
}

async function deleteVideo(id) {
  if (!confirm('Delete this video and all its reviews? This cannot be undone.')) return;
  try {
    const res  = await fetch(`${API}/videos/${id}`, { method: 'DELETE', headers: authHeader() });
    const data = await res.json();
    if (data.success) {
      Toast.success('Video deleted');
      document.getElementById(`vrow-${id}`)?.remove();
      loadDashboardData();
    } else {
      Toast.error(data.message);
    }
  } catch (_) {
    Toast.error('Delete failed');
  }
}

window.toggleEditVideo = toggleEditVideo;
window.saveVideoEdit   = saveVideoEdit;
window.deleteVideo     = deleteVideo;

// ══════════════════════════════════════════════
//  BOOKINGS
// ══════════════════════════════════════════════
async function loadBookings(filter = 'all') {
  const container = document.getElementById('bookingsList');
  if (!container) return;
  container.innerHTML = '<div class="admin-loading">Loading bookings…</div>';

  try {
    const query = filter !== 'all' ? `?type=${filter}` : '';
    const res   = await fetch(`${API}/bookings${query}`, { headers: authHeader() });
    const data  = await res.json();

    if (!data.bookings?.length) {
      container.innerHTML = '<p class="admin-empty">No bookings found.</p>';
      return;
    }

    container.innerHTML = data.bookings.map(b => `
      <div class="admin-booking-row" id="brow-${b._id}">
        <div class="booking-badge ${b.type}">${b.type === 'session' ? '🎬 Session' : '🧑‍💼 Counsellor'}</div>
        <div class="booking-details">
          <strong>${escHtml(b.name)}</strong>
          <a href="mailto:${b.email}">${b.email}</a>
          ${b.phone ? `<a href="tel:${b.phone}">${b.phone}</a>` : ''}
          ${b.projectType ? `<span>Project: ${escHtml(b.projectType)}</span>` : ''}
          ${b.skills ? `<span>Skills: ${escHtml(b.skills)}</span>` : ''}
          ${b.experience ? `<span>Exp: ${escHtml(b.experience)}</span>` : ''}
          ${b.portfolioLink ? `<a href="${b.portfolioLink}" target="_blank">Portfolio ↗</a>` : ''}
          ${b.message ? `<p class="booking-message">"${escHtml(b.message)}"</p>` : ''}
          <small>${new Date(b.createdAt).toLocaleString('en-IN')}</small>
        </div>
        <div class="booking-status-wrap">
          <select class="status-select" onchange="updateBookingStatus('${b._id}', this.value)">
            ${['new','reviewed','contacted','closed'].map(s => `<option value="${s}" ${b.status===s?'selected':''}>${s}</option>`).join('')}
          </select>
          <button class="admin-btn delete-btn" onclick="deleteBooking('${b._id}')">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (_) {
    container.innerHTML = '<p class="admin-empty">Failed to load bookings.</p>';
  }
}

async function updateBookingStatus(id, status) {
  try {
    const res  = await fetch(`${API}/bookings/${id}/status`, {
      method: 'PATCH',
      headers: authHeader(),
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (data.success) Toast.success(`Status → ${status}`);
    else Toast.error(data.message);
  } catch (_) {
    Toast.error('Update failed');
  }
}

async function deleteBooking(id) {
  if (!confirm('Delete this booking?')) return;
  try {
    const res  = await fetch(`${API}/bookings/${id}`, { method: 'DELETE', headers: authHeader() });
    const data = await res.json();
    if (data.success) { Toast.success('Booking deleted'); document.getElementById(`brow-${id}`)?.remove(); }
    else Toast.error(data.message);
  } catch (_) {
    Toast.error('Delete failed');
  }
}

function filterBookings(type) {
  document.querySelectorAll('.booking-filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-bfilter="${type}"]`)?.classList.add('active');
  loadBookings(type);
}

window.updateBookingStatus = updateBookingStatus;
window.deleteBooking       = deleteBooking;
window.filterBookings      = filterBookings;

// ══════════════════════════════════════════════
//  REVIEWS
// ══════════════════════════════════════════════
async function loadAdminReviews() {
  const container = document.getElementById('adminReviewsList');
  if (!container) return;
  container.innerHTML = '<div class="admin-loading">Loading reviews…</div>';

  try {
    const res  = await fetch(`${API}/reviews`, { headers: authHeader() });
    const data = await res.json();

    if (!data.reviews?.length) {
      container.innerHTML = '<p class="admin-empty">No reviews yet.</p>';
      return;
    }

    const stars = r => '★'.repeat(r) + '☆'.repeat(5 - r);

    container.innerHTML = data.reviews.map(r => `
      <div class="admin-review-row" id="rrow-${r._id}">
        <div class="review-meta">
          <strong>${escHtml(r.name)}</strong>
          <span class="review-stars">${stars(r.rating)}</span>
          <small>on <em>${escHtml(r.videoId?.title || 'Unknown Video')}</em></small>
          <small>${new Date(r.createdAt).toLocaleDateString('en-IN')}</small>
        </div>
        <p class="review-comment">"${escHtml(r.comment)}"</p>
        <div class="review-actions">
          <span class="review-status ${r.isApproved ? 'approved' : 'hidden'}">${r.isApproved ? '✅ Approved' : '🙈 Hidden'}</span>
          <button class="admin-btn" onclick="toggleReview('${r._id}')">Toggle</button>
          <button class="admin-btn delete-btn" onclick="deleteReview('${r._id}')">Delete</button>
        </div>
      </div>
    `).join('');
  } catch (_) {
    container.innerHTML = '<p class="admin-empty">Failed to load reviews.</p>';
  }
}

async function toggleReview(id) {
  try {
    const res  = await fetch(`${API}/reviews/${id}/approve`, { method: 'PATCH', headers: authHeader() });
    const data = await res.json();
    if (data.success) { Toast.info(data.message); loadAdminReviews(); }
    else Toast.error(data.message);
  } catch (_) { Toast.error('Update failed'); }
}

async function deleteReview(id) {
  if (!confirm('Delete this review?')) return;
  try {
    const res  = await fetch(`${API}/reviews/${id}`, { method: 'DELETE', headers: authHeader() });
    const data = await res.json();
    if (data.success) { Toast.success('Review deleted'); document.getElementById(`rrow-${id}`)?.remove(); }
    else Toast.error(data.message);
  } catch (_) { Toast.error('Delete failed'); }
}

window.toggleReview = toggleReview;
window.deleteReview = deleteReview;

// ── Utility ───────────────────────────────────
function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  verifyToken();
  // Default tab
  switchTab('upload');
});
