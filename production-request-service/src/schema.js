// production-request-service/src/schema.js
`src/schema.js`
// GraphQL Schema Definition
const { gql } = require('graphql-tag');

const typeDefs = gql`
  scalar DateTime

  type ProductionRequest {
    request_id: ID!
    product_id: Int!
    quantity_requested: Int!
    request_sent_timestamp: DateTime!
    manufacturer_batch_id: String
    manufacturer_status_ack: String # e.g., 'ACCEPTED', 'REJECTED_CAPACITY_FULL', 'PENDING_CONFIRMATION'
    estimated_completion_date: String # Store as DATE in DB, represent as String (e.g., YYYY-MM-DD)
    last_response_from_manufacturer: DateTime
  }

  input CreateProductionRequestInput {
    product_id: Int!
    quantity_requested: Int!
    # Detail produk dan desain bisa ditambahkan di sini jika perlu dikirim ke manufaktur
    # product_name: String 
    # design_details: String 
  }

  input UpdateProductionRequestInput {
    request_id: ID!
    manufacturer_batch_id: String
    manufacturer_status_ack: String
    estimated_completion_date: String # YYYY-MM-DD
  }

  type Query {
    productionRequest(request_id: ID!): ProductionRequest
    allProductionRequests: [ProductionRequest]
    productionRequestsByStatus(status: String!): [ProductionRequest]
  }

  type Mutation {
    createProductionRequest(input: CreateProductionRequestInput!): ProductionRequest
    # Mutation ini untuk internal update setelah mendapat feedback dari manufaktur
    updateProductionRequestFromManufacturer(input: UpdateProductionRequestInput!): ProductionRequest
  }
`;

module.exports = typeDefs;