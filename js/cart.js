document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items-container');
    const cartSummary = document.getElementById('cart-summary');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutButton = document.getElementById('checkout-button');

    // Load cart from localStorage or initialize an empty array
    let cart = JSON.parse(localStorage.getItem('shoppingCart')) || [];

    function saveCart() {
        localStorage.setItem('shoppingCart', JSON.stringify(cart));
    }

    function renderCart() {
        if (!cartItemsContainer) return; // Only render if on cart page

        cartItemsContainer.innerHTML = ''; // Clear previous items

        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p class="text-gray-600 text-center py-4">Keranjang Anda kosong.</p>';
            if (cartSummary) cartSummary.style.display = 'none';
            return;
        }

        if (cartSummary) cartSummary.style.display = 'block';
        let total = 0;

        cart.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'flex justify-between items-center border-b py-3';
            itemElement.innerHTML = `
                <div class="flex items-center">
                    <img src="${item.image || 'https://via.placeholder.com/50'}" alt="${item.name}" class="w-16 h-16 object-cover rounded mr-4">
                    <div>
                        <h3 class="font-semibold">${item.name}</h3>
                        <p class="text-sm text-gray-500">Harga: Rp ${item.price.toLocaleString('id-ID')}</p>
                    </div>
                </div>
                <div class="flex items-center">
                    <input type="number" value="${item.quantity}" min="1" class="w-16 text-center border rounded p-1 mx-2 quantity-input" data-index="${index}">
                    <p class="w-24 text-right font-semibold">Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</p>
                    <button class="ml-4 text-red-500 hover:text-red-700 remove-item" data-index="${index}">&times;</button>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
            total += item.price * item.quantity;
        });

        if (cartTotalElement) cartTotalElement.textContent = `Rp ${total.toLocaleString('id-ID')}`;

        // Add event listeners for quantity changes and item removal
        document.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', updateQuantity);
        });
        document.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', removeItem);
        });
    }

    function updateQuantity(event) {
        const index = parseInt(event.target.dataset.index);
        const newQuantity = parseInt(event.target.value);
        if (newQuantity > 0) {
            cart[index].quantity = newQuantity;
        } else {
            // If quantity is 0 or less, remove the item
            cart.splice(index, 1);
        }
        saveCart();
        renderCart();
        updateCartIcon(); // Update cart icon count if it exists
    }

    function removeItem(event) {
        const index = parseInt(event.target.dataset.index);
        cart.splice(index, 1);
        saveCart();
        renderCart();
        updateCartIcon(); // Update cart icon count if it exists
    }

    // Function to add item to cart (will be called from product pages)
    window.addToCart = function(product) {
        const existingItemIndex = cart.findIndex(item => item.id === product.id);
        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += product.quantity || 1;
        } else {
            cart.push({...product, quantity: product.quantity || 1});
        }
        saveCart();
        alert(`${product.name} telah ditambahkan ke keranjang!`);
        updateCartIcon(); // Update cart icon count if it exists
    }

    // Function to update cart icon (e.g., in navbar)
    window.updateCartIcon = function() {
        const cartIcon = document.getElementById('cart-icon-count');
        if (cartIcon) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartIcon.textContent = totalItems;
            cartIcon.style.display = totalItems > 0 ? 'inline-block' : 'none';
        }
    }

    if (checkoutButton) {
        checkoutButton.addEventListener('click', () => {
            if (cart.length === 0) {
                alert('Keranjang Anda kosong. Silakan tambahkan produk terlebih dahulu.');
                return;
            }
            // Simulate checkout
            alert('Proses checkout dimulai (simulasi). Pesanan akan dikirim ke backend.');
            console.log('Checkout:', cart);
            // TODO: Implement actual checkout logic (e.g., redirect to payment, API call)
            // cart = []; // Clear cart after successful checkout (optional here)
            // saveCart();
            // renderCart();
            // updateCartIcon();
            // window.location.href = 'orders.html'; // Or a thank you page
        });
    }

    // Initial render of the cart on cart page and update icon on all pages
    if (cartItemsContainer) {
        renderCart();
    }
    updateCartIcon(); // Ensure cart icon is updated on page load
});
