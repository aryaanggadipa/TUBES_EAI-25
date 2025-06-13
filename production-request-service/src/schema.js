
const typeDefs = `#graphql
  scalar DateTime

  enum Priority {
    low
    normal
    high
    urgent
  }

  enum Status {
    received
    planned
    in_production
    completed
    cancelled
  }

  type ProductionRequest {
    id: ID!
    product_id: Int!
    product_name: String
    quantity: Int
    priority: Priority
    due_date: String
    status: Status
    manufacture_batch_id: String
    created_at: DateTime!
    updated_at: DateTime!
  }

  input CreateInternalProductionRequestInput {
    product_id: Int!
    quantity: Int!
    due_date: String!
  }

  input UpdateProductionRequestInput {
    id: ID!
    manufacturer_batch_id: String!
  }

  type Query {
    productionRequest(id: Int!): ProductionRequest
    allProductionRequests: [ProductionRequest]
  }

  type Mutation {
    createRequest(input: CreateInternalProductionRequestInput!): ProductionRequest
    updateProductionRequest(input: UpdateProductionRequestInput!): ProductionRequest
  }
`;

module.exports = typeDefs;