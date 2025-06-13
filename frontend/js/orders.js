// Helper functions
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

function getStatusBadge(status) {
    const statuses = {
        'PENDING': 'bg-yellow-100 text-yellow-700',
        'PAID': 'bg-blue-100 text-blue-700',
        'SHIPPED': 'bg-purple-100 text-purple-700',
        'COMPLETED': 'bg-green-100 text-green-700',
        'CANCELLED': 'bg-red-100 text-red-700',
    };
    const badgeClass = statuses[status] || 'bg-gray-100 text-gray-700';
    return `<span class="mt-2 sm:mt-0 px-3 py-1 text-sm font-medium rounded-full ${badgeClass}">${status}</span>`;
}

function parseJwt(token) {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = 'login.html';
        return;
    }
    await fetchAndDisplayOrders(authToken);
});

async function fetchAndDisplayOrders(token) {
    const container = document.getElementById('order-list');
    const noOrdersMessage = document.getElementById('no-orders-message');
    if (!container || !noOrdersMessage) return;

    container.innerHTML = '<p class="text-center text-gray-500">Memuat riwayat pesanan...</p>';

    const decodedToken = parseJwt(token);
    if (!decodedToken || !decodedToken.email) {
        container.innerHTML = '<p class="text-center text-red-500">Sesi tidak valid. Silakan login kembali.</p>';
        return;
    }

    const graphqlQuery = {
        query: `
            query GetOrdersByCustomer($email: String!) {
                ordersByCustomer(email: $email) {
                    id
                    orderDate
                    status
                    totalPrice
                    shippingAddress
                    paymentMethod
                    notes
                    items {
                        productId
                        quantity
                        price
                    }
                }
            }
        `,
        variables: {
            email: decodedToken.email
        }
    };

    try {
        const response = await fetch('http://localhost:4002/graphql', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(graphqlQuery)
        });

        const body = await response.json();
        if (body.errors) throw new Error(body.errors.map(e => e.message).join(', '));

        const orders = body.data.ordersByCustomer;
        container.innerHTML = '';

        if (!orders || orders.length === 0) {
            noOrdersMessage.classList.remove('hidden');
        } else {
            orders.sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));
            orders.forEach(order => container.appendChild(createOrderCard(order)));
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        container.innerHTML = `<p class="text-center text-red-500">Terjadi kesalahan saat memuat pesanan: ${error.message}</p>`;
    }
}

function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'bg-white p-6 rounded-lg shadow-md';

    // Note: We don't have product names here, would require another service call.
    const productDetailsHtml = order.items.map(item => `
        <li>Produk ID: ${item.productId} (x${item.quantity}) - ${formatRupiah(item.price)}</li>
    `).join('');

    card.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
                <h2 class="text-xl font-semibold text-indigo-700">Pesanan #${order.id}</h2>
                <p class="text-sm text-gray-500">Tanggal: ${formatDate(order.orderDate)}</p>
            </div>
            ${getStatusBadge(order.status)}
        </div>
        <div class="border-t border-gray-200 pt-4">
            <p class="text-gray-700"><span class="font-medium">Total Pembayaran:</span> ${formatRupiah(order.totalPrice)}</p>
            <p class="text-gray-700"><span class="font-medium">Alamat Pengiriman:</span> ${order.shippingAddress}</p>
            <p class="text-gray-700"><span class="font-medium">Metode Pembayaran:</span> ${order.paymentMethod}</p>
            ${order.notes ? `<p class="text-gray-700"><span class="font-medium">Catatan:</span> ${order.notes}</p>` : ''}
            <div class="mt-4">
                <h4 class="font-medium text-gray-800 mb-2">Detail Produk:</h4>
                <ul class="list-disc list-inside text-gray-600 text-sm space-y-1">
                    ${productDetailsHtml}
                </ul>
            </div>
        </div>
    `;
    return card;
}
