import { prismaClient } from "./prismaClient.js";
import axios from "axios";
export const rootResolver = {
  Query: {
    getProductStock: async (_, { product_id }) => {
      const productStock = await prismaClient.stock.findFirst({
        where: {
          product_id,
        },
        include: {
          histories: true,
        },
      });

      return productStock;
    },
    getFeedbackRequest: async (_, { feedback_id }) => {
      try {
        const feedback = await prismaClient.feedbackRequest.findUnique({
          where: {
            id: feedback_id,
          },
        });
        return feedback;
      } catch (err) {
        throw new Error(`Something Error occured ${err.message}`);
      }
    },
  },
  Mutation: {
    addStock: async (_, { stock: { product_id, quantity, reorder_point } }) => {
      try {
        const isStockExist = await prismaClient.stock.findFirst({
          where: {
            product_id,
          },
        });
        if (!!isStockExist) {
          throw new Error("Product already has stock");
        }
        return await prismaClient.$transaction(async (trx) => {
          const stock = await trx.stock.create({
            data: {
              product_id,
              quantity,
              reorder_point: reorder_point ?? 0,
            },
          });
          const history = await trx.history.create({
            data: {
              quantity,
              type: "IN",
              stock: {
                connect: {
                  id: stock.id,
                },
              },
            },
          });
          return stock;
        });
      } catch (err) {
        throw new Error(`Something error occured: ${err.message}`);
      }
    },

    updateStock: async (
      _,
      { product_id, stock: { quantity, reorder_point, type, note } }
    ) => {
      try {
        const stock = await prismaClient.stock.findUnique({
          where: {
            product_id,
          },
        });
        const updatedStock = await prismaClient.$transaction(async (trx) => {
          const updatedStock = await trx.stock.update({
            where: {
              product_id: stock.product_id,
            },
            data: {
              quantity: {
                ...(type === "IN"
                  ? {
                      increment: quantity,
                    }
                  : {
                      decrement: quantity,
                    }),
              },
              reorder_point,
              updated_at: new Date(),
            },
          });

          if (type || note) {
            await trx.history.create({
              data: {
                stock: {
                  connect: {
                    id: updatedStock.id,
                  },
                },
                quantity,
                type,
                note,
              },
            });
          }

          return updatedStock;
        });

        // if (updatedStock.quantity <= updatedStock.reorder_point) {
        //   const response = await axios.post(
        //     `${process.env.PRODUCTION_REQUEST_URL}`,
        //     {
        //       query: `
        //         mutation createProductRequest($payload: CreateProductionRequestInput) {
        //           createProductionRequest(input: $payload) {
        //             request_id
        //             product_id
        //             quantity_requested
        //           }
        //         }
        //       `,
        //       variables: {
        //         payload: {
        //           product_id: updatedStock.product_id,
        //           quantity_requested: 100,
        //         },
        //       },
        //     }
        //   );
        //   const { data } = response.data;
        //   return {
        //     updatedStock,
        //     requestedData: data,
        //   };
        // }

        return updatedStock;
      } catch (err) {
        console.log(err.message);
        throw new Error(err.message);
      }
    },

    deleteStock: async (_, { product_id }) => {
      try {
        const productStock = await prismaClient.stock.findUnique({
          where: {
            product_id,
          },
        });
        if (!productStock) {
          throw new Error(`Product with id ${product_id} did not found`);
        }
        const deletedProduct = await prismaClient.stock.delete({
          where: {
            product_id,
          },
        });
        return productStock;
      } catch (err) {
        throw new Error(`Something error occured: ${err.message}`);
      }

      return deletedProduct;
    },

    requestFeedback: async (
      _,
      { payload: { batch_number, note, product_id, quantity } }
    ) => {
      console.log({ batch_number });
      try {
        return await prismaClient.feedbackRequest.create({
          data: {
            batch_number,
            status: "PENDING",
            note,
            product_id,
            quantity,
          },
        });
      } catch (err) {
        throw new Error(err.message);
      }
    },
  },

  Stock: {
    histories: async (parent) => {
      console.log({ parent });
      const histories = await prismaClient.history.findMany({
        where: {
          product_id: parent.product_id,
        },
      });
      return histories;
    },
  },
};
