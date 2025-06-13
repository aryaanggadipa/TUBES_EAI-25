// Fungsi pembantu dari cart.js (bisa di-refactor menjadi modul bersama nanti)
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
}

function getCart() {
    return JSON.parse(localStorage.getItem('cart')) || [];
}

document.addEventListener('DOMContentLoaded', () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        // Jika tidak login, paksa kembali ke halaman login
        window.location.href = 'login.html';
        return;
    }

    const cart = getCart();
    if (cart.length === 0) {
        // Jika keranjang kosong, kembali ke halaman utama
        alert('Keranjang Anda kosong. Tidak dapat membuat pesanan.');
        window.location.href = 'index.html';
        return;
    }

    displayOrderSummary(cart);

    const checkoutForm = document.getElementById('checkoutForm');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', (event) => {
            event.preventDefault();
            handleCreateOrder(cart, authToken);
        });
    }
});

function displayOrderSummary(cart) {
    const summaryContainer = document.getElementById('order-summary-items');
    const subtotalElement = document.getElementById('summary-subtotal');
    const totalElement = document.getElementById('summary-total');

    if (!summaryContainer || !subtotalElement || !totalElement) return;

    summaryContainer.innerHTML = ''; // Kosongkan kontainer
    let subtotal = 0;

    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'flex justify-between items-center text-sm';
        itemElement.innerHTML = `
            <div>
                <p class="font-semibold">${item.name} (x${item.quantity})</p>
                <p class="text-gray-600">${formatRupiah(item.price)}</p>
            </div>
            <p class="font-medium">${formatRupiah(item.price * item.quantity)}</p>
        `;
        summaryContainer.appendChild(itemElement);
        subtotal += item.price * item.quantity;
    });

    subtotalElement.textContent = formatRupiah(subtotal);
    totalElement.textContent = formatRupiah(subtotal); // Asumsi ongkir gratis
}

// Helper function to decode JWT to get user info
function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        console.error("Failed to decode JWT:", e);
        return null;
    }
}

async function handleCreateOrder(cart, token) {
    const shippingAddress = document.getElementById('shippingAddress').value.trim();
    const notes = document.getElementById('notes').value.trim();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    const messageDiv = document.getElementById('message');

    // Decode token to get user email
    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.email) {
        alert('Sesi tidak valid atau email tidak ditemukan. Silakan login kembali.');
        window.location.href = 'login.html';
        return;
    }
    const customerEmail = decodedToken.email;

    if (!shippingAddress) {
        alert('Alamat pengiriman harus diisi.');
        return;
    }
    if (!paymentMethod) {
        alert('Metode pembayaran harus dipilih.');
        return;
    }

    // Align with the new schema's OrderItemInput
    const orderItems = cart.map(item => ({
        productId: parseInt(item.id, 10), // Ensure productId is an integer
        quantity: item.quantity,
        price: item.price
    }));

    const graphqlQuery = {
        query: `
            mutation CreateNewOrder($input: CreateOrderInput!) {
                createOrder(input: $input) {
                    id
                    status
                    totalPrice
                }
            }
        `,
        variables: {
            input: {
                customerEmail: customerEmail,
                items: orderItems,
                shippingAddress: shippingAddress,
                paymentMethod: paymentMethod.value,
                notes: notes
            }
        }
    };

    try {
        const response = await fetch('http://localhost:4002/graphql', { // Endpoint order-service
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(graphqlQuery)
        });

        const responseBody = await response.json();

        if (responseBody.errors) {
            console.error("GraphQL Errors:", responseBody.errors);
            const errorMessage = responseBody.errors[0].message || 'Gagal membuat pesanan.';
            throw new Error(errorMessage);
        }

        const orderData = responseBody.data.createOrder;
        // Check for the new 'id' field
        if (orderData && orderData.id) {
            messageDiv.innerHTML = `<p class="text-green-500">Pesanan berhasil dibuat! ID Pesanan: ${orderData.id}. Anda akan dialihkan ke halaman riwayat pesanan.</p>`;
            
            localStorage.removeItem('cart');
            updateCartIcon();

            setTimeout(() => {
                window.location.href = 'orders.html';
            }, 4000);
        } else {
            console.error("Invalid response from server:", responseBody);
            throw new Error('Respons tidak valid dari server.');
        }

    } catch (error) {
        console.error('Error creating order:', error);
        messageDiv.innerHTML = `<p class="text-red-500">Terjadi kesalahan: ${error.message}</p>`;
    }
}

// Fungsi ini perlu didefinisikan atau diimpor jika tidak tersedia secara global
function updateCartIcon() {
    const cartCountElements = document.querySelectorAll('#cart-icon-count');
    cartCountElements.forEach(element => {
        element.textContent = '0';
        element.style.display = 'none';
    });
}
