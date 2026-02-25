/* app.js – Myynti Inventory Frontend */

const API = '/api/products';
let allProducts = [];

// ── DOM refs ──────────────────────────────────────────────────────────────────
const productBody  = document.getElementById('productBody');
const searchInput  = document.getElementById('searchInput');
const statsBar     = document.getElementById('statsBar');

const addModal     = document.getElementById('addModal');
const openAddBtn   = document.getElementById('openAddModal');
const closeAddBtn  = document.getElementById('closeAddModal');
const cancelAddBtn = document.getElementById('cancelAdd');
const addForm      = document.getElementById('addForm');

const editModal     = document.getElementById('editModal');
const closeEditBtn  = document.getElementById('closeEditModal');
const cancelEditBtn = document.getElementById('cancelEdit');
const editForm      = document.getElementById('editForm');

const categoryList = document.getElementById('categoryList');

// ── Toast ─────────────────────────────────────────────────────────────────────
const toastContainer = (() => {
  const el = document.createElement('div');
  el.className = 'toast-container';
  document.body.appendChild(el);
  return el;
})();

function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = type === 'success' ? '✓ ' + msg : '✕ ' + msg;
  toastContainer.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────
async function api(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Tuntematon virhe');
  return data;
}

// ── Qty badge helper ──────────────────────────────────────────────────────────
function qtyClass(n) {
  if (n < 5)  return 'low';
  if (n < 20) return 'mid';
  return 'high';
}

// ── Render ────────────────────────────────────────────────────────────────────
function renderProducts(products) {
  if (!products.length) {
    productBody.innerHTML = `<tr><td colspan="6" class="empty-state">
      <span class="empty-icon">🔍</span>Ei tuloksia haulle.
    </td></tr>`;
    return;
  }

  productBody.innerHTML = products.map(p => {
    const cls   = qtyClass(p.quantity);
    const label = cls === 'low' ? 'Matala varasto' : cls === 'mid' ? 'Kohtalainen' : 'Riittävä';
    return `
    <tr data-id="${p.id}">
      <td class="product-name">${esc(p.name)}</td>
      <td><span class="product-category">${esc(p.category)}</span></td>
      <td>${esc(p.unit)}</td>
      <td class="price">${p.price.toFixed(2)} €</td>
      <td class="qty-col">
        <div class="qty-editor">
          <button class="qty-dec" title="Vähennä">−</button>
          <input type="number" class="qty-input" value="${p.quantity}" min="0" step="1"
                 aria-label="Varastomäärä" />
          <button class="qty-inc" title="Lisää">+</button>
          <span class="qty-badge ${cls}"><span class="dot"></span>${p.quantity} ${esc(p.unit)}</span>
        </div>
      </td>
      <td class="actions-cell">
        <button class="btn btn-edit edit-btn">✏️ Muokkaa</button>
        <button class="btn btn-danger delete-btn">🗑️ Poista</button>
      </td>
    </tr>`;
  }).join('');

  renderStats(products);
  updateCategoryDatalist(products);
}

function renderStats(products) {
  const low  = products.filter(p => p.quantity < 5).length;
  const mid  = products.filter(p => p.quantity >= 5 && p.quantity < 20).length;
  const ok   = products.filter(p => p.quantity >= 20).length;
  const totalVal = products.reduce((s, p) => s + p.price * p.quantity, 0);

  statsBar.innerHTML = `
    <div class="stat-card">
      <span class="stat-val">${products.length}</span>
      <span class="stat-lbl">Tuotetta yhteensä</span>
    </div>
    <div class="stat-card danger">
      <span class="stat-val">${low}</span>
      <span class="stat-lbl">Matala varasto (&lt;5)</span>
    </div>
    <div class="stat-card warning">
      <span class="stat-val">${mid}</span>
      <span class="stat-lbl">Kohtalainen (5–19)</span>
    </div>
    <div class="stat-card success">
      <span class="stat-val">${ok}</span>
      <span class="stat-lbl">Riittävä (≥20)</span>
    </div>
    <div class="stat-card">
      <span class="stat-val">${totalVal.toLocaleString('fi-FI', {minimumFractionDigits:2,maximumFractionDigits:2})} €</span>
      <span class="stat-lbl">Varaston arvo</span>
    </div>`;
}

function updateCategoryDatalist(products) {
  const cats = [...new Set(products.map(p => p.category))].sort();
  categoryList.innerHTML = cats.map(c => `<option value="${esc(c)}">`).join('');
}

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

// ── Load ──────────────────────────────────────────────────────────────────────
async function loadProducts(q = '') {
  try {
    const url = q ? `${API}?q=${encodeURIComponent(q)}` : API;
    allProducts = await api(url);
    renderProducts(allProducts);
  } catch (e) {
    toast(e.message, 'error');
  }
}

