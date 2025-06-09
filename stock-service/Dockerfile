FROM node:18

WORKDIR /app
COPY package*.json .
RUN npm install
COPY . .
CMD ["sh", "-c", "npx prisma db push && npx prisma generate && node index.js"]
