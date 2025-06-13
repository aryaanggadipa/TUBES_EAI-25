document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('buatPesananForm');
    if (!form) {
        console.error('Form #buatPesananForm tidak ditemukan.');
        return;
    }

    form.addEventListener('submit', async (event) => {
        event.preventDefault(); // Mencegah submit form standar

        const productId = document.getElementById('productId').value;
        const quantity = document.getElementById('quantity').value;
        const shippingAddress = document.getElementById('shippingAddress').value;
        const notes = document.getElementById('notes').value;
        const authToken = localStorage.getItem('authToken');

        if (!authToken) {
            alert('Anda harus login untuk membuat pesanan.');
            window.location.href = 'login.html';
            return;
        }

        // Validasi sederhana
        if (!productId || !quantity || !shippingAddress) {
            alert('Mohon lengkapi semua field yang wajib diisi (ID Produk, Jumlah, Alamat Pengiriman).');
            return;
        }

        if (isNaN(parseInt(quantity)) || parseInt(quantity) <= 0) {
            alert('Jumlah harus berupa angka positif.');
            return;
        }

        const orderData = {
            productId: productId,
            quantity: parseInt(quantity),
            shippingAddress: shippingAddress,
            notes: notes
        };

        console.log('Data Pesanan:', orderData);
        alert('Pesanan sedang diproses (simulasi). Cek konsol untuk detail.');

        // TODO: Ganti dengan logika API call ke backend service
        // try {
        //     const response = await fetch('URL_API_BUAT_PESANAN', {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //             'Authorization': `Bearer ${authToken}`
        //         },
        //         body: JSON.stringify(orderData)
        //     });

        //     if (response.ok) {
        //         const result = await response.json();
        //         alert('Pesanan berhasil dibuat! ID Pesanan: ' + result.orderId);
        //         // Arahkan ke halaman detail pesanan atau daftar pesanan
        //         // window.location.href = 'orders.html'; 
        //         form.reset(); // Reset form setelah berhasil
        //     } else {
        //         const errorData = await response.json();
        //         alert('Gagal membuat pesanan: ' + (errorData.message || response.statusText));
        //     }
        // } catch (error) {
        //     console.error('Error saat membuat pesanan:', error);
        //     alert('Terjadi kesalahan jaringan atau server. Silakan coba lagi.');
        // }
    });
});
