/**
 * TestStore - E-Commerce Frontend Application
 * This file contains all the JavaScript logic for the e-commerce store
 */

// ===== State Management =====
const state = {
    user: null,
    products: [],
    cart: [],
    isLoading: false,
};

// ===== API Configuration =====
const API_URL = '/api';

// ===== API Helpers =====
async function apiRequest(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...(state.user?.token && { Authorization: `Bearer ${state.user.token}` }),
            },
            ...options,
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Request failed');
        }
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ===== Product Functions =====
async function loadProducts(filters = {}) {
    const loadingEl = document.getElementById('products-loading');
    const gridEl = document.getElementById('product-grid');

    loadingEl.style.display = 'block';

    try {
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.search) params.append('search', filters.search);

        const queryString = params.toString();
        const endpoint = queryString ? `/products?${queryString}` : '/products';

        const response = await apiRequest(endpoint);
        state.products = response.data || [];
        renderProducts();
    } catch (error) {
        showToast('Failed to load products', 'error');
        gridEl.innerHTML = '<p class="loading">Failed to load products. Please try again.</p>';
    } finally {
        loadingEl.style.display = 'none';
    }
}

function renderProducts() {
    const gridEl = document.getElementById('product-grid');
    const loadingEl = document.getElementById('products-loading');

    loadingEl.style.display = 'none';

    if (state.products.length === 0) {
        gridEl.innerHTML = '<p class="loading">No products found.</p>';
        return;
    }

    const sortFilter = document.getElementById('sort-filter').value;
    let sortedProducts = [...state.products];

    switch (sortFilter) {
        case 'price-low':
            sortedProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-high':
            sortedProducts.sort((a, b) => b.price - a.price);
            break;
        case 'name':
            sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }

    gridEl.innerHTML = sortedProducts.map(product => {
        const stockClass = product.stock === 0 ? 'out' : product.stock <= 5 ? 'low' : '';
        const stockText = product.stock === 0 ? 'Out of Stock' : `${product.stock} in stock`;
        const emoji = getCategoryEmoji(product.category);

        return `
      <div class="product-card" data-product-id="${product.id}" data-testid="product-${product.id}">
        <div class="product-image">${emoji}</div>
        <div class="product-info">
          <h3 class="product-name" data-testid="product-name-${product.id}">${product.name}</h3>
          <p class="product-category">${product.category || 'Uncategorized'}</p>
          <p class="product-price" data-testid="product-price-${product.id}">$${product.price.toFixed(2)}</p>
          <p class="product-stock ${stockClass}">${stockText}</p>
          <button 
            class="btn btn-primary add-to-cart-btn" 
            data-product-id="${product.id}"
            data-testid="add-to-cart-${product.id}"
            ${product.stock === 0 ? 'disabled' : ''}
          >
            ${product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    `;
    }).join('');

    // Add event listeners
    document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.dataset.productId;
            addToCart(productId);
        });
    });
}

function getCategoryEmoji(category) {
    const emojis = {
        electronics: '💻',
        clothing: '👕',
        books: '📚',
        home: '🏠',
    };
    return emojis[category] || '📦';
}

// ===== Cart Functions =====
function addToCart(productId) {
    const product = state.products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = state.cart.find(item => item.product.id === productId);

    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            showToast('Cannot add more items - stock limit reached', 'warning');
            return;
        }
        existingItem.quantity += 1;
    } else {
        state.cart.push({ product, quantity: 1 });
    }

    updateCart();
    showToast(`${product.name} added to cart`, 'success');
}

function removeFromCart(productId) {
    state.cart = state.cart.filter(item => item.product.id !== productId);
    updateCart();
}

function updateQuantity(productId, change) {
    const item = state.cart.find(item => item.product.id === productId);
    if (!item) return;

    const newQuantity = item.quantity + change;

    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    if (newQuantity > item.product.stock) {
        showToast('Cannot add more items - stock limit reached', 'warning');
        return;
    }

    item.quantity = newQuantity;
    updateCart();
}

