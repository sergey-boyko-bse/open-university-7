import React, { useEffect, useState } from 'react'
import { useQuery } from '@apollo/client'
import { FAVORITE_BOOKS } from '../queries'

const Books = (props) => {
  const [favoriteBooks, setFavoriteBooks] = useState([])
  const result = useQuery(FAVORITE_BOOKS, { variables: { genre: props.favoriteGenre || '' } })

  useEffect(() => {
    if(result.data && result.data.allBooks) {
      setFavoriteBooks(result.data.allBooks)
    }
  }, [result.data])

  if (!props.show) {
    return null
  }
  
  if (result.loading)  {
    return <div>loading...</div>
  }

  return (
    <div>
      <h2>recommendations</h2>
      <p>in your favorite genre <em>{props.favoriteGenre || 'not set'}</em></p>
      <table>
        <tbody>
          <tr>
            <th></th>
            <th>
              author
            </th>
            <th>
              published
            </th>
          </tr>
          {favoriteBooks.map(a =>
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default Books