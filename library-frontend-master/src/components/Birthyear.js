import React, { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { ALL_AUTHORS, EDIT_AUTHOR } from '../queries'

const Birthyear = (props) => {
  const [name, setName] = useState('')
  const [born, setBorn] = useState('')

  const [ editAuthor ] = useMutation(EDIT_AUTHOR, {
    refetchQueries: [ 
      { query: ALL_AUTHORS }
    ]
  })

  const authors = useQuery(ALL_AUTHORS)

  if (!props.show) {
    return null
  }

  const submit = async (event) => {
    event.preventDefault()
    
    editAuthor({ variables: { name, setBornTo: Number(born) }})

    setName('')
    setBorn('')
  }

  return (
    <div>
      <form onSubmit={submit}>
        <div>
          name
          <select value={name} onChange={({ target }) => setName(target.value)}>
            <option value=''>Select author</option>
              {
                  authors.loading
                  ? ''
                  : authors.data.allAuthors.map(a =>
                    <option key={a.name} value={a.name}>{a.name}</option>
                  )
              }
          </select> 
        </div> 
        <div>
          born
          <input
            value={born}
            onChange={({ target }) => setBorn(target.value)}
          />
        </div>
        <button type='submit'>update author</button>
      </form>
    </div>
  )
}

export default Birthyear