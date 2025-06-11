export const typeDefinitions = `#graphql
  scalar DateTime
    type Query {
        getProductStock(product_id: Int!): Stock
    }

    type Mutation {
        addStock(stock: AddStockInput): Stock
        updateStock(product_id: Int!, stock: UpdateStockInput): Stock
        deleteStock(product_id: Int!): Stock
        requestFeedback(payload: FeedbackRequestInput): FeedbackRequest
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
        product_id: Int!
        type: String!
        quantity: Int!
        created_at: DateTime!
        updated_at: DateTime!
        note: String
    }

     type FeedbackRequest {
        id: ID!
        batch_number: Int!,
        note: String
        status: FEEDBACKCSTATUS!
        product_id: Int!
        quantity: Int!
        created_at: DateTime
        updated_at: DateTime
     }

    input AddStockInput {
        product_id: Int!
        quantity: Int!
        reorder_point: Int
    }

    input UpdateStockInput {
        quantity: Int!
        reorder_point: Int,
        type: String!,
        note: String
    }

    enum FEEDBACKCSTATUS {
        PENDING
        COMPLETED
    }

    input FeedbackRequestInput {
        batch_number: Int!
        status: FEEDBACKCSTATUS
        product_id: Int!,
        quantity: Int!
        note: String
    }
`;
