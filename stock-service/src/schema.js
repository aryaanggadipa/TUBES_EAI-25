// stock-service/src/schema.js
`src/schema.js`
// GraphQL Schema Definition
const { gql } = require('graphql-tag');

const typeDefs = gql`
  scalar DateTime

  type ClothingStock {
    stock_id: ID!
    product_id: Int! # Merujuk ke product_id di product_catalog_db
    current_stock: Int!
    minimum_stock_level: Int!
    last_updated: DateTime!
  }

  type StockNotification {
    notification_id: ID!
    product_id: Int!
    notification_type: String! # e.g., 'LOW_STOCK', 'OUT_OF_STOCK'
    message: String
    notified_at: DateTime!
  }

  # Enum untuk tipe operasi stok yang dipanggil oleh OrderService
  enum StockOperationType {
    CHECK # Hanya memeriksa ketersediaan
    DEDUCT # Memeriksa dan mengurangi jika tersedia
  }

  # Respons untuk operasi manageStock
  type ManageStockResponse {
    product_id: Int!
    is_available: Boolean!      # True jika operasi (check/deduct) berhasil dan stok cukup
    current_stock: Int          # Stok saat ini (setelah deduct jika berhasil, atau stok saat check)
    message: String             # Pesan tambahan (e.g., "Stock deducted", "Insufficient stock")
  }
  
  # Input untuk menambah atau menginisialisasi stok (misalnya dari penerimaan barang produksi)
  input UpdateStockInput {
    product_id: Int!
    quantity_change: Int! # Bisa positif (menambah) atau negatif (mengurangi secara manual, jarang)
    notes: String # Opsional, untuk catatan seperti "Penerimaan dari batch B123"
  }

  type Query {
    getStockByProductId(product_id: Int!): ClothingStock
    getAllStock: [ClothingStock]
    getLowStockProducts: [ClothingStock]
    getStockNotifications(product_id: Int): [StockNotification] # filter by product_id or get all
  }

  type Mutation {
    # Dipanggil oleh OrderService untuk memeriksa atau mengurangi stok
    manageStock(
        product_id: Int!, 
        quantity: Int!, 
        operationType: StockOperationType!
    ): ManageStockResponse

    # Dipanggil internal atau oleh sistem lain (misal setelah produksi selesai) untuk memperbarui stok
    updateStockLevel(input: UpdateStockInput!): ClothingStock
    
    # Inisialisasi stok untuk produk baru (jika belum ada)
    initializeProductStock(product_id: Int!, initial_stock: Int!, minimum_stock_level: Int!): ClothingStock

    # (Opsional) Meminta update status produksi dari sistem manufaktur
    # requestProductionStatusUpdate(manufacturer_batch_id: String!): String 
  }
`;

module.exports = typeDefs;