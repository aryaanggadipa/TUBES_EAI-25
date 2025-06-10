// production-request-service/src/resolvers.js
`src/resolvers.js`
// GraphQL Resolvers - Disesuaikan untuk memanggil client yang baru
const db = require('./db');
const manufacturingClient = require('./manufacturingClient'); // Menggunakan client yang sudah disesuaikan

const resolvers = {
  DateTime: require('graphql-iso-date').GraphQLDateTime,

  Query: {
    productionRequest: async (_, { request_id }) => {
      try {
        const [rows] = await db.query('SELECT * FROM production_requests WHERE request_id = ?', [request_id]);
        return rows.length > 0 ? rows[0] : null;
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
  },
  Mutation: {
    createProductionRequest: async (_, { input }) => {
      const { product_id, quantity_requested } = input;
      const request_sent_timestamp = new Date();
      
      let insertedId;

      try {
        // 1. Simpan permintaan awal ke database lokal dengan status 'SENDING'.
        // Ini berguna untuk melacak permintaan yang sedang dalam proses pengiriman.
        const [initialResult] = await db.query(
          'INSERT INTO production_requests (product_id, quantity_requested, request_sent_timestamp, manufacturer_status_ack) VALUES (?, ?, ?, ?)',
          [product_id, quantity_requested, request_sent_timestamp, 'SENDING']
        );
        insertedId = initialResult.insertId;

        // 2. Kirim permintaan ke sistem manufaktur Kelompok 3 menggunakan client yang sudah disesuaikan.
        const manufacturerResponse = await manufacturingClient.sendProductionRequestToManufacturingSystem({
            product_id: product_id,
            quantity: quantity_requested,
        });

        // 3. Update record lokal kita dengan feedback dari sistem manufaktur.
        // == PENYESUAIAN DENGAN RESPONS KELOMPOK 3 ==
        if (manufacturerResponse && manufacturerResponse.production_id) {
            await db.query(
              'UPDATE production_requests SET manufacturer_batch_id = ?, manufacturer_status_ack = ?, estimated_completion_date = ?, last_response_from_manufacturer = CURRENT_TIMESTAMP WHERE request_id = ?',
              [
                manufacturerResponse.production_id,       // Mapping: production_id -> manufacturer_batch_id
                manufacturerResponse.status,              // Mapping: status -> manufacturer_status_ack
                manufacturerResponse.end_date,            // Mapping: end_date -> estimated_completion_date
                insertedId
              ]
            );
        } else {
            // Jika respons tidak valid atau tidak ada production_id.
            throw new Error('Invalid response from manufacturing system.');
        }
        // ==========================================
        
        // 4. Ambil data final yang sudah di-update dari database kita untuk dikembalikan.
        const [finalRows] = await db.query('SELECT * FROM production_requests WHERE request_id = ?', [insertedId]);
        return finalRows[0];

      } catch (error) {
        console.error(`Error in createProductionRequest flow for product ${product_id}:`, error.message);

        // Jika error terjadi setelah record awal dibuat, update statusnya menjadi 'FAILED'.
        if (insertedId) {
          await db.query(
             'UPDATE production_requests SET manufacturer_status_ack = ? WHERE request_id = ?',
             ['FAILED_TO_SEND', insertedId]
          );
        }

        // Lempar error agar client tahu bahwa proses gagal.
        throw new Error(`Failed to create and send production request: ${error.message}`);
      }
    },
  },
};

module.exports = resolvers;