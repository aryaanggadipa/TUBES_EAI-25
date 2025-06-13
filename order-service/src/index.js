// order-service/src/index.js
`src/index.js`
// Main server file for Order Service
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const db = require('./db'); // Ensures DB connection is attempted at startup
require('dotenv').config();

const cors = require('cors');
const app = express();
const port = process.env.PORT || 4002; // Sesuai docker-compose.yml

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    // context: ({ req }) => ({ req }) 
  });

  await server.start();

  app.use('/graphql', expressMiddleware(server));

  app.get('/', (req, res) => {
    res.send('Order Service is running!');
  });

  app.listen(port, () => {
    console.log(`Order Service running on port ${port}`);
    console.log(`GraphQL endpoint available at http://localhost:${port}/graphql`);
  });
}

startServer().catch(error => {
  console.error("Failed to start Order Service server:", error);
});

