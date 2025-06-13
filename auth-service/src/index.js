// auth-service/src/index.js
const express = require('express');
const cors = require('cors');
const { graphqlHTTP } = require('express-graphql');
require('dotenv').config();

const db = require('./db');
const { schema, root } = require('./graphql'); // Import schema and resolvers

const app = express();
const port = process.env.PORT || 4005;

// Middleware
app.use(cors());
app.use(express.json());

// GraphQL Endpoint
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true, // Enable GraphiQL interface for testing
}));

app.get('/', (req, res) => {
  res.send('Auth Service is running!');
});

async function startApp() {
  await db.testConnection(); // Test koneksi database sebelum server listen
  app.listen(port, () => {
    console.log(`Auth Service running on port ${port}`);
    console.log(`GraphQL API available at http://localhost:${port}/graphql`);
  });
}

startApp().catch(error => {
  console.error("Failed to start Auth Service:", error);
  process.exit(1);
});
