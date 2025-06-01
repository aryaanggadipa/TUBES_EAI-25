// stock-service/src/resolvers.js
`src/resolvers.js`
// GraphQL Resolvers
const db = require('./db');
const internalServiceClient = require('./internalServiceClient'); // Untuk interaksi dengan ProductionRequestService & ManufacturingSystem

const resolvers = {
  DateTime: require('graphql-iso-date').GraphQLDateTime,

  Query: {
    getStockByProductId: async (_, { product_id }) => {
      try {
        const [rows] = await db.query('SELECT * FROM clothing_stock WHERE product_id = ?', [product_id]);
        return rows.length > 0 ? rows[0] : null;
      } catch (error) {
        console.error(`Error fetching stock for product ${product_id}:`, error);
        throw new Error('Failed to fetch stock');
      }
    },
    getAllStock: async () => {
      try {
        const [rows] = await db.query('SELECT * FROM clothing_stock ORDER BY product_id');
        return rows;
      } catch (error) {
        console.error('Error fetching all stock:', error);
        throw new Error('Failed to fetch all stock');
      }
    },
    getLowStockProducts: async () => {
      try {
        const [rows] = await db.query('SELECT * FROM clothing_stock WHERE current_stock <= minimum_stock_level');
        return rows;
      } catch (error) {
        console.error('Error fetching low stock products:', error);
        throw new Error('Failed to fetch low stock products');
      }
    },
    getStockNotifications: async (_, { product_id }) => {
        try {
            let query = 'SELECT * FROM stock_notifications';
            const params = [];
            if (product_id) {
                query += ' WHERE product_id = ?';
                params.push(product_id);
            }
            query += ' ORDER BY notified_at DESC';
            const [rows] = await db.query(query, params);
            return rows;
        } catch (error) {
            console.error('Error fetching stock notifications:', error);
            throw new Error('Failed to fetch stock notifications');
        }
    }
  },

  Mutation: {
    manageStock: async (_, { product_id, quantity, operationType }) => {
      if (quantity <= 0) {
        return { product_id, is_available: false, current_stock: 0, message: "Quantity must be positive." };
      }

      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        const [stockRows] = await connection.query('SELECT * FROM clothing_stock WHERE product_id = ? FOR UPDATE', [product_id]);
        if (stockRows.length === 0) {
          await connection.rollback();
          return { product_id, is_available: false, current_stock: 0, message: `Product ID ${product_id} not found in stock.` };
        }

        const stockItem = stockRows[0];
        let current_stock = stockItem.current_stock;
        let message = "";
        let is_available = false;

        if (operationType === 'CHECK') {
          is_available = current_stock >= quantity;
          message = is_available ? "Stock available." : "Insufficient stock.";
        } else if (operationType === 'DEDUCT') {
          if (current_stock >= quantity) {
            current_stock -= quantity;
            await connection.query('UPDATE clothing_stock SET current_stock = ?, last_updated = CURRENT_TIMESTAMP WHERE product_id = ?', [current_stock, product_id]);
            is_available = true;
            message = "Stock deducted successfully.";

            // Cek apakah stok sekarang di bawah minimum setelah pengurangan
            if (current_stock <= stockItem.minimum_stock_level) {
              const notificationType = current_stock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK';
              const notifMessage = `${notificationType} for product ID ${product_id}. Current stock: ${current_stock}.`;
              await connection.query(
                'INSERT INTO stock_notifications (product_id, notification_type, message) VALUES (?, ?, ?)',
                [product_id, notificationType, notifMessage]
              );
              console.log(notifMessage);
              // TODO: Panggil ProductionRequestService untuk restock
              // internalServiceClient.requestRestock(product_id, stockItem.minimum_stock_level * 2); // Contoh: minta restock 2x level minimum
            }
          } else {
            is_available = false;
            message = "Insufficient stock for deduction.";
          }
        } else {
          await connection.rollback();
          return { product_id, is_available: false, current_stock: stockItem.current_stock, message: "Invalid stock operation type." };
        }

        await connection.commit();
        return { product_id, is_available, current_stock, message };

      } catch (error) {
        await connection.rollback();
        console.error(`Error in manageStock for product ${product_id}:`, error);
        throw new Error(`Failed to manage stock: ${error.message}`);
      } finally {
        connection.release();
      }
    },

    updateStockLevel: async (_, { input }) => {
        const { product_id, quantity_change, notes } = input;
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [stockRows] = await connection.query('SELECT * FROM clothing_stock WHERE product_id = ? FOR UPDATE', [product_id]);
            if (stockRows.length === 0) {
                await connection.rollback();
                throw new Error(`Product ID ${product_id} not found in stock. Initialize stock first.`);
            }

            const stockItem = stockRows[0];
            const new_stock = stockItem.current_stock + quantity_change;

            if (new_stock < 0) {
                await connection.rollback();
                throw new Error(`Stock cannot be negative. Current: ${stockItem.current_stock}, Change: ${quantity_change}`);
            }

            await connection.query(
                'UPDATE clothing_stock SET current_stock = ?, last_updated = CURRENT_TIMESTAMP WHERE product_id = ?',
                [new_stock, product_id]
            );
            
            // (Opsional) Tambahkan log atau notifikasi untuk perubahan stok manual/penerimaan
            if (notes) {
                console.log(`Stock updated for product ${product_id}: ${quantity_change}. Notes: ${notes}`);
                // Bisa juga simpan ke tabel log terpisah jika perlu audit trail detail
            }

            await connection.commit();
            
            const [updatedStockRows] = await connection.query('SELECT * FROM clothing_stock WHERE product_id = ?', [product_id]);
            return updatedStockRows[0];

        } catch (error) {
            await connection.rollback();
            console.error(`Error updating stock level for product ${product_id}:`, error);
            throw new Error(`Failed to update stock level: ${error.message}`);
        } finally {
            connection.release();
        }
    },
    
    initializeProductStock: async (_, { product_id, initial_stock, minimum_stock_level }) => {
        if (initial_stock < 0 || minimum_stock_level < 0) {
            throw new Error("Initial stock and minimum stock level cannot be negative.");
        }
        try {
            const [existingRows] = await db.query('SELECT stock_id FROM clothing_stock WHERE product_id = ?', [product_id]);
            if (existingRows.length > 0) {
                throw new Error(`Stock for product ID ${product_id} already exists. Use updateStockLevel instead.`);
            }

            const [result] = await db.query(
                'INSERT INTO clothing_stock (product_id, current_stock, minimum_stock_level, last_updated) VALUES (?, ?, ?, CURRENT_TIMESTAMP)',
                [product_id, initial_stock, minimum_stock_level]
            );
            const stock_id = result.insertId;
            return { 
                stock_id, 
                product_id, 
                current_stock: initial_stock, 
                minimum_stock_level, 
                last_updated: new Date() 
            };
        } catch (error) {
            console.error(`Error initializing stock for product ${product_id}:`, error);
            throw new Error(`Failed to initialize stock: ${error.message}`);
        }
    }
    // Implementasi untuk requestProductionStatusUpdate jika diperlukan
    // requestProductionStatusUpdate: async (_, { manufacturer_batch_id }) => {
    //   try {
    //     const status = await internalServiceClient.getProductionStatusFromManufacturing(manufacturer_batch_id);
    //     // Logika untuk memperbarui stok berdasarkan status ini jika perlu
    //     return `Status for batch ${manufacturer_batch_id}: ${status.currentProgress || 'Unknown'}`;
    //   } catch (error) {
    //     console.error(`Error requesting production status for batch ${manufacturer_batch_id}:`, error);
    //     throw new Error('Failed to request production status');
    //   }
    // }
  },
};

module.exports = resolvers;