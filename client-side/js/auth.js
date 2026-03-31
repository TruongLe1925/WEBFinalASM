/**
 * Auth Module - LocalStorage-based Authentication
 */

const AUTH_KEY = 'shop_auth';
const USERS_KEY = 'shop_users';
const CURRENT_USER_KEY = 'shop_current_user';
const CART_KEY = 'shop_cart';
const ORDERS_KEY = 'shop_orders';

function initData() {
    if (!localStorage.getItem(USERS_KEY)) {
        localStorage.setItem(USERS_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(CART_KEY)) {
        localStorage.setItem(CART_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(ORDERS_KEY)) {
        localStorage.setItem(ORDERS_KEY, JSON.stringify([]));
    }
}

function register(userData) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    
    if (users.find(u => u.username === userData.username)) {
        return { success: false, message: 'Username đã tồn tại' };
    }
    
    if (users.find(u => u.email === userData.email)) {
        return { success: false, message: 'Email đã được sử dụng' };
    }
    
    const newUser = {
        id: Date.now().toString(),
        fullName: userData.fullName,
        username: userData.username,
        email: userData.email,
        phoneNumber: userData.phoneNumber,
        address: userData.address,
        password: userData.password,
        role: 'CUSTOMER',
        createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    return { success: true, message: 'Đăng ký thành công!' };
}

function login(username, password) {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        return { success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' };
    }
    
    const session = {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        address: user.address,
        role: user.role,
        loginAt: new Date().toISOString()
    };
    
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(session));
    
    return { success: true, message: 'Đăng nhập thành công!', user: session };
}

function logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    localStorage.removeItem(CART_KEY);
    return { success: true, message: 'Đã đăng xuất' };
}

function isLoggedIn() {
    return localStorage.getItem(CURRENT_USER_KEY) !== null;
}

function getCurrentUser() {
    const session = localStorage.getItem(CURRENT_USER_KEY);
    return session ? JSON.parse(session) : null;
}

function updateProfile(userData) {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return { success: false, message: 'Chưa đăng nhập' };
    }
    
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const userIndex = users.findIndex(u => u.id === currentUser.id);
    
    if (userIndex === -1) {
        return { success: false, message: 'Không tìm thấy người dùng' };
    }
    
    users[userIndex] = { ...users[userIndex], ...userData };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    const updatedSession = { ...currentUser, ...userData };
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedSession));
    
    return { success: true, message: 'Cập nhật thành công!' };
}

function deleteAccount() {
    const currentUser = getCurrentUser();
    if (!currentUser) {
        return { success: false, message: 'Chưa đăng nhập' };
    }
    
    let users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    users = users.filter(u => u.id !== currentUser.id);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    logout();
    
    return { success: true, message: 'Tài khoản đã được xóa' };
}

function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
}

function addToCart(product) {
    const cart = getCart();
    const existingItem = cart.find(item => item.productName === product.productName);
    
    if (existingItem) {
        existingItem.quantity += product.quantity;
    } else {
        cart.push({
            ...product,
            cartItemId: Date.now().toString()
        });
    }
    
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    return { success: true, message: 'Đã thêm vào giỏ hàng' };
}

function removeFromCart(cartItemId) {
    let cart = getCart();
    cart = cart.filter(item => item.cartItemId !== cartItemId);
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    return { success: true };
}

function clearCart() {
    localStorage.setItem(CART_KEY, JSON.stringify([]));
}

function getCartTotal() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.totalPrice * item.quantity), 0);
}

function createOrder(orderData) {
    const currentUser = getCurrentUser();
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    
    const newOrder = {
        orderId: 'ORD-' + Date.now(),
        userId: currentUser ? currentUser.id : null,
        customerName: orderData.customerName || (currentUser ? currentUser.fullName : 'Khách'),
        customerPhone: orderData.customerPhone || (currentUser ? currentUser.phoneNumber : ''),
        customerAddress: orderData.customerAddress || (currentUser ? currentUser.address : ''),
        items: orderData.items || [],
        note: orderData.note || '',
        status: 'PENDING',
        totalPrice: orderData.totalPrice || 0,
        discountTotalPrice: orderData.discountTotalPrice || 0,
        voucherCode: orderData.voucherCode || null,
        orderDate: new Date().toISOString()
    };
    
    orders.unshift(newOrder);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    
    clearCart();
    
    return { success: true, order: newOrder };
}

function getUserOrders() {
    const currentUser = getCurrentUser();
    if (!currentUser) return [];
    
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    return orders.filter(o => o.userId === currentUser.id);
}

function getOrderById(orderId) {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    return orders.find(o => o.orderId === orderId);
}

function cancelOrder(orderId) {
    const orders = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
    const orderIndex = orders.findIndex(o => o.orderId === orderId);
    
    if (orderIndex === -1) {
        return { success: false, message: 'Không tìm thấy đơn hàng' };
    }
    
    if (orders[orderIndex].status !== 'PENDING') {
        return { success: false, message: 'Chỉ có thể hủy đơn hàng đang chờ xử lý' };
    }
    
    orders[orderIndex].status = 'CANCELLED';
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    
    return { success: true, message: 'Đơn hàng đã được hủy' };
}

function hasRole(role) {
    const user = getCurrentUser();
    return user && user.role === role;
}

initData();
