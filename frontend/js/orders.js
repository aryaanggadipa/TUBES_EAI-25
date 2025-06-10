// Fungsi pembantu untuk memformat mata uang
function formatRupiah(number) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(number);
}

// Fungsi untuk memformat tanggal
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Fungsi untuk mendapatkan status pesanan dengan gaya
function getStatusBadge(status) {
    switch (status) {
        case 'PENDING':
            return '<span class="mt-2 sm:mt-0 px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-700">Menunggu Pembayaran</span>';
        case 'PAID':
            return '<span class="mt-2 sm:mt-0 px-3 py-1 text-sm font-medium rounded-full bg-blue-100 text-blue-700">Dibayar</span>';
        case 'SHIPPED':
            return '<span class="mt-2 sm:mt-0 px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-700">Dalam Pengiriman</span>';
        case 'COMPLETED':
            return '<span class="mt-2 sm:mt-0 px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-700">Selesai</span>';
        case 'CANCELLED':
            return '<span class="mt-2 sm:mt-0 px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-700">Dibatalkan</span>';
        default:
            return `<span class="mt-2 sm:mt-0 px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-700">${status}</span>`;
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
    const orderListContainer = document.getElementById('order-list');
    const noOrdersMessage = document.getElementById('no-orders-message');

    if (!orderListContainer || !noOrdersMessage) return;

    // Tampilkan placeholder loading
    orderListContainer.innerHTML = '<p class="text-center text-gray-500">Memuat riwayat pesanan...</p>';

    const graphqlQuery = {
        query: `
            query GetUserOrders {
                getOrdersByUser {
                    order_id
                    user_id
                    order_date
                    total_amount
                    status
                    shipping_address
                    payment_method
                    notes
                    order_details {
                        product_id
                        quantity
                        unit_price
                        product_name
                    }
                }
            }
        `
    };

    try {
        const response = await fetch('http://localhost:4002/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(graphqlQuery)
        });

        const responseBody = await response.json();

        if (responseBody.errors) {
            throw new Error(responseBody.errors[0].message || 'Gagal mengambil data pesanan.');
        }

        const orders = responseBody.data.getOrdersByUser;
        orderListContainer.innerHTML = ''; // Kosongkan loading

        if (!orders || orders.length === 0) {
            noOrdersMessage.classList.remove('hidden');
        } else {
            orders.sort((a, b) => new Date(b.order_date) - new Date(a.order_date)); // Urutkan dari terbaru
            orders.forEach(order => {
                const orderCard = createOrderCard(order);
                orderListContainer.appendChild(orderCard);
            });
        }

    } catch (error) {
        console.error('Error fetching orders:', error);
        orderListContainer.innerHTML = `<p class="text-center text-red-500">Terjadi kesalahan saat memuat pesanan: ${error.message}</p>`;
    }
}

function createOrderCard(order) {
    const card = document.createElement('div');
    card.className = 'bg-white p-6 rounded-lg shadow-md';

    const productDetailsHtml = order.order_details.map(detail => `
        <li>${detail.product_name || `Produk ID: ${detail.product_id}`} (x${detail.quantity}) - ${formatRupiah(detail.unit_price)}</li>
    `).join('');

    card.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <div>
                <h2 class="text-xl font-semibold text-indigo-700">Pesanan #${order.order_id.substring(0, 8)}...</h2>
                <p class="text-sm text-gray-500">Tanggal: ${formatDate(order.order_date)}</p>
            </div>
            ${getStatusBadge(order.status)}
        </div>
        <div class="border-t border-gray-200 pt-4">
            <p class="text-gray-700"><span class="font-medium">Total Pembayaran:</span> ${formatRupiah(order.total_amount)}</p>
            <p class="text-gray-700"><span class="font-medium">Alamat Pengiriman:</span> ${order.shipping_address}</p>
            <p class="text-gray-700"><span class="font-medium">Metode Pembayaran:</span> ${order.payment_method}</p>
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
