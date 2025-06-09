import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import dotenv from "dotenv";
import { rootResolver } from "./resolver.js";
import { typeDefinitions } from "./typeDefs.js";
import { startStandaloneServer } from "@apollo/server/standalone";
dotenv.config();

const init = async () => {
  const apolloInstance = new ApolloServer({
    typeDefs: typeDefinitions,
    resolvers: rootResolver,
  });

  const app = express();

  await apolloInstance.start();

  app.use(
    "/graphql",
    express.json(),
    cors(),
    expressMiddleware(apolloInstance)
  );

  app.listen(+process.env.PORT_APP ?? 9001, () =>
    console.log(`Server running on port ${process.env.PORT_APP ?? 9001}`)
  );
};

init().catch((err) => console.log(err));
