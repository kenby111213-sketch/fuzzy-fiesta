// ============ Tiện ích ============
const $ = (sel) => document.querySelector(sel);
const app = $('#app');

const fmt = (n) => (n || 0).toLocaleString('vi-VN') + 'đ';

function getToken() {
  return localStorage.getItem('cafe_token');
}

async function api(method, url, body) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  // Token sai/hết hạn -> quay về màn đăng nhập.
  // (Bỏ qua chính lời gọi đăng nhập: 401 ở đó nghĩa là sai mật khẩu, không phải hết phiên.)
  if (res.status === 401 && !url.endsWith('/auth/login')) {
    localStorage.removeItem('cafe_token');
    showLogin();
    throw new Error('Phiên đăng nhập đã hết hạn');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra');
  return data;
}

let toastTimer;
function toast(msg, isErr = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show' + (isErr ? ' err' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = 'toast'), 2500);
}

function openModal(title, html) {
  $('#modal-title').textContent = title;
  $('#modal-body').innerHTML = html;
  $('#modal').classList.remove('hidden');
}
function closeModal() {
  $('#modal').classList.add('hidden');
}
window.closeModal = closeModal;

// ============ Trạng thái ============
const state = {
  view: 'pos',
  menu: [],
  activeCat: 'Tất cả',
  cart: { items: [], table: '', discount: 0, note: '' },
};
const CATS = ['Tất cả', 'Cà phê', 'Trà', 'Nước ép', 'Bánh', 'Khác'];

// ============ Điều hướng tab ============
document.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    state.view = tab.dataset.view;
    render();
  });
});

function render() {
  if (state.view === 'pos') renderPOS();
  else if (state.view === 'tables') renderTables();
  else if (state.view === 'menu') renderMenu();
  else if (state.view === 'reports') renderReports();
}

// ============ BÁN HÀNG (POS) ============
async function renderPOS() {
  app.innerHTML = `<div class="pos-grid">
    <section>
      <div class="cats" id="cats"></div>
      <div class="menu-grid" id="menu-grid"></div>
      <div class="orders-strip">
        <h2 class="page-title">Đơn đang xử lý</h2>
        <div class="order-cards" id="order-cards"></div>
      </div>
    </section>
    <aside class="card cart" id="cart"></aside>
  </div>`;

  if (state.menu.length === 0) state.menu = await api('GET', '/api/menu?available=true');
  await refreshFreeTables();
  renderCats();
  renderMenuGrid();
  renderCart();
  loadActiveOrders();
}

// Cache danh sách bàn trống để giỏ hàng render tức thì (không gọi API mỗi lần bấm)
async function refreshFreeTables() {
  const tables = await api('GET', '/api/tables').catch(() => []);
  state.freeTables = tables.filter((t) => t.status === 'Trống');
}

function renderCats() {
  $('#cats').innerHTML = CATS.map(
    (c) => `<div class="chip ${c === state.activeCat ? 'active' : ''}" onclick="setCat('${c}')">${c}</div>`
  ).join('');
}
window.setCat = (c) => {
  state.activeCat = c;
  renderCats();
  renderMenuGrid();
};

function renderMenuGrid() {
  const list =
    state.activeCat === 'Tất cả'
      ? state.menu
      : state.menu.filter((m) => m.category === state.activeCat);
  $('#menu-grid').innerHTML = list
    .map(
      (m) => `<div class="menu-item" onclick="addToCart('${m._id}')">
        <div class="mi-name">${m.name}</div>
        <div class="mi-price">${fmt(m.price)}</div>
        <div class="mi-cat">${m.category}</div>
      </div>`
    )
    .join('');
}

window.addToCart = (id) => {
  const m = state.menu.find((x) => x._id === id);
  const line = state.cart.items.find((l) => l.menuItem === id);
  if (line) line.quantity++;
  else state.cart.items.push({ menuItem: id, name: m.name, price: m.price, quantity: 1, note: '' });
  renderCart();
};

window.changeQty = (id, delta) => {
  const line = state.cart.items.find((l) => l.menuItem === id);
  if (!line) return;
  line.quantity += delta;
  if (line.quantity <= 0) state.cart.items = state.cart.items.filter((l) => l.menuItem !== id);
  renderCart();
};

