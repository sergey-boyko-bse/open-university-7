require('dotenv').config()
const { ApolloServer, UserInputError, AuthenticationError, gql } = require('apollo-server')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')
const Book = require('./models/book')
const Author = require('./models/author')
const User = require('./models/user')

mongoose.set('useFindAndModify', false)

const MONGODB_URI = process.env.MONGODB_URI
const JWT_SECRET = process.env.JWT_SECRET
console.log('connecting to', MONGODB_URI)

mongoose.connect(MONGODB_URI, { useNewUrlParser: true })
  .then(() => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connection to MongoDB:', error.message)
  })

const typeDefs = gql`
  type User {
    username: String!
    favoriteGenre: String!
    id: ID!
  }

  type Token {
    value: String!
  }

  type Book {
    title: String!
    published: Int!
    author: Author!
    genres: [String!]!
    id: ID!
  }

  type Author {
    name: String!
    born: Int
    id: ID!
    bookCount: Int!
  }

  type Query {
    bookCount: Int!
    authorCount: Int!
    allBooks(author: String, genre: String): [Book!]!
    allAuthors: [Author!]!
    me: User
  }

  type Mutation {
    addBook(
        title: String!
        author: String
        published: Int!
        genres: [String!]!
    ): Book
    editAuthor(
        name: String!
        setBornTo: Int!
    ): Author
    createUser(
      username: String!
      favoriteGenre: String!
    ): User
    login(
      username: String!
      password: String!
    ): Token
  }
`

const resolvers = {
  Query: {
    bookCount: () => Book.collection.countDocuments(),
    authorCount: () => Author.collection.countDocuments(),
    allBooks: (root, args) => {
        if(args.author && !args.genre) {
            return Book.find({ author: args.author }).populate('author')
        }
        if(!args.author && args.genre) {
            return Book.find({ genres: args.genre }).populate('author')
        }
        if(args.author && args.genre) {
          return Book.find({ author: args.author, genres: args.genre }).populate('author')
        }
        return Book.find({}).populate('author')
    },
    allAuthors: async () => {
        const authors = await Author.find({})
        const booksByAuthors = await Book.aggregate([{
          $group: {
            _id: '$author',
            count: { $sum: 1 }
          }
        }])
        const result = authors.map(author => {
          const booksByAuthor = booksByAuthors.find(book => book._id.toString() === author._id.toString())
          return { id: author._id, name: author.name, born: author.born, bookCount: booksByAuthor ? booksByAuthor.count : 0 }
        })
        return result
    },
    me: (root, args, context) => {
        return context.currentUser
    }
  },
  Mutation: {
    addBook: async (root, args, context) => {
        const currentUser = context.currentUser
        if (!currentUser) {
          throw new AuthenticationError("not authenticated")
        }

        let author = await Author.findOne({ name: args.author })
        if(!author) {
          author = new Author({ name: args.author })
          try {
            await author.save()
          } catch (error) {
            throw new UserInputError(error.message, {
              invalidArgs: args,
            })
          }
        }
        const book = new Book({ ...args, author })
        await (await book.save()).populate("author")
        return book
    },
    editAuthor: async (root, args, context) => {
          const currentUser = context.currentUser
          if (!currentUser) {
            throw new AuthenticationError("not authenticated")
          }
        
          const author = await Author.findOne({ name: args.name })
          if(!author) {
              return null
          }
          author.born = args.setBornTo
          try {
            await author.save()
          } catch (error) {
            throw new UserInputError(error.message, {
              invalidArgs: args,
            })
          }
          const bookCount = await Book.find({ author: author._id }).count()
          return { id: author._id, name: author.name, born: author.born, bookCount }
    },
    createUser: (root, args) => {
        const user = new User({ username: args.username, favoriteGenre: args.favoriteGenre })
    
        return user.save()
          .catch(error => {
            throw new UserInputError(error.message, {
              invalidArgs: args,
            })
          })
    },
    login: async (root, args) => {
        const user = await User.findOne({ username: args.username })
    
        if ( !user || args.password !== 'secret' ) {
          throw new UserInputError("wrong credentials")
        }
    
        const userForToken = {
          username: user.username,
          id: user._id,
        }
    
        return { value: jwt.sign(userForToken, JWT_SECRET) }
    }
  }
}

const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const auth = req ? req.headers.authorization : null
      if (auth && auth.toLowerCase().startsWith('bearer ')) {
        const decodedToken = jwt.verify(
          auth.substring(7), JWT_SECRET
        )
        const currentUser = await User.findById(decodedToken.id)
        return { currentUser }
      }
    }
})

server.listen().then(({ url }) => {
    console.log(`Server ready at ${url}`)
})