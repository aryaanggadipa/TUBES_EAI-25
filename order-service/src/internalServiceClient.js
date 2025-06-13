// order-service/src/internalServiceClient.js
`src/internalServiceClient.js`
// Klien untuk berkomunikasi dengan Product Service dan Stock Service
const { GraphQLClient, gql } = require('graphql-request');
require('dotenv').config();

const productServiceUrl = process.env.PRODUCT_SERVICE_URL; // e.g., http://product_service:4001/graphql
const stockServiceUrl = process.env.STOCK_SERVICE_URL;   // e.g., http://stock_service:4004/graphql

if (!productServiceUrl) {
  console.warn('PRODUCT_SERVICE_URL not set. Product fetching will fail or be simulated.');
}
if (!stockServiceUrl) {
  console.warn('STOCK_SERVICE_URL not set. Stock operations will fail or be simulated.');
}

const productClient = productServiceUrl ? new GraphQLClient(productServiceUrl) : null;
const stockClient = stockServiceUrl ? new GraphQLClient(stockServiceUrl) : null;

/**
 * Mengambil detail produk dari Product Service.
 * @param {number} productId - ID produk.
 * @returns {Promise<object|null>} - Detail produk atau null.
 * Contoh: { product_id, product_name, base_price }
 */
async function getProductDetails(productId) {
  if (!productClient) {
    console.warn('Product client not configured. Simulating product details.');
    // Simulasi jika tidak ada endpoint Product Service
    if (productId == 1) return { product_id: productId, product_name: "Simulated Kaos Polos", base_price: 75000.00 };
    if (productId == 2) return { product_id: productId, product_name: "Simulated Kemeja Flanel", base_price: 150000.00 };
    return null;
  }

  // Sesuaikan query ini dengan skema GraphQL Product Service Anda
  const GET_PRODUCT_QUERY = gql`
    query GetProduct($productId: ID!) {
      product(product_id: $productId) {
        product_id
        product_name
        base_price
        # Tambahkan field lain jika perlu
      }
    }
  `;
  try {
    const data = await productClient.request(GET_PRODUCT_QUERY, { productId: String(productId) });
    return data.product;
  } catch (error) {
    console.error(`Error fetching product details for ID ${productId} from Product Service:`, error.message);
    // throw new Error(`Failed to fetch product details: ${error.message}`);
    return null; // Atau throw error agar createOrder gagal
  }
}

/**
 * Memeriksa ketersediaan stok atau langsung mengurangi stok dari Stock Service.
 * @param {number} productId - ID produk.
 * @param {number} quantity - Jumlah yang dibutuhkan/dikurangi.
 * @param {boolean} deductIfAvailable - Jika true, akan mencoba mengurangi stok. Jika false, hanya memeriksa.
 * @returns {Promise<object|null>} - Respons dari Stock Service.
 * Contoh: { product_id, is_available, available_stock, message }
 */
async function checkOrDeductStock(productId, quantity, deductIfAvailable = false) {
  if (!stockClient) {
    console.warn('Stock client not configured. Simulating stock operation.');
    // Simulasi jika tidak ada endpoint Stock Service
    // Anggap stok selalu ada untuk simulasi sederhana
    return { product_id: productId, is_available: true, available_stock: 99, message: "Stock operation simulated successfully." };
  }

  // Anda perlu mendefinisikan query/mutation yang sesuai di Stock Service.
  // Contoh: satu mutation `manageStock` atau query `checkStock` dan mutation `deductStock`.
  // Di sini kita contohkan satu mutation yang bisa handle keduanya.
  const MANAGE_STOCK_MUTATION = gql`
    mutation ManageStockOp($productId: Int!, $quantity: Int!, $operationType: StockOperationType!) {
      manageStock(productId: $productId, quantity: $quantity, operationType: $operationType) {
        product_id
        is_available # True jika operasi (check/deduct) berhasil dan stok cukup
        available_stock # Stok saat ini (setelah deduct jika berhasil)
        message # Pesan tambahan
      }
    }
  `;
  // StockOperationType bisa berupa enum di StockService: CHECK, DEDUCT

  const operationType = deductIfAvailable ? "DEDUCT" : "CHECK";

  try {
    const data = await stockClient.request(MANAGE_STOCK_MUTATION, { 
        productId: parseInt(productId), 
        quantity: parseInt(quantity), 
        operationType 
    });
    // Pastikan path 'data.manageStock' sesuai dengan respons StockService Anda
    if (!data || !data.manageStock) {
        console.error('Invalid response structure from Stock Service for manageStock');
        return { product_id: productId, is_available: false, message: "Invalid response from Stock Service."};
    }
    return data.manageStock;
  } catch (error) {
    console.error(`Error during stock operation (${operationType}) for product ${productId} from Stock Service:`, error.message);
    return { product_id: productId, is_available: false, message: `Stock Service error: ${error.message}` };
  }
}

module.exports = {
  getProductDetails,
  checkOrDeductStock,
};