// ── Search ────────────────────────────────────────────────────────────────────
let searchTimer;
searchInput.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadProducts(searchInput.value.trim()), 250);
});

// ── Table events (delegation) ─────────────────────────────────────────────────
productBody.addEventListener('click', async e => {
  const row = e.target.closest('tr');
  if (!row) return;
  const id = Number(row.dataset.id);

  // Delete
  if (e.target.closest('.delete-btn')) {
    if (!confirm('Haluatko varmasti poistaa tämän tuotteen?')) return;
    try {
      await api(`${API}/${id}`, { method: 'DELETE' });
      toast('Tuote poistettu.');
      loadProducts(searchInput.value.trim());
    } catch (e) { toast(e.message, 'error'); }
    return;
  }

  // Edit
  if (e.target.closest('.edit-btn')) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;
    openEditModal(p);
    return;
  }

  // Qty dec/inc
  const input = row.querySelector('.qty-input');
  if (e.target.closest('.qty-dec')) {
    input.value = Math.max(0, Number(input.value) - 1);
    saveQty(id, Number(input.value));
    return;
  }
  if (e.target.closest('.qty-inc')) {
    input.value = Number(input.value) + 1;
    saveQty(id, Number(input.value));
    return;
  }
});

productBody.addEventListener('change', e => {
  if (!e.target.classList.contains('qty-input')) return;
  const row = e.target.closest('tr');
  const id  = Number(row.dataset.id);
  const val = Math.max(0, Number(e.target.value));
  e.target.value = val;
  saveQty(id, val);
});

async function saveQty(id, quantity) {
  try {
    const updated = await api(`${API}/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
    // Update badge without full reload
    const row = productBody.querySelector(`tr[data-id="${id}"]`);
    if (row) {
      const badge = row.querySelector('.qty-badge');
      const p     = allProducts.find(x => x.id === id);
      if (p) p.quantity = updated.quantity;
      badge.className = `qty-badge ${qtyClass(updated.quantity)}`;
      badge.innerHTML = `<span class="dot"></span>${updated.quantity} ${esc(updated.unit)}`;
    }
    renderStats(allProducts);
    toast('Varastomäärä päivitetty.');
  } catch (e) { toast(e.message, 'error'); }
}

// ── Add Modal ─────────────────────────────────────────────────────────────────
function openModal(modal)  { modal.hidden = false; modal.querySelector('input').focus(); }
function closeModal(modal) { modal.hidden = true; }

openAddBtn.addEventListener('click', () => { addForm.reset(); openModal(addModal); });
closeAddBtn.addEventListener('click', () => closeModal(addModal));
cancelAddBtn.addEventListener('click', () => closeModal(addModal));
addModal.addEventListener('click', e => { if (e.target === addModal) closeModal(addModal); });

addForm.addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(addForm);
  const body = {
    name:     fd.get('name').trim(),
    category: fd.get('category').trim(),
    price:    parseFloat(fd.get('price')),
    unit:     fd.get('unit').trim(),
    quantity: parseInt(fd.get('quantity'), 10),
  };
  if (!body.name || !body.category || !body.unit || isNaN(body.price) || isNaN(body.quantity)) {
    toast('Täytä kaikki kentät.', 'error');
    return;
  }
  try {
    await api(API, { method: 'POST', body: JSON.stringify(body) });
    closeModal(addModal);
    addForm.reset();
    toast('Tuote lisätty!');
    loadProducts(searchInput.value.trim());
  } catch (e) { toast(e.message, 'error'); }
});

// ── Edit Modal ────────────────────────────────────────────────────────────────
function openEditModal(p) {
  const f = editForm;
  f.elements['id'].value       = p.id;
  f.elements['name'].value     = p.name;
  f.elements['category'].value = p.category;
  f.elements['price'].value    = p.price;
  f.elements['unit'].value     = p.unit;
  f.elements['quantity'].value = p.quantity;
  openModal(editModal);
}
closeEditBtn.addEventListener('click', () => closeModal(editModal));
cancelEditBtn.addEventListener('click', () => closeModal(editModal));
editModal.addEventListener('click', e => { if (e.target === editModal) closeModal(editModal); });

editForm.addEventListener('submit', async e => {
  e.preventDefault();
  const fd = new FormData(editForm);
  const id = fd.get('id');
  const body = {
    name:     fd.get('name').trim(),
    category: fd.get('category').trim(),
    price:    parseFloat(fd.get('price')),
    unit:     fd.get('unit').trim(),
    quantity: parseInt(fd.get('quantity'), 10),
  };
  try {
    await api(`${API}/${id}`, { method: 'PUT', body: JSON.stringify(body) });
    closeModal(editModal);
    toast('Tuote päivitetty!');
    loadProducts(searchInput.value.trim());
  } catch (e) { toast(e.message, 'error'); }
});

// ── Keyboard close ────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal(addModal);
    closeModal(editModal);
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadProducts();
