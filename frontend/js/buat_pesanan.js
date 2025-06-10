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

async function handleCreateOrder(cart, token) {
    const shippingAddress = document.getElementById('shippingAddress').value.trim();
    const notes = document.getElementById('notes').value.trim();
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
    const messageDiv = document.getElementById('message');

    if (!shippingAddress) {
        alert('Alamat pengiriman harus diisi.');
        return;
    }
    if (!paymentMethod) {
        alert('Metode pembayaran harus dipilih.');
        return;
    }

    const orderDetails = cart.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price
    }));

    const graphqlQuery = {
        query: `
            mutation CreateNewOrder($input: CreateOrderInput!) {
                createOrder(input: $input) {
                    order_id
                    status
                    total_amount
                }
            }
        `,
        variables: {
            input: {
                order_details: orderDetails,
                shipping_address: shippingAddress,
                payment_method: paymentMethod.value,
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
            const errorMessage = responseBody.errors[0].message || 'Gagal membuat pesanan.';
            throw new Error(errorMessage);
        }

        const orderData = responseBody.data.createOrder;
        if (orderData && orderData.order_id) {
            messageDiv.innerHTML = `<p class="text-green-500">Pesanan berhasil dibuat! ID Pesanan: ${orderData.order_id}. Anda akan dialihkan ke halaman riwayat pesanan.</p>`;
            
            // Kosongkan keranjang setelah pesanan berhasil
            localStorage.removeItem('cart');
            updateCartIcon(); // Fungsi dari cart.js (jika tersedia global)

            setTimeout(() => {
                window.location.href = 'orders.html';
            }, 4000);
        } else {
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
