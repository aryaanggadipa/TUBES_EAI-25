# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install project dependencies
RUN npm install --legacy-peer-deps

# Copy the rest of the application code
COPY . .

# Make port 4004 available to the world outside this container
EXPOSE 4004

# Define environment variables (can be overridden in docker-compose)
ENV PORT=4004
ENV DATABASE_HOST=mysql_db
ENV DATABASE_USER=root
ENV DATABASE_PASSWORD=rootpassword
ENV DATABASE_NAME=stock_db
ENV MANUFACTURING_GRAPHQL_ENDPOINT=http://manufacturing_system_url/graphql
ENV ORDER_SERVICE_URL=http://order_service:4002/graphql

# Run the app when the container launches
CMD ["npm", "start"]
