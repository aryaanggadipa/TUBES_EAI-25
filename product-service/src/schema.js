// product-service/src/schema.js
`src/schema.js`
// GraphQL Schema Definition
const { gql } = require('graphql-tag'); // Use graphql-tag for gql

const typeDefs = gql`
  type Product {
    product_id: ID!
    product_name: String!
    description: String
    category_id: String
    base_price: Float!
    default_image_url: String
  }

  type Query {
    products: [Product]
    product(product_id: ID!): Product
  }

  type Mutation {
    addProduct(
      product_name: String!, 
      description: String, 
      category_id: String, 
      base_price: Float!, 
      default_image_url: String
    ): Product
    updateProduct(
      product_id: ID!,
      product_name: String, 
      description: String, 
      category_id: String, 
      base_price: Float, 
      default_image_url: String
    ): Product
    deleteProduct(product_id: ID!): Product # Returns deleted product or a success message
  }
`;

module.exports = typeDefs;