function updateCart() {
    const countEl = document.getElementById('cart-count');
    const itemsEl = document.getElementById('cart-items');
    const emptyEl = document.getElementById('cart-empty');
    const totalEl = document.getElementById('total-amount');
    const checkoutBtn = document.getElementById('checkout-btn');

    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    countEl.textContent = totalItems;
    totalEl.textContent = `$${totalAmount.toFixed(2)}`;
    checkoutBtn.disabled = state.cart.length === 0;

    if (state.cart.length === 0) {
        emptyEl.style.display = 'block';
        itemsEl.innerHTML = '<p class="cart-empty" id="cart-empty">Your cart is empty</p>';
        return;
    }

    emptyEl.style.display = 'none';
    itemsEl.innerHTML = state.cart.map(item => {
        const emoji = getCategoryEmoji(item.product.category);
        return `
      <div class="cart-item" data-testid="cart-item-${item.product.id}">
        <div class="cart-item-image">${emoji}</div>
        <div class="cart-item-info">
          <p class="cart-item-name">${item.product.name}</p>
          <p class="cart-item-price">$${(item.product.price * item.quantity).toFixed(2)}</p>
          <div class="cart-item-actions">
            <button class="btn btn-secondary quantity-btn" data-action="decrease" data-product-id="${item.product.id}" data-testid="decrease-${item.product.id}">-</button>
            <span class="quantity-display" data-testid="quantity-${item.product.id}">${item.quantity}</span>
            <button class="btn btn-secondary quantity-btn" data-action="increase" data-product-id="${item.product.id}" data-testid="increase-${item.product.id}">+</button>
            <button class="btn btn-ghost remove-btn" data-product-id="${item.product.id}" data-testid="remove-${item.product.id}">Remove</button>
          </div>
        </div>
      </div>
    `;
    }).join('');

    // Add event listeners
    document.querySelectorAll('.quantity-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.dataset.productId;
            const action = e.target.dataset.action;
            updateQuantity(productId, action === 'increase' ? 1 : -1);
        });
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const productId = e.target.dataset.productId;
            removeFromCart(productId);
        });
    });
}

function toggleCart(show) {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('cart-overlay');

    if (show) {
        sidebar.classList.add('active');
        overlay.classList.add('active');
    } else {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
    }
}

