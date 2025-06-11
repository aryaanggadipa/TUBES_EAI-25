// product-service/src/index.js
`src/index.js`
// Main server file for Product Service
const express = require('express');
const cors = require('cors');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4'); // For Express 4
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const db = require('./db'); // Ensures DB connection is attempted at startup
require('dotenv').config();

const app = express();
const port = process.env.PORT || 4001;

// Middleware
app.use(express.json()); // Body parser for REST (if any)
app.use(cors()); // Enable CORS

async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    // context: ({ req }) => ({ req }) // If you need request context
  });

  await server.start();

  // Apply Apollo GraphQL middleware and set the path to /graphql
  app.use('/graphql', expressMiddleware(server));

  app.get('/', (req, res) => {
    res.send('Product Service is running!');
  });

  app.listen(port, () => {
    console.log(`Product Service running on port ${port}`);
    console.log(`GraphQL endpoint available at http://localhost:${port}/graphql`);
  });
}

startServer().catch(error => {
  console.error("Failed to start Product Service server:", error);
});