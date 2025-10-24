let cart = JSON.parse(localStorage.getItem("cart")) || [];
// Cross-tab communication: use BroadcastChannel when available, fallback to storage event
const cartChannel = (typeof BroadcastChannel !== 'undefined') ? new BroadcastChannel('cart_channel') : null;
if (cartChannel) {
  cartChannel.onmessage = (ev) => {
    try { if (ev.data && ev.data.type === 'update') loadCart(); } catch(e){}
  };
}
// storage event fires in other tabs/windows (not the same tab)
window.addEventListener('storage', (e) => {
  if (e.key === 'cart') loadCart();
});

// Ensure cart UI is populated when page finishes loading
window.addEventListener('DOMContentLoaded', loadCart);

// If pages are opened via file://, localStorage may behave unexpectedly across files.
// Show a small banner to help the developer/user diagnose the issue.
if (location.protocol === 'file:') {
  window.addEventListener('DOMContentLoaded', () => {
    try {
      const warn = document.createElement('div');
      warn.innerHTML = `<div style="background:#fff3cd;border:1px solid #ffeeba;padding:10px;text-align:center;font-weight:600;">Bạn đang mở file trực tiếp (file://). LocalStorage có thể không chia sẻ giữa các file. Hãy chạy 1 local server (ví dụ: <code>python -m http.server 8000</code>) và mở http://localhost:8000 để mọi trang chia sẻ giỏ hàng.</div>`;
      document.body.insertAdjacentElement('afterbegin', warn);
    } catch (e) {}
  });
}

function addToCart(product) {
  cart.push(product);
  localStorage.setItem("cart", JSON.stringify(cart));
  console.log('addToCart: saved cart =', localStorage.getItem('cart'));
  // refresh any cart UI on the current page (if present) without requiring a reload
  if (typeof loadCart === 'function') loadCart();
  // notify other tabs/pages to refresh their cart UI
  try {
    if (cartChannel) cartChannel.postMessage({ type: 'update', cart });
    else localStorage.setItem('cart', JSON.stringify(cart)); // storage event will fire in other tabs
  } catch (e) { console.warn('cart broadcast failed', e); }
  alert(product + " đã thêm vào giỏ hàng!");
}

function loadCart() {
  // always refresh cart from localStorage in case another page changed it
  cart = JSON.parse(localStorage.getItem("cart")) || [];
  console.log('loadCart: loaded cart =', cart);
  let cartItems = document.getElementById("cart-items");
  if (!cartItems) return;
  cartItems.innerHTML = "";
  cart.forEach((item, index) => {
    let li = document.createElement("li");
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.innerHTML = `${item} <button class="btn btn-sm btn-danger" onclick="removeFromCart(${index})">Xóa</button>`;
    cartItems.appendChild(li);
  });
  
  


}

function removeFromCart(index) {
  cart.splice(index, 1);
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
}
function clearCart() {
  cart = [];
  localStorage.setItem("cart", JSON.stringify(cart));
  loadCart();
}

// Shared purchase handler: shows thank-you message. If called from a checkout
// button, it can also clear the cart. We keep it simple: show alert and clear cart.
function purchase(clear = true) {
  alert('Cảm ơn bạn đã mua hàng!');
  if (clear) {
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    loadCart();
  }
}
// REGISTER
function register(event) {
  event.preventDefault();

  let email = document.getElementById("regEmail").value.trim();
  let password = document.getElementById("regPassword").value.trim();
  let confirmPassword = document.getElementById("regConfirmPassword").value.trim();

  if (!email || !password || !confirmPassword) {
    alert("Vui lòng điền đầy đủ thông tin!");
    return;
  }

  if (password !== confirmPassword) {
    alert("Mật khẩu xác nhận không khớp!");
    return;
  }

  let users = JSON.parse(localStorage.getItem("users")) || [];
  if (users.find(u => u.email === email)) {
    alert("Email này đã tồn tại!");
    return;
  }

  users.push({ email, password });
  localStorage.setItem("users", JSON.stringify(users));

  alert("Đăng ký thành công! Hãy đăng nhập.");
  document.getElementById("registerForm").reset();
}

// LOGIN
function login(event) {
  event.preventDefault();

  let email = document.getElementById("loginEmail").value.trim();
  let password = document.getElementById("loginPassword").value.trim();

  let users = JSON.parse(localStorage.getItem("users")) || [];
  let user = users.find(u => u.email === email && u.password === password);

  if (user) {
    alert("Đăng nhập thành công! Xin chào " + email);
    document.getElementById("loginForm").reset();
    // Có thể redirect đến trang khác:
    // window.location.href = "trang-chinh.html";
  } else {
    alert("Sai email hoặc mật khẩu!");
  }
}

// Gắn sự kiện submit (guard in case forms are not on the current page)
const _regForm = document.getElementById("registerForm");
if (_regForm) _regForm.addEventListener("submit", register);
const _loginForm = document.getElementById("loginForm");
if (_loginForm) _loginForm.addEventListener("submit", login);
