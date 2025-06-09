export const typeDefinitions = `#graphql
  scalar DateTime
    type Query {
        getProductStock(product_id: Int!): Stock
    }

    type Mutation {
        addStock(stock: AddStockInput): Stock
        updateStock(stock_id: Int, stock: UpdateStockInput): Stock
        deleteStock(stock_id: Int!): Stock
    }

    type Stock {
        id: ID!
        product_id: Int!
        quantity: Int!
        reorder_point: Int!
        created_at:  DateTime!
        updated_at: DateTime!
        histories: [History!]!
    }

    type History {
        id: ID!
        stock_id: Int!
        type: String!
        quantity: Int!
        created_at: DateTime!
        updated_at: DateTime!
        note: String
    }

    input AddStockInput {
        product_id: Int!
        quantity: Int!
        reorder_point: Int
    }

    input UpdateStockInput {
        product_id: Int
        quantity: Int!
        reorder_point: Int,
        type: String,
        note: String
    }
`;
