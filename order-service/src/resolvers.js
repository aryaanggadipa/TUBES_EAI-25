// order-service/src/resolvers.js
`src/resolvers.js`
// GraphQL Resolvers
const db = require('./db');
const internalServiceClient = require('./internalServiceClient'); // Untuk interaksi dengan Product & Stock Service

const resolvers = {
  DateTime: require('graphql-iso-date').GraphQLDateTime,

  Order: {
    // Resolver untuk field 'customer' dalam tipe 'Order'
    customer: async (parentOrder) => {
      if (!parentOrder.customer_id) return null;
      try {
        const [rows] = await db.query('SELECT * FROM customers WHERE customer_id = ?', [parentOrder.customer_id]);
        return rows.length > 0 ? rows[0] : null;
      } catch (error) {
        console.error(`Error fetching customer ${parentOrder.customer_id} for order ${parentOrder.order_id}:`, error);
        throw new Error('Failed to fetch customer details for order');
      }
    },
    // Anda bisa menambahkan resolver untuk 'product' di sini jika ingin mengambil detail produk
    // dari ProductService setiap kali query Order dijalankan.
    // product: async (parentOrder) => {
    //   if (!parentOrder.product_id) return null;
    //   try {
    //     const productDetails = await internalServiceClient.getProductDetails(parentOrder.product_id);
    //     return productDetails; // Asumsikan getProductDetails mengembalikan format yang sesuai
    //   } catch (error) {
    //     console.error(`Error fetching product ${parentOrder.product_id} for order ${parentOrder.order_id}:`, error);
    //     return null; // Atau throw error, tergantung kebutuhan
    //   }
    // }
  },

  Query: {
    order: async (_, { order_id }) => {
      try {
        const [rows] = await db.query('SELECT * FROM orders WHERE order_id = ?', [order_id]);
        return rows.length > 0 ? rows[0] : null;
      } catch (error) {
        console.error(`Error fetching order ${order_id}:`, error);
        throw new Error('Failed to fetch order');
      }
    },
    ordersByCustomer: async (_, { customer_id }) => {
      try {
        const [rows] = await db.query('SELECT * FROM orders WHERE customer_id = ? ORDER BY order_date DESC', [customer_id]);
        return rows;
      } catch (error) {
        console.error(`Error fetching orders for customer ${customer_id}:`, error);
        throw new Error('Failed to fetch orders for customer');
      }
    },
    customer: async (_, { customer_id }) => {
      try {
        const [rows] = await db.query('SELECT * FROM customers WHERE customer_id = ?', [customer_id]);
        return rows.length > 0 ? rows[0] : null;
      } catch (error) {
        console.error(`Error fetching customer ${customer_id}:`, error);
        throw new Error('Failed to fetch customer');
      }
    },
    getAllCustomers: async () => {
      try {
        const [rows] = await db.query('SELECT * FROM customers');
        return rows;
      } catch (error) {
        console.error('Error fetching all customers:', error);
        throw new Error('Failed to fetch customers');
      }
    },
    // Untuk pengujian interaksi
    fetchProductDetailsFromProductService: async (_, { product_id }) => {
        return internalServiceClient.getProductDetails(product_id);
    },
    checkStockFromStockService: async (_, { product_id, quantity }) => {
        return internalServiceClient.checkOrDeductStock(product_id, quantity, false); // false = hanya check
    }
  },

  Mutation: {
    createCustomer: async (_, { input }) => {
      const { name, email, phone, address } = input;
      try {
        // Cek apakah email sudah ada
        const [existing] = await db.query('SELECT customer_id FROM customers WHERE email = ?', [email]);
        if (existing.length > 0) {
          throw new Error(`Customer with email ${email} already exists.`);
        }

        const [result] = await db.query(
          'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
          [name, email, phone, address]
        );
        return { customer_id: result.insertId, name, email, phone, address };
      } catch (error) {
        console.error('Error creating customer:', error);
        throw new Error(`Failed to create customer: ${error.message}`);
      }
    },
    createOrder: async (_, { input }) => {
      const { customer_id, new_customer, product_id, quantity } = input;
      let currentCustomerId = customer_id;

      if (!customer_id && !new_customer) {
        throw new Error('Either existing customer_id or new_customer details must be provided.');
      }
      if (quantity <= 0) {
        throw new Error('Quantity must be greater than zero.');
      }

      const connection = await db.getConnection(); // Gunakan transaksi
      try {
        await connection.beginTransaction();

        // 1. Handle Customer
        if (new_customer) {
          const [existingByEmail] = await connection.query('SELECT customer_id FROM customers WHERE email = ?', [new_customer.email]);
          if (existingByEmail.length > 0) {
            // Jika customer dengan email tersebut sudah ada, gunakan ID yang ada
            currentCustomerId = existingByEmail[0].customer_id;
            console.log(`Using existing customer ID ${currentCustomerId} for email ${new_customer.email}`);
          } else {
            // Buat customer baru
            const [custResult] = await connection.query(
              'INSERT INTO customers (name, email, phone, address) VALUES (?, ?, ?, ?)',
              [new_customer.name, new_customer.email, new_customer.phone, new_customer.address]
            );
            currentCustomerId = custResult.insertId;
          }
        } else {
            // Verifikasi customer_id yang ada
            const [existingCustomer] = await connection.query('SELECT customer_id FROM customers WHERE customer_id = ?', [currentCustomerId]);
            if(existingCustomer.length === 0) {
                throw new Error(`Customer with ID ${currentCustomerId} not found.`);
            }
        }

        // 2. Ambil Detail Produk dari Product Service
        const productDetails = await internalServiceClient.getProductDetails(product_id);
        if (!productDetails || !productDetails.base_price) {
          throw new Error(`Product with ID ${product_id} not found or price is unavailable.`);
        }

        // 3. Cek dan Kurangi Stok dari Stock Service
        // Parameter ketiga true berarti 'deductIfAvailable'
        const stockResponse = await internalServiceClient.checkOrDeductStock(product_id, quantity, true); 
        if (!stockResponse || !stockResponse.is_available) {
          // Jika stok tidak tersedia, order bisa dibuat dengan status 'AWAITING_STOCK' atau ditolak
          // Sesuai PDF, Order Service mengkoordinasikan penyelesaian, jadi kita buat order dengan status khusus.
          // Atau, bisa langsung throw error jika tidak mau membuat order tanpa stok.
          // Untuk contoh ini, kita akan tetap membuat order dengan status AWAITING_STOCK
          // throw new Error(stockResponse.message || `Stock not available for product ID ${product_id}`);
          console.warn(`Stock not available for product ${product_id}, quantity ${quantity}. Order will be AWAITING_STOCK.`);
          // Di sini Anda bisa memutuskan apakah akan melanjutkan atau melempar error.
          // Jika ingin melanjutkan, pastikan StockService tidak mengurangi stok jika checkOrDeductStock(..., ..., true) gagal.
          // Untuk skenario ini, kita asumsikan checkOrDeductStock akan mengembalikan is_available: false jika tidak bisa deduct.
          if(!stockResponse.is_available) { // Double check jika checkOrDeductStock tidak throw error tapi return is_available false
             // Jika StockService mengindikasikan tidak bisa deduct, kita tidak bisa lanjut dengan status PENDING
             throw new Error(stockResponse.message || `Failed to secure stock for product ID ${product_id}`);
          }
        }
        
        // 4. Hitung Total Amount
        const total_amount = productDetails.base_price * quantity;
        const order_date = new Date();
        // Status awal order, bisa 'PENDING' atau 'AWAITING_STOCK' jika logika di atas diubah
        const initialStatus = 'PENDING'; 

        // 5. Simpan Order ke Database
        const [orderResult] = await connection.query(
          'INSERT INTO orders (customer_id, order_date, product_id, quantity, total_amount, status) VALUES (?, ?, ?, ?, ?, ?)',
          [currentCustomerId, order_date, product_id, quantity, total_amount, initialStatus]
        );
        const order_id = orderResult.insertId;

        await connection.commit(); // Commit transaksi jika semua berhasil

        return {
          order_id,
          customer_id: currentCustomerId,
          order_date,
          product_id,
          quantity,
          total_amount,
          status: initialStatus,
        };

      } catch (error) {
        await connection.rollback(); // Rollback jika ada error
        console.error('Error creating order:', error);
        // Berikan pesan error yang lebih spesifik ke client jika perlu
        throw new Error(`Failed to create order: ${error.message}`);
      } finally {
        connection.release();
      }
    },
    // updateOrderStatus: async (_, { order_id, status }) => {
    //   try {
    //     // Validasi status jika perlu
    //     const [result] = await db.query(
    //       'UPDATE orders SET status = ? WHERE order_id = ?',
    //       [status, order_id]
    //     );
    //     if (result.affectedRows === 0) {
    //       throw new Error(`Order with ID ${order_id} not found.`);
    //     }
    //     const [updatedOrderRows] = await db.query('SELECT * FROM orders WHERE order_id = ?', [order_id]);
    //     return updatedOrderRows[0];
    //   } catch (error) {
    //     console.error(`Error updating status for order ${order_id}:`, error);
    //     throw new Error(`Failed to update order status: ${error.message}`);
    //   }
    // }
  },
};

module.exports = resolvers;