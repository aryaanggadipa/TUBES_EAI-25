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
  },
  Mutation: {
    addStock: async (_, { stock: { product_id, quantity, reorder_point } }) => {
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
    },

    updateStock: async (
      _,
      { stock_id, stock: { quantity, reorder_point, type, note } }
    ) => {
      try {
        const updatedStock = await prismaClient.$transaction(async (trx) => {
          const updatedStock = await trx.stock.update({
            where: {
              id: stock_id,
            },
            data: {
              quantity,
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

        if (updatedStock.quantity <= updatedStock.reorder_point) {
          const response = await axios.post(
            `${process.env.PRODUCTION_REQUEST_URL}`,
            {
              query: `
                mutation createProductRequest($payload: CreateProductionRequestInput) {
                  createProductionRequest(input: $payload) {
                    request_id
                    product_id
                    quantity_requested
                  }
                }
              `,
              variables: {
                payload: {
                  product_id: updatedStock.product_id,
                  quantity_requested: 100,
                },
              },
            }
          );
          const { data } = response.data;
          return {
            updatedStock,
            requestedData: data,
          };
        }

        return updatedStock;
      } catch (err) {
        console.log(err.message);
        throw new Error(err.message);
      }
    },
  },

  Stock: {
    histories: async (parent) => {
      const histories = await prismaClient.history.findMany({
        where: {
          stock_id: parent.id,
        },
      });
      return histories;
    },
  },
};