// ===== Auth Functions =====
async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const email = form.email.value;
    const password = form.password.value;
    const errorEl = document.getElementById('login-error');

    try {
        const response = await apiRequest('/users/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });

        state.user = response.data;
        localStorage.setItem('user', JSON.stringify(state.user));
        updateAuthUI();
        closeModal('login-modal');
        showToast(`Welcome back, ${state.user.name}!`, 'success');
        form.reset();
        errorEl.textContent = '';
    } catch (error) {
        errorEl.textContent = error.message;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const form = e.target;
    const name = form.name.value;
    const email = form.email.value;
    const password = form.password.value;
    const errorEl = document.getElementById('register-error');

    try {
        await apiRequest('/users', {
            method: 'POST',
            body: JSON.stringify({ name, email, password }),
        });

        showToast('Account created! Please login.', 'success');
        closeModal('register-modal');
        openModal('login-modal');
        form.reset();
        errorEl.textContent = '';
    } catch (error) {
        errorEl.textContent = error.message;
    }
}

function handleLogout() {
    state.user = null;
    localStorage.removeItem('user');
    updateAuthUI();
    showToast('Logged out successfully', 'success');
}

function updateAuthUI() {
    const loginBtn = document.getElementById('login-btn');

    if (state.user) {
        loginBtn.textContent = 'Logout';
        loginBtn.dataset.testid = 'logout-btn';
    } else {
        loginBtn.textContent = 'Login';
        loginBtn.dataset.testid = 'login-btn';
    }
}

// ===== Checkout Functions =====
function openCheckout() {
    if (!state.user) {
        showToast('Please login to checkout', 'warning');
        openModal('login-modal');
        return;
    }

    if (state.cart.length === 0) {
        showToast('Your cart is empty', 'warning');
        return;
    }

    // Populate order summary
    const summaryEl = document.getElementById('order-summary');
    const totalAmount = state.cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

    summaryEl.innerHTML = `
    <h4>Order Summary</h4>
    ${state.cart.map(item => `
      <div class="order-summary-item">
        <span>${item.product.name} × ${item.quantity}</span>
        <span>$${(item.product.price * item.quantity).toFixed(2)}</span>
      </div>
    `).join('')}
    <div class="order-summary-total">
      <span>Total</span>
      <span>$${totalAmount.toFixed(2)}</span>
    </div>
  `;

    toggleCart(false);
    openModal('checkout-modal');
}

async function handleCheckout(e) {
    e.preventDefault();
    const form = e.target;
    const errorEl = document.getElementById('checkout-error');

    const shippingAddress = `${form.address.value}, ${form.city.value} ${form.zip.value}`;

    const orderData = {
        user_id: state.user.id,
        shipping_address: shippingAddress,
        items: state.cart.map(item => ({
            product_id: item.product.id,
            quantity: item.quantity,
        })),
    };

    try {
        const response = await apiRequest('/orders', {
            method: 'POST',
            body: JSON.stringify(orderData),
        });

        // Clear cart
        state.cart = [];
        updateCart();

        // Show confirmation
        document.getElementById('order-id').textContent = response.data.id;
        closeModal('checkout-modal');
        openModal('confirmation-modal');
        form.reset();
        errorEl.textContent = '';

        // Reload products to update stock
        loadProducts();
    } catch (error) {
        errorEl.textContent = error.message;
    }
}

// ===== Modal Functions =====
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ===== Toast Notifications =====
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✓',
        error: '✗',
        warning: '⚠',
    };

    toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span>${message}</span>
  `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== Event Listeners =====
function initEventListeners() {
    // Cart
    document.getElementById('cart-btn').addEventListener('click', () => toggleCart(true));
    document.getElementById('close-cart').addEventListener('click', () => toggleCart(false));
    document.getElementById('cart-overlay').addEventListener('click', () => toggleCart(false));
    document.getElementById('checkout-btn').addEventListener('click', openCheckout);

    // Auth
    document.getElementById('login-btn').addEventListener('click', () => {
        if (state.user) {
            handleLogout();
        } else {
            openModal('login-modal');
        }
    });
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
    document.getElementById('checkout-form').addEventListener('submit', handleCheckout);

    // Modal switches
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('login-modal');
        openModal('register-modal');
    });
    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        closeModal('register-modal');
        openModal('login-modal');
    });

    // Close modals
    document.getElementById('close-login').addEventListener('click', () => closeModal('login-modal'));
    document.getElementById('close-register').addEventListener('click', () => closeModal('register-modal'));
    document.getElementById('close-checkout').addEventListener('click', () => closeModal('checkout-modal'));
    document.getElementById('continue-shopping').addEventListener('click', () => closeModal('confirmation-modal'));

    // Close modals on overlay click
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.classList.remove('active');
            }
        });
    });

    // Filters
    document.getElementById('category-filter').addEventListener('change', (e) => {
        loadProducts({ category: e.target.value });
    });
    document.getElementById('sort-filter').addEventListener('change', () => {
        renderProducts();
    });

    // Category cards
    document.querySelectorAll('.category-card').forEach(card => {
        card.addEventListener('click', () => {
            const category = card.dataset.category;
            document.getElementById('category-filter').value = category;
            loadProducts({ category });
            document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Hero buttons
    document.getElementById('shop-now-btn').addEventListener('click', () => {
        document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    });
}

// ===== Initialize =====
function init() {
    // Load user from localStorage
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        state.user = JSON.parse(savedUser);
        updateAuthUI();
    }

    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
        state.cart = JSON.parse(savedCart);
        updateCart();
    }

    // Initialize event listeners
    initEventListeners();

    // Load products
    loadProducts();

    // Save cart to localStorage on changes
    const originalUpdateCart = updateCart;
    window.updateCart = function () {
        originalUpdateCart();
        localStorage.setItem('cart', JSON.stringify(state.cart));
    };
}

// Start the app
document.addEventListener('DOMContentLoaded', init);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { state, addToCart, removeFromCart, updateQuantity };
}
