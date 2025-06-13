// Fungsi untuk memformat angka menjadi format mata uang Rupiah (IDR)
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
}

// Fungsi untuk mendapatkan keranjang dari localStorage
function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

// Fungsi untuk menyimpan keranjang ke localStorage
function saveCart(cart) {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartIcon();
}

// Fungsi global untuk menambahkan item ke keranjang
window.addToCart = function(product) {
    const cart = getCart();
    const existingProductIndex = cart.findIndex(item => item.id === product.id);

    if (existingProductIndex > -1) {
        // Jika produk sudah ada, tambahkan kuantitasnya
        cart[existingProductIndex].quantity += 1;
    } else {
        // Jika produk baru, tambahkan ke keranjang
        cart.push({ ...product, quantity: 1 });
    }

    saveCart(cart);
    alert(`'${product.name}' telah ditambahkan ke keranjang!`);
}

// Fungsi untuk memperbarui ikon jumlah item di keranjang pada navbar
function updateCartIcon() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Cari semua elemen ikon keranjang (untuk desktop dan mobile)
    const cartCountElements = document.querySelectorAll('#cart-icon-count');
    
    cartCountElements.forEach(element => {
        if (totalItems > 0) {
            element.textContent = totalItems;
            element.style.display = 'inline-block'; // Tampilkan jika ada item
        } else {
            element.style.display = 'none'; // Sembunyikan jika kosong
        }
    });
}

// Fungsi untuk menampilkan item keranjang di halaman keranjang.html
function displayCartItems() {
    const cart = getCart();
    const itemsContainer = document.getElementById('cart-items-container');
    const cartSummary = document.getElementById('cart-summary');
    const cartTotalElement = document.getElementById('cart-total');

    if (!itemsContainer) return; // Hanya berjalan di halaman keranjang

    itemsContainer.innerHTML = ''; // Kosongkan kontainer

    if (cart.length === 0) {
        itemsContainer.innerHTML = '<p class="text-gray-600 text-center py-4">Keranjang Anda kosong.</p>';
        if (cartSummary) cartSummary.style.display = 'none';
        return;
    }

    if (cartSummary) cartSummary.style.display = 'block';

    let total = 0;
    cart.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'flex items-center justify-between py-4 border-b';
        itemElement.innerHTML = `
            <div class="flex items-center space-x-4">
                <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-md">
                <div>
                    <p class="font-semibold text-gray-800">${item.name}</p>
                    <p class="text-sm text-gray-600">${formatRupiah(item.price)}</p>
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <input type="number" value="${item.quantity}" min="1" class="w-16 text-center border rounded-md p-1 quantity-input" data-index="${index}">
                <p class="font-semibold w-24 text-right">${formatRupiah(item.price * item.quantity)}</p>
                <button class="text-red-500 hover:text-red-700 remove-item" data-index="${index}">&times;</button>
            </div>
        `;
        itemsContainer.appendChild(itemElement);
        total += item.price * item.quantity;
    });

    if (cartTotalElement) cartTotalElement.textContent = formatRupiah(total);

    // Tambahkan event listener untuk input kuantitas dan tombol hapus
    addCartEventListeners();

    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            window.location.href = 'buat_pesanan.html';
        });
    }
}

// Fungsi untuk menambahkan event listener pada item di keranjang
function addCartEventListeners() {
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const index = e.target.dataset.index;
            const newQuantity = parseInt(e.target.value);
            updateQuantity(index, newQuantity);
        });
    });

    document.querySelectorAll('.remove-item').forEach(button => {
        button.addEventListener('click', (e) => {
            const index = e.target.dataset.index;
            removeItem(index);
        });
    });
}

// Fungsi untuk memperbarui kuantitas item
function updateQuantity(index, quantity) {
    const cart = getCart();
    if (quantity > 0) {
        cart[index].quantity = quantity;
    } else {
        // Hapus item jika kuantitas 0 atau kurang
        cart.splice(index, 1);
    }
    saveCart(cart);
    displayCartItems(); // Render ulang keranjang
}

// Fungsi untuk menghapus item dari keranjang
function removeItem(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    displayCartItems(); // Render ulang keranjang
}


// Event listener utama yang berjalan saat DOM siap
document.addEventListener('DOMContentLoaded', () => {
    updateCartIcon(); // Perbarui ikon saat halaman dimuat
    if (window.location.pathname.endsWith('keranjang.html')) {
        displayCartItems(); // Tampilkan item jika di halaman keranjang
    }

    const checkoutButton = document.getElementById('checkout-button');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            // Cek apakah keranjang kosong sebelum ke halaman checkout
            const cart = getCart();
            if (cart.length === 0) {
                alert('Keranjang Anda kosong. Silakan tambahkan produk terlebih dahulu.');
                return;
            }
            window.location.href = 'buat_pesanan.html';
        });
    }
});
