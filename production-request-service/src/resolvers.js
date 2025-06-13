// production-request-service/src/resolvers.js
// Helper to map database snake_case to GraphQL camelCase
// // production-request-service/src/resolvers.js
const { default: axios } = require('axios');
const db = require('./db');
const { GraphQLError } = require('graphql');

const resolvers = {
  Query: {
    productionRequest: async (_, {id}) => {
      try {
        const [rows] = await db.query('SELECT * FROM production_requests WHERE id = ?', [id]);
        return rows.length > 0 ? rows[0] : null;
      } catch (error) {
        console.error(`Error fetching production request ${id}:`, error);
        throw new Error('Failed to fetch production request');
      }
    },
    allProductionRequests: async () => {
      try {
        const [rows] = await db.query('SELECT * FROM production_requests ORDER BY created_at DESC');
        return rows;
      } catch (error) {
        console.error('Error fetching all production requests:', error);
        throw new Error('Failed to fetch all production requests');
      }
    }
  },

  Mutation: {
    createRequest: async (_, { input }) => {
      

      
      try{
        const { product_id, quantity, due_date } = input;
    const status = 'planned'; // Default status on creation

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time for consistent day comparison
      const dueDateObj = new Date(due_date);
      if (isNaN(dueDateObj.getTime())) {
        throw new Error('Invalid due date format. Please use a valid date string (e.g., YYYY-MM-DD).');
      }

      const diffTime = dueDateObj - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let priority;
      if (diffDays <= 7) {
        priority = 'urgent';
      } else if (diffDays <= 15) {
        priority = 'high';
      } else if (diffDays <= 30) {
        priority = 'normal';
      } else {
        priority = 'low';
      }
      console.log({product_id})
      console.log("PRODUCT")
                const productResponse = await axios.post(`${process.env.PRODUCT_SERVICE_URL ?? "http://product_service:4001/graphql"}`, {
          query: `
            query getProduct($product_id: ID!) {
              product(product_id: $product_id) {
                    product_id
                    product_name
              }
            }
          `,
          variables: {
            product_id
          }
        });
        const { data: {product} } = productResponse.data;

        // MOCK: Simulating a successful call to the external manufacturing service
        // In a real scenario, the axios.post call below would be used.
        console.log('MOCKING external manufacturing service call for development...');
        const createProductionRequest = {
          id: `mock-ext-${+new Date()}`,
          status: 'SUBMITTED_TO_MANUFACTURER',
          requestId: `${+new Date()}`
        };
        console.log('Mocked external response:', createProductionRequest);

        const sql = `
        INSERT INTO production_requests
        (id, product_id, quantity, due_date, status, priority)
        VALUES ( ?, ?, ?, ?, ?, ?)
      `;
      const generatedId = `${+new Date()}`;
      const values = [generatedId, product_id, quantity, due_date, status, priority];
      

      const [result] = await db.query(sql, values);
      const insertedId = result.insertId;

      const [newRequestRows] = await db.query('SELECT * FROM production_requests WHERE id = ?', [generatedId]);
      console.log({newRequestRows});
      return newRequestRows[0];
      }
      catch(e) {
        console.error('Failed to create production request:', e.message);
        throw new Error('Could not create production request.');
      }


    },
    updateProductionRequest: async (_, { product_id, manufacturer_batch_id }) => {

      try {
        await db.beginTransaction;
        const [productionRequestExist] = await db.query(`SELECT * FROM production_requests WHERE id = ?`, [product_id])
        if (productionRequestExist.length === 0) {
          return new GraphQLError('Production request not found', {
            extensions: {
              code: 'NOT_FOUND',
              http: { status: 404 },
            },
          });
        }
        const sql = `
        UPDATE production_requests
        SET manufacturer_batch_id = ?
        WHERE id = ?
      `;
        const values = [manufacturer_batch_id, product_id];
      
        const [result] = await db.query(sql, values);

        const productSql = `SELECT * FROM production_requests WHERE id = ?`
        const [productResult] = await db.query(productSql, [product_id]);
        await db.commit;
        return productResult[0];

      } catch (error) {
        console.error('Failed to update production request:', error);
        await db.rollback;
      }
    }
  }
}
module.exports = resolvers;