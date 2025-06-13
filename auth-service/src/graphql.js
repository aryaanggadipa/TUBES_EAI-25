const { buildSchema } = require('graphql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'your-default-secret-key';

// GraphQL Schema
const schema = buildSchema(`
  type User {
    id: ID!
    name: String!
    email: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Query {
    login(email: String!, password: String!): AuthPayload
  }

  type Mutation {
    register(name: String!, email: String!, password: String!): User
  }
`);

// Resolvers
const root = {
  register: async ({ name, email, password }) => {
    const hashedPassword = await bcrypt.hash(password, 12);
    const connection = await pool.getConnection();
    try {
      const [result] = await connection.execute(
        'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
        [name, email, hashedPassword]
      );
      return {
        id: result.insertId,
        name,
        email,
      };
    } catch (error) {
      // Handle potential duplicate email error, etc.
      throw new Error(error.message);
    } finally {
      connection.release();
    }
  },
  login: async ({ email, password }) => {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      if (rows.length === 0) {
        throw new Error('User not found or incorrect password.');
      }
      const user = rows[0];
      const isEqual = await bcrypt.compare(password, user.password_hash);
      if (!isEqual) {
        throw new Error('User not found or incorrect password.');
      }

      const token = jwt.sign(
        { userId: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: '1h' } 
      );

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      };
    } catch (error) {
      throw new Error(error.message);
    } finally {
      connection.release();
    }
  },
};

module.exports = { schema, root };
