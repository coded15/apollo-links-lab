import {ApolloServer} from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
const typeDefs = `#graphql

    type Book{
        title: String
        author: String
    }
    type Query{
        hello: String
        books: [Book]
    }

`;
const resolvers = 
{
    Query:{
        hello: ()=> "Hello from Ichchha's apollo server",
        books: () => [
            {title: "After Dark", author: "Haruki Murakami"}, {title: "What I talk about, when I talk about running", author: "Haruki Murakami"}, {title: "7 husbands of Evelyn Hugo", author:""}
        ]
    }
}
const server = new ApolloServer({typeDefs, resolvers});

const {url} = await startStandaloneServer(server, {listen: {port: 4000}});
console.log(`Server running at url: ${url}`);
console.log(`Try running: npm run client`);