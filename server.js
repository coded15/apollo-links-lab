/**
 * server.js — A minimal Apollo Server
 *
 * PURPOSE: This gives your Apollo Client (with Links) something to talk to.
 * It defines a simple schema with a "hello" query and a "books" query
 * so you can test different Link behaviors.
 *
 * Run with: npm run server
 */

import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

// --- SCHEMA ---
// This defines what queries the server supports.
const typeDefs = `#graphql
  type Book {
    title: String
    author: String
  }

  type Query {
    hello: String
    books: [Book]
  }
`;

// --- RESOLVERS ---
// These are the functions that run when a query is made.
const resolvers = {
  Query: {
    hello: () => "Hello from Apollo Server!",
    books: () => [
      { title: "The Great Gatsby", author: "F. Scott Fitzgerald" },
      { title: "1984", author: "George Orwell" },
      { title: "Dune", author: "Frank Herbert" },
    ],
  },
};

// --- START SERVER ---
const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`🚀 Server ready at ${url}`);
console.log(`   Try running: npm run client`);
