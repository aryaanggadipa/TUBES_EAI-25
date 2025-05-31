// production-request-service/src/resolvers.js
`src/resolvers.js`
// GraphQL Resolvers
const db = require('./db');
const manufacturingClient = require('./manufacturingClient'); // Untuk interaksi dengan sistem manufaktur

const resolvers = {
  DateTime: require('graphql-iso-date').GraphQLDateTime, // Untuk tipe scalar DateTime

  Query: {
    productionRequest: async (_, { request_id }) => {
      try {
        const [rows] = await db.query('SELECT * FROM production_requests WHERE request_id = ?', [request_id]);
        if (rows.length === 0) {
          return null;
        }
        return rows[0];
      } catch (error) {
        console.error(`Error fetching production request ${request_id}:`, error);
        throw new Error('Failed to fetch production request');
      }
    },
    allProductionRequests: async () => {
      try {
        const [rows] = await db.query('SELECT * FROM production_requests ORDER BY request_sent_timestamp DESC');
        return rows;
      } catch (error) {
        console.error('Error fetching all production requests:', error);
        throw new Error('Failed to fetch all production requests');
      }
    },
    productionRequestsByStatus: async (_, { status }) => {
      try {
        const [rows] = await db.query('SELECT * FROM production_requests WHERE manufacturer_status_ack = ? ORDER BY request_sent_timestamp DESC', [status]);
        return rows;
      } catch (error) {
        console.error(`Error fetching production requests with status ${status}:`, error);
        throw new Error('Failed to fetch production requests by status');
      }
    }
  },
  Mutation: {
    createProductionRequest: async (_, { input }) => {
      const { product_id, quantity_requested } = input;
      const request_sent_timestamp = new Date();
      
      try {
        // 1. Simpan permintaan awal ke database lokal
        const [result] = await db.query(
          'INSERT INTO production_requests (product_id, quantity_requested, request_sent_timestamp, manufacturer_status_ack) VALUES (?, ?, ?, ?)',
          [product_id, quantity_requested, request_sent_timestamp, 'PENDING_MANUFACTURER']
        );
        const insertedId = result.insertId;

        // 2. (Idealnya) Kirim permintaan ke sistem manufaktur
        // Anda perlu mengambil detail produk dari ProductService jika diperlukan oleh sistem manufaktur
        // Untuk contoh ini, kita asumsikan input sudah cukup atau manufacturingClient akan mengambil detail tambahan.
        let manufacturerResponse = null;
        try {
          // Detail produk dan desain mungkin perlu diambil dari ProductService
          // dan ditambahkan ke payload untuk manufacturingClient
          manufacturerResponse = await manufacturingClient.sendProductionRequestToManufacturingSystem({
            internal_request_id: insertedId, // Kirim ID internal kita untuk referensi
            product_id: product_id,
            quantity: quantity_requested,
            // ... detail lain yang dibutuhkan sistem manufaktur (misal dari input.product_name, input.design_details)
          });

          // 3. Update record lokal dengan feedback dari manufaktur jika ada respons langsung
          if (manufacturerResponse) {
            await db.query(
              'UPDATE production_requests SET manufacturer_batch_id = ?, manufacturer_status_ack = ?, estimated_completion_date = ?, last_response_from_manufacturer = CURRENT_TIMESTAMP WHERE request_id = ?',
              [
                manufacturerResponse.batchId, 
                manufacturerResponse.status, // Status dari manufaktur
                manufacturerResponse.estimatedCompletionDate, // YYYY-MM-DD
                insertedId
              ]
            );
          }
        } catch (manufacturingError) {
          console.error(`Error sending request ${insertedId} to manufacturing system:`, manufacturingError.message);
          // Biarkan status di DB sebagai PENDING_MANUFACTURER atau set ke FAILED_TO_SEND
          // Tergantung strategi error handling Anda
           await db.query(
              'UPDATE production_requests SET manufacturer_status_ack = ? WHERE request_id = ?',
              ['FAILED_TO_SEND_TO_MANUFACTURER', insertedId]
           );
        }
        
        // Ambil data yang sudah diupdate (atau data awal jika pengiriman gagal)
        const [finalRows] = await db.query('SELECT * FROM production_requests WHERE request_id = ?', [insertedId]);
        return finalRows[0];

      } catch (error) {
        console.error('Error creating production request:', error);
        throw new Error('Failed to create production request');
      }
    },

    updateProductionRequestFromManufacturer: async (_, { input }) => {
        const { request_id, manufacturer_batch_id, manufacturer_status_ack, estimated_completion_date } = input;
        try {
            const [existingRequest] = await db.query('SELECT * FROM production_requests WHERE request_id = ?', [request_id]);
            if (existingRequest.length === 0) {
                throw new Error(`Production request with ID ${request_id} not found.`);
            }

            const fieldsToUpdate = {};
            if (manufacturer_batch_id !== undefined) fieldsToUpdate.manufacturer_batch_id = manufacturer_batch_id;
            if (manufacturer_status_ack !== undefined) fieldsToUpdate.manufacturer_status_ack = manufacturer_status_ack;
            if (estimated_completion_date !== undefined) fieldsToUpdate.estimated_completion_date = estimated_completion_date;
            fieldsToUpdate.last_response_from_manufacturer = new Date();

            if (Object.keys(fieldsToUpdate).length === 1 && fieldsToUpdate.last_response_from_manufacturer) {
                 // Hanya last_response_from_manufacturer yang diupdate jika tidak ada field lain
                 // Atau bisa juga throw error jika tidak ada field lain yang diupdate
                console.warn(`Updating only last_response_from_manufacturer for request_id ${request_id} as no other fields were provided.`);
            }


            const updateQuery = 'UPDATE production_requests SET ? WHERE request_id = ?';
            await db.query(updateQuery, [fieldsToUpdate, request_id]);
            
            const [updatedRows] = await db.query('SELECT * FROM production_requests WHERE request_id = ?', [request_id]);
            return updatedRows[0];
        } catch (error) {
            console.error(`Error updating production request ${request_id} from manufacturer:`, error);
            throw new Error('Failed to update production request from manufacturer');
        }
    }
  },
};

module.exports = resolvers;