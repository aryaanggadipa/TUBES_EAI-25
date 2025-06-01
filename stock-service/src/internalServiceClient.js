// stock-service/src/internalServiceClient.js
`src/internalServiceClient.js`
// Klien untuk berkomunikasi dengan Production Request Service dan Sistem Manufaktur Eksternal
const { GraphQLClient, gql } = require('graphql-request');
require('dotenv').config();

// URL untuk layanan internal (Production Request Service)
const productionRequestServiceUrl = process.env.PRODUCTION_REQUEST_SERVICE_URL; // e.g., http://production_request_service:4003/graphql

// URL untuk sistem manufaktur eksternal (Kelompok 3)
const manufacturingSystemGraphQLEndpoint = process.env.MANUFACTURING_GRAPHQL_ENDPOINT;

if (!productionRequestServiceUrl) {
  console.warn('PRODUCTION_REQUEST_SERVICE_URL not set. Restock requests will fail or be simulated.');
}
if (!manufacturingSystemGraphQLEndpoint) {
  console.warn('MANUFACTURING_GRAPHQL_ENDPOINT not set. External manufacturing communication will be simulated or will fail.');
}

const prodRequestClient = productionRequestServiceUrl ? new GraphQLClient(productionRequestServiceUrl) : null;
const manufacturingClient = manufacturingSystemGraphQLEndpoint ? new GraphQLClient(manufacturingSystemGraphQLEndpoint) : null;

/**
 * Meminta restock ke Production Request Service.
 * @param {number} productId - ID produk yang perlu di-restock.
 * @param {number} quantityToRequest - Jumlah yang ingin diminta.
 * @returns {Promise<object|null>} - Respons dari Production Request Service atau null.
 */
async function requestRestock(productId, quantityToRequest) {
  if (!prodRequestClient) {
    console.warn('Production Request client not configured. Simulating restock request.');
    return { success: true, message: `Simulated restock request for product ${productId}, quantity ${quantityToRequest}.` };
  }

  // Sesuaikan query/mutation ini dengan skema GraphQL Production Request Service Anda
  const CREATE_PRODUCTION_REQUEST_MUTATION = gql`
    mutation CreateProdRequest($input: CreateProductionRequestInput!) {
      createProductionRequest(input: $input) {
        request_id
        product_id
        quantity_requested
        manufacturer_status_ack
      }
    }
  `;

  try {
    const data = await prodRequestClient.request(CREATE_PRODUCTION_REQUEST_MUTATION, {
      input: {
        product_id: productId,
        quantity_requested: quantityToRequest,
      }
    });
    console.log(`Restock request sent for product ${productId}:`, data.createProductionRequest);
    return data.createProductionRequest;
  } catch (error) {
    console.error(`Error sending restock request for product ${productId}:`, error.message);
    return null;
  }
}

/**
 * (Opsional) Mengambil status progres produksi dari sistem manufaktur eksternal.
 * @param {string} manufacturerBatchId - ID batch dari sistem manufaktur.
 * @returns {Promise<object|null>} - Status produksi atau null.
 */
async function getProductionStatusFromManufacturing(manufacturerBatchId) {
  if (!manufacturingClient) {
    console.warn('Manufacturing client (external) not configured. Simulating production status.');
    return { batchId: manufacturerBatchId, status: "SIMULATED_IN_PROGRESS", currentProgress: "50%", estimatedCompletionDate: "2025-12-01" };
  }

  // Sesuaikan query ini dengan skema GraphQL sistem manufaktur Kelompok 3
  const GET_BATCH_STATUS_QUERY = gql`
    query GetMfgBatchStatus($batchId: ID!) {
      productionBatchStatus(batchId: $batchId) { # Ganti dengan nama query yang benar
        status
        currentProgress
        estimatedCompletionDate
        # ... field lain yang relevan
      }
    }
  `;

  try {
    const data = await manufacturingClient.request(GET_BATCH_STATUS_QUERY, { batchId: manufacturerBatchId });
    // Ganti 'data.productionBatchStatus' dengan path yang benar
    return data.productionBatchStatus; 
  } catch (error) {
    console.error(`Error fetching production status for batch ${manufacturerBatchId} from external manufacturing system:`, error.message);
    return null;
  }
}

module.exports = {
  requestRestock,
  getProductionStatusFromManufacturing,
};