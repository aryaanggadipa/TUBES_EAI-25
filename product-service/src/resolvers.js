// product-service/src/resolvers.js
`src/resolvers.js`
// GraphQL Resolvers
const db = require('./db');

const resolvers = {
  Query: {
    products: async () => {
      try {
        const [rows] = await db.query('SELECT * FROM products');
        return rows;
      } catch (error) {
        console.error('Error fetching products:', error);
        throw new Error('Failed to fetch products');
      }
    },
    product: async (_, { product_id }) => {
      try {
        const [rows] = await db.query('SELECT * FROM products WHERE product_id = ?', [product_id]);
        if (rows.length === 0) {
          return null; // Or throw new Error('Product not found');
        }
        return rows[0];
      } catch (error) {
        console.error(`Error fetching product ${product_id}:`, error);
        throw new Error('Failed to fetch product');
      }
    },
  },
  Mutation: {
    addProduct: async (_, { product_name, description, category_id, base_price, default_image_url }) => {
      try {
        const [result] = await db.query(
          'INSERT INTO products (product_name, description, category_id, base_price, default_image_url) VALUES (?, ?, ?, ?, ?)',
          [product_name, description, category_id, base_price, default_image_url]
        );
        const insertedId = result.insertId;
        return { product_id: insertedId, product_name, description, category_id, base_price, default_image_url };
      } catch (error) {
        console.error('Error adding product:', error);
        throw new Error('Failed to add product');
      }
    },
    updateProduct: async (_, { product_id, product_name, description, category_id, base_price, default_image_url }) => {
      try {
        // Fetch current product to merge undefined fields
        const [currentProductRows] = await db.query('SELECT * FROM products WHERE product_id = ?', [product_id]);
        if (currentProductRows.length === 0) {
          throw new Error('Product not found for update');
        }
        const currentProduct = currentProductRows[0];

        const pName = product_name !== undefined ? product_name : currentProduct.product_name;
        const desc = description !== undefined ? description : currentProduct.description;
        const catId = category_id !== undefined ? category_id : currentProduct.category_id;
        const price = base_price !== undefined ? base_price : currentProduct.base_price;
        const imgUrl = default_image_url !== undefined ? default_image_url : currentProduct.default_image_url;

        await db.query(
          'UPDATE products SET product_name = ?, description = ?, category_id = ?, base_price = ?, default_image_url = ? WHERE product_id = ?',
          [pName, desc, catId, price, imgUrl, product_id]
        );
        return { product_id, product_name: pName, description: desc, category_id: catId, base_price: price, default_image_url: imgUrl };
      } catch (error) {
        console.error(`Error updating product ${product_id}:`, error);
        throw new Error('Failed to update product');
      }
    },
    deleteProduct: async (_, { product_id }) => {
        try {
            const [rows] = await db.query('SELECT * FROM products WHERE product_id = ?', [product_id]);
            if (rows.length === 0) {
              throw new Error('Product not found for deletion');
            }
            const productToDelete = rows[0];
            await db.query('DELETE FROM products WHERE product_id = ?', [product_id]);
            return productToDelete; // Return the deleted product data
        } catch (error) {
            console.error(`Error deleting product ${product_id}:`, error);
            throw new Error('Failed to delete product');
        }
    }
  },
};

module.exports = resolvers;