window.setCartField = (field, val) => {
  state.cart[field] = field === 'discount' ? Number(val) || 0 : val;
  renderCart();
};

function renderCart() {
  const c = state.cart;
  const subtotal = c.items.reduce((s, l) => s + l.price * l.quantity, 0);
  const discount = Math.min(c.discount, subtotal);
  const total = subtotal - discount;

  const freeTables = state.freeTables || [];

  const lines = c.items.length
    ? c.items
        .map(
          (l) => `<div class="cart-line">
        <div class="cl-name">${l.name}<small>${fmt(l.price)}</small></div>
        <div class="qty">
          <button onclick="changeQty('${l.menuItem}',-1)">−</button>
          <span>${l.quantity}</span>
          <button onclick="changeQty('${l.menuItem}',1)">+</button>
        </div>
        <strong>${fmt(l.price * l.quantity)}</strong>
      </div>`
        )
        .join('')
    : `<div class="cart-empty">Chọn món từ thực đơn bên trái ☕</div>`;

  $('#cart').innerHTML = `
    <h3>Đơn hiện tại</h3>
    <div class="cart-lines">${lines}</div>
    <div class="field">
      <label>Bàn</label>
      <select onchange="setCartField('table', this.value)">
        <option value="">🥡 Mang đi</option>
        ${freeTables
          .map((t) => `<option value="${t._id}" ${c.table === t._id ? 'selected' : ''}>${t.name}</option>`)
          .join('')}
      </select>
    </div>
    <div class="field">
      <label>Giảm giá (đ)</label>
      <input type="number" min="0" value="${c.discount || ''}" placeholder="0"
        onchange="setCartField('discount', this.value)" />
    </div>
    <div class="field">
      <label>Ghi chú</label>
      <input value="${c.note || ''}" placeholder="ít đường, nhiều đá..."
        onchange="setCartField('note', this.value)" />
    </div>
    <div class="cart-total"><span>Tạm tính</span><span>${fmt(subtotal)}</span></div>
    <div class="cart-total"><span>Giảm giá</span><span>-${fmt(discount)}</span></div>
    <div class="cart-total grand"><span>Tổng</span><span>${fmt(total)}</span></div>
    <div class="cart-actions">
      <button class="btn btn-ghost" ${!c.items.length ? 'disabled' : ''} onclick="submitOrder(false)">Lưu đơn</button>
      <button class="btn btn-green" ${!c.items.length ? 'disabled' : ''} onclick="submitOrder(true)">Thanh toán</button>
    </div>`;
}

async function submitOrder(payNow) {
  const c = state.cart;
  try {
    const order = await api('POST', '/api/orders', {
      items: c.items.map((l) => ({ menuItem: l.menuItem, name: l.name, price: l.price, quantity: l.quantity, note: l.note })),
      discount: c.discount,
      table: c.table || null,
      note: c.note,
    });
    if (payNow) {
      openPayment(order._id);
    } else {
      toast('Đã lưu đơn ✔');
    }
    state.cart = { items: [], table: '', discount: 0, note: '' };
    await refreshFreeTables();
    renderCart();
    loadActiveOrders();
  } catch (e) {
    toast(e.message, true);
  }
}
window.submitOrder = submitOrder;

async function loadActiveOrders() {
  const orders = await api('GET', '/api/orders?active=true').catch(() => []);
  const box = $('#order-cards');
  if (!box) return;
  if (!orders.length) {
    box.innerHTML = `<p class="muted">Chưa có đơn nào đang xử lý.</p>`;
    return;
  }
  box.innerHTML = orders.map(orderCard).join('');
}

function badgeClass(s) {
  if (s === 'Mới') return 'Mới';
  if (s === 'Đang pha') return 'Đang';
  return 'Hoàn';
}

