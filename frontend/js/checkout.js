document.addEventListener('DOMContentLoaded', () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = 'login.html';
        return;
    }

    const cart = getCart();
    if (cart.length === 0) {
        alert('Keranjang Anda kosong. Silakan tambahkan produk terlebih dahulu.');
        window.location.href = 'index.html';
        return;
    }

    const orderSummaryContainer = document.getElementById('order-summary-items');
    const summarySubtotalElem = document.getElementById('summary-subtotal');
    const summaryTotalElem = document.getElementById('summary-total');
    const checkoutForm = document.getElementById('checkoutForm');
    const messageElem = document.getElementById('message');

    function displayOrderSummary() {
        orderSummaryContainer.innerHTML = '';
        let subtotal = 0;

        cart.forEach(item => {
            const itemTotalPrice = item.price * item.quantity;
            subtotal += itemTotalPrice;

            const itemElement = document.createElement('div');
            itemElement.className = 'flex justify-between items-center text-sm';
            itemElement.innerHTML = `
                <div>
                    <p class="font-semibold">${item.name}</p>
                    <p class="text-gray-500">Qty: ${item.quantity}</p>
                </div>
                <span class="font-medium">${formatRupiah(itemTotalPrice)}</span>
            `;
            orderSummaryContainer.appendChild(itemElement);
        });

        summarySubtotalElem.textContent = formatRupiah(subtotal);
        summaryTotalElem.textContent = formatRupiah(subtotal); // Asumsi ongkir gratis
    }

    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        messageElem.textContent = '';

        const formData = new FormData(checkoutForm);
        const shippingAddress = formData.get('shippingAddress');
        const paymentMethod = formData.get('paymentMethod');
        const userEmail = localStorage.getItem('userEmail');

        if (!shippingAddress || !paymentMethod) {
            messageElem.textContent = 'Harap isi semua kolom yang wajib diisi.';
            messageElem.className = 'text-red-500 mb-4';
            return;
        }

        const orderItems = cart.map(item => ({
            productId: parseInt(item.id),
            quantity: item.quantity,
            price: parseFloat(item.price)
        }));

        const createOrderMutation = {
            query: `
                mutation CreateOrder($input: CreateOrderInput!) {
                    createOrder(input: $input) {
                        id
                        status
                        totalPrice
                    }
                }
            `,
            variables: {
                input: {
                    customerEmail: userEmail,
                    shippingAddress: shippingAddress,
                    paymentMethod: paymentMethod,
                    items: orderItems
                }
            }
        };

        try {
            const response = await fetch('http://localhost:4002/graphql', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(createOrderMutation)
            });

            const result = await response.json();

            if (result.errors) {
                throw new Error(result.errors.map(err => err.message).join(', '));
            }

            if (result.data && result.data.createOrder) {
                messageElem.textContent = 'Pesanan berhasil dibuat! Anda akan diarahkan ke halaman pesanan.';
                messageElem.className = 'text-green-600 font-semibold mb-4';
                
                // Kosongkan keranjang
                saveCart([]);
                updateCartIcon();

                setTimeout(() => {
                    window.location.href = 'orders.html';
                }, 3000);
            } else {
                throw new Error('Gagal membuat pesanan. Respons tidak valid.');
            }

        } catch (error) {
            console.error('Error creating order:', error);
            messageElem.textContent = `Terjadi kesalahan: ${error.message}`;
            messageElem.className = 'text-red-500 mb-4';
        }
    });

    // Initial display
    displayOrderSummary();
});
