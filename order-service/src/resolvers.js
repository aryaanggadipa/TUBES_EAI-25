// order-service/src/resolvers.js
const { GraphQLDateTime } = require('graphql-iso-date');
const db = require('./db');

const resolvers = {
  DateTime: GraphQLDateTime,

  Query: {
    order: async (_, { id }) => {
      const [orderRows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
      if (orderRows.length === 0) return null;

      const order = orderRows[0];
      const [itemRows] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      order.items = itemRows;
      
      return order;
    },
    ordersByCustomer: async (_, { email }) => {
      const [orders] = await db.query('SELECT * FROM orders WHERE customerEmail = ? ORDER BY orderDate DESC', [email]);
      
      for (const order of orders) {
        const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
        order.items = items;
      }

      return orders;
    },
  },

  Mutation: {
    createOrder: async (_, { input }) => {
      const { customerEmail, shippingAddress, paymentMethod, notes, items } = input;
      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        // 1. Calculate total price on the server-side for security
        const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        // 2. Insert into the main 'orders' table
        const [orderResult] = await connection.execute(
          'INSERT INTO orders (customerEmail, orderDate, status, totalPrice, shippingAddress, paymentMethod, notes) VALUES (?, NOW(), ?, ?, ?, ?, ?)',
          [customerEmail, 'PENDING', totalPrice, shippingAddress, paymentMethod, notes]
        );
        const orderId = orderResult.insertId;

        // 3. Insert each item into the 'order_items' table
        const itemPromises = items.map(item => {
          return connection.execute(
            'INSERT INTO order_items (order_id, productId, quantity, price) VALUES (?, ?, ?, ?)',
            [orderId, item.productId, item.quantity, item.price]
          );
        });
        await Promise.all(itemPromises);

        await connection.commit();

        // 4. Return the newly created order object, matching the GraphQL schema
        return {
          id: orderId,
          customerEmail,
          orderDate: new Date().toISOString(),
          status: 'PENDING',
          totalPrice,
          shippingAddress,
          paymentMethod,
          notes,
          items
        };

      } catch (error) {
        await connection.rollback();
        console.error('Failed to create order:', error);
        throw new Error('Failed to create order. Transaction rolled back.');
      } finally {
        connection.release();
      }
    },
  },

  // Field-level resolver for Order.items if not handled in parent
  Order: {
    items: async (order) => {
      // If items are not already populated by the parent resolver
      if (order.items) return order.items;
      
      const [itemRows] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [order.id]);
      return itemRows;
    },
  },
};

module.exports = resolvers;