function orderCard(o) {
  const next = { Mới: 'Đang pha', 'Đang pha': 'Hoàn thành' }[o.status];
  const nextLabel = { 'Đang pha': 'Bắt đầu pha', 'Hoàn thành': 'Đánh dấu xong' }[next];
  return `<div class="card order-card">
    <div class="oc-head">
      <strong>${o.table ? o.table.name : '🥡 Mang đi'}</strong>
      <span class="badge ${badgeClass(o.status)}">${o.status}</span>
    </div>
    <ul>${o.items.map((i) => `<li><span>${i.quantity}× ${i.name}</span><span>${fmt(i.price * i.quantity)}</span></li>`).join('')}</ul>
    <div class="cart-total grand" style="font-size:16px"><span>Tổng</span><span>${fmt(o.totalAmount)}</span></div>
    <div class="oc-actions">
      ${next ? `<button class="btn btn-sm btn-primary" onclick="advance('${o._id}','${next}')">${nextLabel}</button>` : ''}
      <button class="btn btn-sm btn-green" onclick="openPayment('${o._id}')">Thanh toán</button>
      <button class="btn btn-sm btn-danger" onclick="cancelOrder('${o._id}')">Hủy</button>
    </div>
  </div>`;
}

window.advance = async (id, status) => {
  try {
    await api('PUT', '/api/orders/' + id, { status });
    toast('Đã cập nhật: ' + status);
    loadActiveOrders();
  } catch (e) {
    toast(e.message, true);
  }
};

window.cancelOrder = async (id) => {
  if (!confirm('Hủy đơn này?')) return;
  try {
    await api('PUT', '/api/orders/' + id, { status: 'Đã hủy' });
    toast('Đã hủy đơn');
    loadActiveOrders();
    if (state.view === 'tables') renderTables();
  } catch (e) {
    toast(e.message, true);
  }
};

// Thanh toán
window.openPayment = async (id) => {
  const o = await api('GET', '/api/orders/' + id);
  openModal(
    'Thanh toán',
    `<p style="margin-bottom:10px">${o.table ? o.table.name : 'Mang đi'} — <strong>${o.items.length}</strong> món</p>
     <div class="cart-total grand"><span>Cần thu</span><span>${fmt(o.totalAmount)}</span></div>
     <div class="field">
       <label>Hình thức</label>
       <select id="pay-method">
         <option>Tiền mặt</option><option>Chuyển khoản</option><option>Thẻ</option>
       </select>
     </div>
     <button class="btn btn-green" style="width:100%" onclick="confirmPay('${id}')">Xác nhận đã thu tiền</button>`
  );
};
window.confirmPay = async (id) => {
  try {
    await api('PUT', '/api/orders/' + id, {
      status: 'Đã thanh toán',
      paymentMethod: $('#pay-method').value,
    });
    closeModal();
    toast('Thanh toán thành công 🎉');
    if (state.view === 'pos') loadActiveOrders();
    if (state.view === 'tables') renderTables();
  } catch (e) {
    toast(e.message, true);
  }
};

// ============ BÀN ============
async function renderTables() {
  app.innerHTML = `<div class="toolbar">
      <h2 class="page-title" style="margin:0">Sơ đồ bàn</h2>
      <button class="btn btn-primary" onclick="addTable()">+ Thêm bàn</button>
    </div>
    <div class="tables-grid" id="tables-grid"></div>`;
  const tables = await api('GET', '/api/tables');
  $('#tables-grid').innerHTML = tables
    .map((t) => {
      const busy = t.status === 'Đang phục vụ';
      const amount = t.currentOrder ? fmt(t.currentOrder.totalAmount) : '';
      return `<div class="table-box ${busy ? 'busy' : 'free'}" onclick="tableClick('${t._id}', ${busy})">
        <div class="tb-name">${t.name}</div>
        <div class="tb-status">${busy ? '● Đang phục vụ' : '○ Trống'}</div>
        ${amount ? `<div class="tb-amount">${amount}</div>` : ''}
      </div>`;
    })
    .join('');
  state._tables = tables;
}

window.tableClick = (id, busy) => {
  const t = state._tables.find((x) => x._id === id);
  if (busy && t.currentOrder) {
    const o = t.currentOrder;
    openModal(
      t.name,
      `<ul style="list-style:none;margin-bottom:10px">${o.items
        .map((i) => `<li style="display:flex;justify-content:space-between"><span>${i.quantity}× ${i.name}</span><span>${fmt(i.price * i.quantity)}</span></li>`)
        .join('')}</ul>
       <div class="cart-total grand"><span>Tổng</span><span>${fmt(o.totalAmount)}</span></div>
       <div class="cart-actions">
         <button class="btn btn-green" onclick="closeModal();openPayment('${o._id}')">Thanh toán</button>
         <button class="btn btn-danger" onclick="closeModal();cancelOrder('${o._id}')">Hủy đơn</button>
       </div>`
    );
  } else {
    // bàn trống -> qua POS, chọn sẵn bàn
    state.cart.table = id;
    document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    document.querySelector('.tab[data-view="pos"]').classList.add('active');
    state.view = 'pos';
    renderPOS();
    toast('Đã chọn ' + t.name + ' — hãy chọn món');
  }
};

