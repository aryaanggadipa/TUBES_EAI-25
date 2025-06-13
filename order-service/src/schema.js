// order-service/src/schema.js
const { gql } = require('graphql-tag');

const typeDefs = gql`
  scalar DateTime

  type Order {
    id: ID!
    customerEmail: String!
    orderDate: DateTime!
    status: String!
    totalPrice: Float!
    shippingAddress: String!
    paymentMethod: String!
    notes: String
    items: [OrderItem!]!
  }

  type OrderItem {
    id: ID!
    productId: Int!
    quantity: Int!
    price: Float!
  }

  input OrderItemInput {
    productId: Int!
    quantity: Int!
    price: Float!
  }

  input CreateOrderInput {
    customerEmail: String!
    shippingAddress: String!
    paymentMethod: String!
    notes: String
    items: [OrderItemInput!]!
  }

  type Query {
    order(id: ID!): Order
    ordersByCustomer(email: String!): [Order]
  }

  type Mutation {
    createOrder(input: CreateOrderInput!): Order
  }
`;

module.exports = typeDefs;