// production-request-service/src/schema.js
`src/schema.js`
// Skema GraphQL tidak banyak berubah, karena ini adalah API internal Anda.
// Perubahan utama ada pada logika resolver dan client.
const { gql } = require('graphql-tag');

const typeDefs = gql`
  scalar DateTime

  type ProductionRequest {
    request_id: ID!
    product_id: Int!
    quantity_requested: Int!
    request_sent_timestamp: DateTime!
    # ID dari sistem manufaktur Kelompok 3
    manufacturer_batch_id: String
    # Status dari sistem manufaktur Kelompok 3
    manufacturer_status_ack: String 
    # Estimasi tanggal selesai dari sistem manufaktur Kelompok 3
    estimated_completion_date: String
    last_response_from_manufacturer: DateTime
  }

  input CreateProductionRequestInput {
    product_id: Int!
    quantity_requested: Int!
  }

  # Input ini bisa digunakan jika ada callback/webhook dari sistem manufaktur
  # untuk memperbarui status di sistem kita.
  input UpdateProductionRequestStatusInput {
    request_id: ID! # ID permintaan di sistem kita
    manufacturer_batch_id: String! # ID produksi dari sistem manufaktur
    new_status: String!
    estimated_completion_date: String
  }

  type Query {
    productionRequest(request_id: ID!): ProductionRequest
    allProductionRequests: [ProductionRequest]
  }

  type Mutation {
    # Mutation utama untuk membuat permintaan produksi baru.
    # Ini akan dipanggil oleh Stock Service Anda.
    createProductionRequest(input: CreateProductionRequestInput!): ProductionRequest
  }
`;

module.exports = typeDefs;