window.addTable = () => {
  openModal(
    'Thêm bàn',
    `<div class="field"><label>Tên bàn</label><input id="tb-name" placeholder="Bàn 9" /></div>
     <button class="btn btn-primary" style="width:100%" onclick="saveTable()">Lưu</button>`
  );
};
window.saveTable = async () => {
  const name = $('#tb-name').value.trim();
  if (!name) return toast('Nhập tên bàn', true);
  try {
    await api('POST', '/api/tables', { name });
    closeModal();
    toast('Đã thêm bàn');
    renderTables();
  } catch (e) {
    toast(e.message, true);
  }
};

// ============ THỰC ĐƠN ============
async function renderMenu() {
  app.innerHTML = `<div class="toolbar">
      <h2 class="page-title" style="margin:0">Thực đơn</h2>
      <button class="btn btn-primary" onclick="editMenuItem()">+ Thêm món</button>
    </div>
    <div class="card"><table class="data" id="menu-table"></table></div>`;
  const items = await api('GET', '/api/menu');
  state.menu = items.filter((m) => m.available); // đồng bộ cho POS
  $('#menu-table').innerHTML = `
    <tr><th>Tên món</th><th>Nhóm</th><th>Giá</th><th>Trạng thái</th><th></th></tr>
    ${items
      .map(
        (m) => `<tr>
        <td>${m.name}</td>
        <td><span class="tag">${m.category}</span></td>
        <td>${fmt(m.price)}</td>
        <td>${m.available ? '<span class="pill-on">● Đang bán</span>' : '<span class="pill-off">○ Ngừng bán</span>'}</td>
        <td style="text-align:right;white-space:nowrap">
          <button class="btn btn-sm btn-ghost" onclick='editMenuItem(${JSON.stringify(m)})'>Sửa</button>
          <button class="btn btn-sm btn-danger" onclick="deleteMenuItem('${m._id}')">Xóa</button>
        </td>
      </tr>`
      )
      .join('')}`;
}

window.editMenuItem = (m = null) => {
  const cats = ['Cà phê', 'Trà', 'Nước ép', 'Bánh', 'Khác'];
  openModal(m ? 'Sửa món' : 'Thêm món', `
    <div class="field"><label>Tên món</label><input id="m-name" value="${m ? m.name : ''}" /></div>
    <div class="field"><label>Nhóm</label>
      <select id="m-cat">${cats.map((c) => `<option ${m && m.category === c ? 'selected' : ''}>${c}</option>`).join('')}</select>
    </div>
    <div class="field"><label>Giá (đ)</label><input id="m-price" type="number" min="0" value="${m ? m.price : ''}" /></div>
    <div class="field"><label><input type="checkbox" id="m-avail" style="width:auto" ${!m || m.available ? 'checked' : ''} /> Đang bán</label></div>
    <button class="btn btn-primary" style="width:100%" onclick="saveMenuItem('${m ? m._id : ''}')">Lưu</button>
  `);
};
window.saveMenuItem = async (id) => {
  const body = {
    name: $('#m-name').value.trim(),
    category: $('#m-cat').value,
    price: Number($('#m-price').value) || 0,
    available: $('#m-avail').checked,
  };
  if (!body.name) return toast('Nhập tên món', true);
  try {
    if (id) await api('PUT', '/api/menu/' + id, body);
    else await api('POST', '/api/menu', body);
    closeModal();
    toast('Đã lưu món');
    renderMenu();
  } catch (e) {
    toast(e.message, true);
  }
};
window.deleteMenuItem = async (id) => {
  if (!confirm('Xóa món này khỏi thực đơn?')) return;
  try {
    await api('DELETE', '/api/menu/' + id);
    toast('Đã xóa');
    renderMenu();
  } catch (e) {
    toast(e.message, true);
  }
};

