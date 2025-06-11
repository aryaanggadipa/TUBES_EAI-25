// order-service/src/schema.js
`src/schema.js`
// GraphQL Schema Definition
const { gql } = require('graphql-tag');

const typeDefs = gql`
  scalar DateTime

  type Customer {
    customer_id: ID!
    name: String!
    email: String
    phone: String
    address: String
  }

  # Berdasarkan PDF, tabel orders memiliki satu product_id per order.
  # Jika satu pesanan bisa memiliki banyak item produk berbeda, struktur OrderItem diperlukan.
  # Untuk saat ini, mengikuti skema PDF.
  type Order {
    order_id: ID!
    customer_id: Int! # Bisa di-resolve menjadi objek Customer
    customer: Customer # Hasil resolve dari customer_id
    order_date: DateTime!
    product_id: Int! # Bisa di-resolve menjadi objek Product dari ProductService
    # product: Product # Hasil resolve dari product_id (membutuhkan call ke ProductService)
    quantity: Int!
    total_amount: Float!
    status: String! # e.g., PENDING, PROCESSING, AWAITING_STOCK, SHIPPED, DELIVERED, CANCELED
  }

  # Input untuk membuat customer baru
  input CreateCustomerInput {
    name: String!
    email: String! # Asumsikan email unik dan wajib
    phone: String
    address: String
  }

  # Input untuk membuat order baru
  input CreateOrderInput {
    customer_id: Int # Jika customer sudah ada
    new_customer: CreateCustomerInput # Jika customer baru
    product_id: Int!
    quantity: Int!
  }
  
  type ProductInfo { # Digunakan untuk mengambil info produk dari ProductService
      product_id: ID!
      product_name: String!
      base_price: Float!
  }

  type StockCheckResponse { # Digunakan untuk respons dari StockService
      product_id: Int!
      is_available: Boolean!
      available_stock: Int
      message: String
  }


  type Query {
    order(order_id: ID!): Order
    ordersByCustomer(customer_id: ID!): [Order]
    customer(customer_id: ID!): Customer
    getAllCustomers: [Customer]
    # Query untuk pengujian interaksi (opsional)
    fetchProductDetailsFromProductService(product_id: ID!): ProductInfo 
    checkStockFromStockService(product_id: Int!, quantity: Int!): StockCheckResponse
  }

  type Mutation {
    createCustomer(input: CreateCustomerInput!): Customer
    createOrder(input: CreateOrderInput!): Order
    # updateOrderStatus(order_id: ID!, status: String!): Order # Contoh mutasi update status
  }
`;

module.exports = typeDefs;