
import React, { useState, useEffect } from 'react'
import { useApolloClient, useLazyQuery, useSubscription } from '@apollo/client'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import Birthyear from './components/Birthyear'
import LoginForm from './components/LoginForm'
import Recommend from './components/Recommend'
import { ME, BOOK_ADDED, ALL_BOOKS, FAVORITE_BOOKS } from './queries'

const Notify = ({ errorMessage }) => {
  if ( !errorMessage ) {
    return null
  }

  return (
    <div style={{color: 'red'}}>
      {errorMessage}
    </div>
  )
}

const App = () => {
  const [token, setToken] = useState(null)
  const [favoriteGenre, setFavoriteGenre] = useState(null)
  const [errorMessage, setErrorMessage] = useState(null)
  const [page, setPage] = useState('authors')
  const client = useApolloClient()
  const [getMe, meResult] = useLazyQuery(ME)

  useEffect(() => {
    const storedToken = localStorage.getItem('user-token')
    if(storedToken) {
      onTokenRetrieved(storedToken)
    }
  }, [])

  useEffect(() => {
    if(meResult.data && meResult.data.me) {
      setFavoriteGenre(meResult.data.me.favoriteGenre)
    }    
  }, [meResult.data])

  useSubscription(BOOK_ADDED, {
    onSubscriptionData: ({ subscriptionData }) => {
      const bookAdded = subscriptionData.data.bookAdded
      console.log(`${bookAdded.title} added`)
      notify(`${bookAdded.title} added`)
      updateCacheWith(bookAdded)
    }
  })

  const onTokenRetrieved = (token) => {
    setToken(token)
    localStorage.setItem('user-token', token)
    getMe()
  }

  const logout = () => {
    setToken(null)
    localStorage.clear()
    client.resetStore()
  }

  const notify = (message) => {
    setErrorMessage(message)
    setTimeout(() => {
      setErrorMessage(null)
    }, 5000)
  }

  const updateCacheWith = (addedBook) => {
    const includedIn = (set, object) => 
      set.map(p => p.id).includes(object.id)  

    const allInStore = client.readQuery({ query: ALL_BOOKS })
    if (!includedIn(allInStore.allBooks, addedBook)) {
      client.writeQuery({
        query: ALL_BOOKS,
        data: { allBooks : allInStore.allBooks.concat(addedBook) }
      })
    }
    
    if(addedBook.genres.indexOf(favoriteGenre) > -1) {
      const favoriteInStore = client.readQuery({ query: FAVORITE_BOOKS, variables: { genre: favoriteGenre || '' } })
      if (!includedIn(favoriteInStore.allBooks, addedBook)) {
        client.writeQuery({
          query: FAVORITE_BOOKS, 
          variables: { genre: favoriteGenre || '' },
          data: { allBooks : favoriteInStore.allBooks.concat(addedBook) }
        })
      }
    }
  }

  if (!token) {
    return (
      <div>
        <Notify errorMessage={errorMessage} />
        <h2>Login</h2>
        <LoginForm
          setToken={onTokenRetrieved}
          setError={notify}
        />
      </div>
    )
  }

  if (meResult.loading)  {
    return <div>loading...</div>
  }

  return (
    <div>
      <div>
        <button onClick={() => setPage('authors')}>authors</button>
        <button onClick={() => setPage('books')}>books</button>
        <button onClick={() => setPage('add')}>add book</button>
        <button onClick={() => setPage('recommend')}>recommend</button>
        <button onClick={() => setPage('setBirthyear')}>set birthyear</button>
        <button onClick={logout}>logout</button>
      </div>
      <Notify errorMessage={errorMessage} />

      <Authors
        show={page === 'authors'}
      />

      <Books
        show={page === 'books'}
      />

      <NewBook
        show={page === 'add'}
        setError={notify}
      />

      <Recommend
        show={page === 'recommend'}
        favoriteGenre={favoriteGenre}
      />

      <Birthyear
        show={page === 'setBirthyear'}
      />

    </div>
  )
}

export default App