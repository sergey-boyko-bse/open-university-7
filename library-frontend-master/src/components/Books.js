import React, { useState } from 'react'
import { useQuery } from '@apollo/client'
import { ALL_BOOKS } from '../queries'

const Books = (props) => {
  const result = useQuery(ALL_BOOKS)
  const [ genre, setGenre] = useState('')
  const distinct = (value, index, self) => self.indexOf(value) === index

  if (!props.show) {
    return null
  }
  
  if (result.loading)  {
    return <div>loading...</div>
  }

  const genres = [].concat(...result.data.allBooks.map(x => x.genres)).filter(distinct)
  const filteredBooks = genre ? result.data.allBooks.filter(book => book.genres && book.genres.indexOf(genre) > -1) : result.data.allBooks

  return (
    <div>
      <h2>books</h2>
      {genre ? <p>in genre <em>{genre}</em></p> : ''}
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
          {filteredBooks.map(a =>
            <tr key={a.title}>
              <td>{a.title}</td>
              <td>{a.author.name}</td>
              <td>{a.published}</td>
            </tr>
          )}
        </tbody>
      </table>
      <div>
        {genres.map(genre => <button key={genre} onClick={() => { setGenre(genre) }}>{genre}</button>)}
        <button onClick={() => { setGenre('') }}>all genres</button>
      </div>
    </div>
  )
}

export default Books