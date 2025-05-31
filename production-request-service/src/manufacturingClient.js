// production-request-service/src/manufacturingClient.js
`src/manufacturingClient.js`
// Klien untuk berkomunikasi dengan Sistem Manufaktur (Kelompok 3)
const { GraphQLClient, gql } = require('graphql-request');
require('dotenv').config();

const manufacturingSystemGraphQLEndpoint = process.env.MANUFACTURING_GRAPHQL_ENDPOINT;

if (!manufacturingSystemGraphQLEndpoint) {
  console.warn(
    'MANUFACTURING_GRAPHQL_ENDPOINT environment variable is not set. ' +
    'Communication with the external manufacturing system will be simulated or will fail.'
  );
}

// Inisialisasi GraphQLClient hanya jika endpoint ada
const client = manufacturingSystemGraphQLEndpoint 
  ? new GraphQLClient(manufacturingSystemGraphQLEndpoint, {
      // headers: { // Tambahkan header jika dibutuhkan oleh sistem manufaktur
      //   Authorization: `Bearer ${process.env.MANUFACTURING_API_TOKEN}`,
      // },
    })
  : null;

/**
 * Mengirim permintaan produksi ke sistem manufaktur eksternal.
 * @param {object} requestDetails - Detail permintaan.
 * @param {number} requestDetails.internal_request_id - ID permintaan dari sistem kita.
 * @param {number} requestDetails.product_id - ID produk.
 * @param {number} requestDetails.quantity - Jumlah yang diminta.
 * @param {string} [requestDetails.product_name] - Nama produk (opsional, jika dibutuhkan manufaktur).
 * @param {string} [requestDetails.design_details] - Detail desain (opsional, jika dibutuhkan manufaktur).
 * @returns {Promise<object|null>} - Respons dari sistem manufaktur atau null jika gagal.
 * Contoh respons: { batchId: "B123", status: "ACCEPTED", estimatedCompletionDate: "2025-12-31" }
 */
async function sendProductionRequestToManufacturingSystem(requestDetails) {
  if (!client) {
    console.warn('Manufacturing client is not configured. Simulating successful request.');
    // Simulasi respons jika tidak ada endpoint
    return {
      batchId: `SIM_BATCH_${requestDetails.internal_request_id}`,
      status: 'SIMULATED_ACCEPTED',
      estimatedCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 hari dari sekarang
    };
  }

  // Sesuaikan query/mutation ini dengan skema GraphQL sistem manufaktur Kelompok 3
  const MUTATION_CREATE_PRODUCTION_ORDER = gql`
    mutation SubmitProductionOrder($orderInput: ManufacturerProductionOrderInput!) {
      submitProductionOrder(input: $orderInput) {
        batchId         # ID batch dari sistem manufaktur
        status          # Status penerimaan (misalnya, ACCEPTED, REJECTED, PENDING)
        estimatedCompletionDate # Estimasi tanggal selesai (format YYYY-MM-DD)
        # ... field lain yang dikembalikan oleh sistem manufaktur
      }
    }
  `;

  // Sesuaikan variabel ini dengan apa yang diharapkan oleh input ManufacturerProductionOrderInput
  const variables = {
    orderInput: {
      marketplaceRequestId: String(requestDetails.internal_request_id), // Mengirim ID internal kita
      productId: String(requestDetails.product_id), // Pastikan tipe data sesuai (String/Int)
      quantity: requestDetails.quantity,
      // productName: requestDetails.product_name, // Jika diperlukan
      // designDetails: requestDetails.design_details, // Jika diperlukan
      // ... field lain yang dibutuhkan sistem manufaktur
    },
  };

  try {
    console.log(`Sending production request to manufacturing system: ${JSON.stringify(variables)}`);
    const data = await client.request(MUTATION_CREATE_PRODUCTION_ORDER, variables);
    console.log('Response from manufacturing system:', data);
    return data.submitProductionOrder; // Sesuaikan dengan path respons yang benar
  } catch (error) {
    console.error('Error sending production request to manufacturing system:', error.message);
    // Anda bisa melempar error spesifik atau mengembalikan null/objek error
    // throw new Error(`Failed to send request to manufacturing: ${error.message}`);
    return null; // Atau return objek error yang bisa ditangani resolver
  }
}

module.exports = {
  sendProductionRequestToManufacturingSystem,
};