// ============ BÁO CÁO ============
async function renderReports() {
  app.innerHTML = `<h2 class="page-title">Báo cáo</h2><div id="rep"></div>`;
  const d = await api('GET', '/api/reports/summary');
  const maxRev = Math.max(...d.daily.map((x) => x.revenue), 1);
  const dayName = (s) => {
    const dt = new Date(s + 'T00:00:00');
    return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dt.getDay()];
  };

  $('#rep').innerHTML = `
    <div class="kpis">
      <div class="card kpi"><div class="k-label">Doanh thu hôm nay</div><div class="k-value">${fmt(d.today.revenue)}</div></div>
      <div class="card kpi"><div class="k-label">Số đơn hôm nay</div><div class="k-value">${d.today.count}</div></div>
      <div class="card kpi"><div class="k-label">Doanh thu 7 ngày</div><div class="k-value">${fmt(d.daily.reduce((s, x) => s + x.revenue, 0))}</div></div>
    </div>

    <div class="card chart">
      <h3>Doanh thu 7 ngày gần nhất</h3>
      ${
        d.daily.length
          ? `<div class="bars">${d.daily
              .map(
                (x) => `<div class="bar-col">
              <div class="bar-val">${Math.round(x.revenue / 1000)}k</div>
              <div class="bar" style="height:${(x.revenue / maxRev) * 100}%"></div>
              <div class="bar-label">${dayName(x._id)}</div>
            </div>`
              )
              .join('')}</div>`
          : '<p class="muted">Chưa có dữ liệu thanh toán.</p>'
      }
    </div>

    <div class="card chart">
      <h3>Món bán chạy (7 ngày)</h3>
      ${
        d.topItems.length
          ? `<table class="data">
          <tr><th>Món</th><th>SL bán</th><th>Doanh thu</th></tr>
          ${d.topItems.map((t) => `<tr><td>${t._id}</td><td>${t.qty}</td><td>${fmt(t.revenue)}</td></tr>`).join('')}
        </table>`
          : '<p class="muted">Chưa có dữ liệu.</p>'
      }
    </div>`;
}

// Đóng modal khi bấm nền
$('#modal').addEventListener('click', (e) => {
  if (e.target.id === 'modal') closeModal();
});

// ============ ĐĂNG NHẬP ============
function showLogin() {
  $('#main-ui').classList.add('hidden');
  $('#login-screen').classList.remove('hidden');
}

function showApp(user) {
  $('#login-screen').classList.add('hidden');
  $('#main-ui').classList.remove('hidden');
  $('#user-name').textContent = '👤 ' + (user.name || user.username);
  // đặt lại về tab bán hàng và nạp dữ liệu
  state.menu = [];
  render();
}

async function doLogin(e) {
  e.preventDefault();
  const username = $('#login-user').value.trim();
  const password = $('#login-pass').value;
  const errBox = $('#login-error');
  errBox.textContent = '';
  try {
    const data = await api('POST', '/api/auth/login', { username, password });
    localStorage.setItem('cafe_token', data.token);
    $('#login-pass').value = '';
    showApp(data.user);
  } catch (err) {
    errBox.textContent = err.message;
  }
}
window.doLogin = doLogin;

function logout() {
  localStorage.removeItem('cafe_token');
  showLogin();
}
window.logout = logout;

window.openChangePassword = () => {
  openModal(
    'Đổi mật khẩu',
    `<div class="field"><label>Mật khẩu hiện tại</label><input id="cp-old" type="password" /></div>
     <div class="field"><label>Mật khẩu mới</label><input id="cp-new" type="password" /></div>
     <div id="cp-err" class="login-error"></div>
     <button class="btn btn-primary" style="width:100%" onclick="submitChangePassword()">Lưu</button>`
  );
};
window.submitChangePassword = async () => {
  try {
    await api('POST', '/api/auth/change-password', {
      oldPassword: $('#cp-old').value,
      newPassword: $('#cp-new').value,
    });
    closeModal();
    toast('Đã đổi mật khẩu ✔');
  } catch (e) {
    $('#cp-err').textContent = e.message;
  }
};

// ============ Khởi động ============
async function boot() {
  if (!getToken()) return showLogin();
  try {
    const me = await api('GET', '/api/auth/me'); // kiểm tra token còn hạn
    showApp(me);
  } catch {
    showLogin();
  }
}
boot();
