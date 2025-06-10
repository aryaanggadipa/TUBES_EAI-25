// production-request-service/src/manufacturingClient.js
`src/manufacturingClient.js`
// Klien untuk berkomunikasi dengan Sistem Manufaktur Kelompok 3
const { GraphQLClient, gql } = require('graphql-request');
require('dotenv').config();

const manufacturingSystemGraphQLEndpoint = process.env.MANUFACTURING_GRAPHQL_ENDPOINT;

if (!manufacturingSystemGraphQLEndpoint) {
  console.warn(
    'MANUFACTURING_GRAPHQL_ENDPOINT environment variable is not set. ' +
    'Communication with the external manufacturing system will be simulated or will fail.'
  );
}

const client = manufacturingSystemGraphQLEndpoint 
  ? new GraphQLClient(manufacturingSystemGraphQLEndpoint)
  : null;

/**
 * Mengirim permintaan produksi ke sistem manufaktur Kelompok 3.
 * @param {object} requestDetails - Detail permintaan.
 * @param {number} requestDetails.product_id - ID produk.
 * @param {number} requestDetails.quantity - Jumlah yang diminta.
 * @returns {Promise<object|null>} - Respons dari sistem manufaktur Kelompok 3.
 * Contoh respons yang diharapkan: { production_id: "123", status: "PENDING", start_date: "...", end_date: "..." }
 */
async function sendProductionRequestToManufacturingSystem(requestDetails) {
  if (!client) {
    console.warn('Manufacturing client not configured. Simulating successful request.');
    // Simulasi respons jika endpoint tidak ada
    return {
      production_id: `SIM_BATCH_${Math.floor(Math.random() * 1000)}`,
      status: 'SIMULATED_PENDING',
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  }

  // == PENYESUAIAN DENGAN SKEMA KELOMPOK 3 ==
  // Mutation ini disesuaikan dengan skema GraphQL dari sistem manufaktur teman Anda.
  const CREATE_PRODUCTION_MUTATION = gql`
    mutation CreateProduction($product_id: Int!, $quantity: Int!) {
      createProduction(product_id: $product_id, quantity: $quantity) {
        production_id
        status
        start_date
        end_date
      }
    }
  `;

  // Variabel disesuaikan dengan argumen yang dibutuhkan oleh mutasi 'createProduction'.
  const variables = {
    product_id: parseInt(requestDetails.product_id), // Pastikan tipe data benar (Int)
    quantity: parseInt(requestDetails.quantity)      // Pastikan tipe data benar (Int)
  };
  // ==========================================

  try {
    console.log(`Sending 'createProduction' request to manufacturing system: ${JSON.stringify(variables)}`);
    // 'client.request' akan mengirim permintaan GraphQL ke endpoint yang dikonfigurasi.
    const data = await client.request(CREATE_PRODUCTION_MUTATION, variables);
    console.log('Response from manufacturing system:', data);
    
    // Kembalikan data dari 'createProduction' yang ada di dalam respons
    return data.createProduction;

  } catch (error) {
    console.error('Error sending production request to manufacturing system:', error.message);
    // Melempar error agar resolver bisa menanganinya.
    throw new Error(`Failed to send request to manufacturing system: ${error.message}`);
  }
}

module.exports = {
  sendProductionRequestToManufacturingSystem,
};