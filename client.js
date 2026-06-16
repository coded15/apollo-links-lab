/**
 * client.js — Apollo Client with a Link Chain
 *
 * PURPOSE: Demonstrates how Apollo Links work as a middleware chain.
 * Each link can inspect/modify the operation before passing it forward,
 * and inspect/modify the response coming back.
 *
 * LINK CHAIN FLOW:
 *   Your Query
 *     → loggingLink (logs the operation name + timing)
 *       → authLink (attaches an Authorization header)
 *         → errorLink (catches errors on the way back)
 *           → httpLink (actually sends the request to the server)
 *     ← response flows back through the chain
 *
 * Run with: npm run client  (make sure server is running first!)
 */

import fetch from "cross-fetch";
import { ApolloClient, InMemoryCache, gql, HttpLink, ApolloLink, from } from "@apollo/client/core/index.js";
import { onError } from "@apollo/client/link/error/index.js";

// =============================================================================
// LINK 1: HttpLink (TERMINATING LINK)
// =============================================================================
// This is always the LAST link in the chain. It's the one that actually
// sends the HTTP request to your GraphQL server.
// Every link chain MUST end with a terminating link.
const httpLink = new HttpLink({
  uri: "http://localhost:4000/",
  fetch, // We pass cross-fetch since we're in Node.js (browsers have fetch built-in)
});

// =============================================================================
// LINK 2: Logging Link (CUSTOM MIDDLEWARE)
// =============================================================================
// A custom link that logs every operation's name and how long it took.
// `forward(operation)` passes the operation to the next link in the chain.
// `.map(response => ...)` lets you inspect/modify the response on its way back.
const loggingLink = new ApolloLink((operation, forward) => {
  const startTime = Date.now();
  console.log(`[LOG] Starting operation: ${operation.operationName}`);

  return forward(operation).map((response) => {
    const duration = Date.now() - startTime;
    console.log(`[LOG] Operation ${operation.operationName} took ${duration}ms`);
    return response; // Always return the response to continue the chain
  });
});

// =============================================================================
// LINK 3: Auth Link (CUSTOM MIDDLEWARE)
// =============================================================================
// Attaches an Authorization header to every request.
// In a real app, you'd read from localStorage or a token manager.
const authLink = new ApolloLink((operation, forward) => {
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: "Bearer my-fake-token-12345",
    },
  }));

  console.log(`[AUTH] Attached auth header to: ${operation.operationName}`);
  return forward(operation); // Pass to next link
});

// =============================================================================
// LINK 4: Error Link (ERROR HANDLING)
// =============================================================================
// Catches GraphQL errors and network errors separately.
// graphQLErrors: errors returned in the response body (e.g., validation errors)
// networkError: connection failures, 500s, timeouts, etc.
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL Error] Message: ${message}, Path: ${path}, Location: ${JSON.stringify(locations)}`
      );
    });
  }
  if (networkError) {
    console.error(`[Network Error] ${networkError.message}`);
    console.error(`  → Is the server running? Try: npm run server`);
  }
});

// =============================================================================
// COMPOSE THE CHAIN with `from()`
// =============================================================================
// `from()` composes links left-to-right. The request flows through them in order.
// The LAST one must be a terminating link (httpLink).
//
// Order matters! The request goes:
//   loggingLink → authLink → errorLink → httpLink
//
// The response comes back in REVERSE:
//   httpLink → errorLink → authLink → loggingLink
const link = from([loggingLink, authLink, errorLink, httpLink]);

// =============================================================================
// CREATE THE CLIENT
// =============================================================================
const client = new ApolloClient({
  link, // Our composed link chain
  cache: new InMemoryCache(), // Required — caches query results
});

// =============================================================================
// MAKE SOME QUERIES
// =============================================================================
console.log("\n--- Query 1: hello ---\n");

try {
  const helloResult = await client.query({
    query: gql`
      query Hello {
        hello
      }
    `,
  });
  console.log(`[RESULT] ${helloResult.data.hello}\n`);
} catch (e) {
  console.error("Query failed:", e.message);
}

console.log("\n--- Query 2: books ---\n");

try {
  const booksResult = await client.query({
    query: gql`
      query GetBooks {
        books {
          title
          author
        }
      }
    `,
  });
  console.log("[RESULT] Books:");
  booksResult.data.books.forEach((book) => {
    console.log(`  • "${book.title}" by ${book.author}`);
  });
} catch (e) {
  console.error("Query failed:", e.message);
}

console.log("\n--- Done! ---");
console.log("Try modifying the links above to experiment.");
console.log("Ideas:");
console.log("  • Add a retry link that retries failed requests");
console.log("  • Add a link that adds a custom header");
console.log("  • Remove the authLink and see the difference");
console.log("  • Make the errorLink retry on network failure");
