/** @jsx jsx */
/** @jsxFrag Fragment */

import { jsx, Fragment } from 'https://deno.land/x/hono/middleware.ts'
import { Hono } from 'https://deno.land/x/hono/mod.ts'
import { nanoid } from "https://deno.land/x/nanoid/mod.ts"
import { kv } from './kv.js'

const app = new Hono();

app.get('/', async (c) => {
  const discussions = [];
  for await (const {key: _, value} of kv.list({prefix: ["discussions"]})) {
    discussions.push(value)
  }

  return c.render(
    <>
      <ul>
        {discussions.map((discussion) => (
          <li><a href={`/discussions/${discussion.id}`}>{discussion.title}</a></li>
        ))}
      </ul>

    <a href="/discussions/new">Start a new discussion</a>

    </>
    , { title: 'Discussions' }
  )
})

app.get('/new', async (c) => {
  return c.render(
    <>
      <a href="/discussions">Back</a>
      <form action="/discussions/new" method="post">
        <input required type="text" name="title" placeholder="Title" />
        <textarea required name="content" placeholder="Content"></textarea>
        <button type="submit">Create</button>
      </form>
    </>
    , { title: 'New Discussion', 
        styles: `
          form {
            margin-top: 1rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          input, textarea {
            padding: 0.5rem;
          }
          button {
            padding: 0.5rem;
            background-color: #333;
            color: white;
            border: none;
            cursor: pointer;
          }
      `
    }
  )
})

app.post('/new', async (c) => {
  const {title, content} = Object.fromEntries(await c.req.formData())
  
  const id = nanoid()
  await kv.set(["discussions", id], {
    id,
    title,
    content,
  })
  
  return c.redirect('/discussions')
})

app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const discussion = (await kv.get(["discussions", id])).value

  console.log(c)
  if (!discussion) {
    return c.notFound()
  }

  return c.render(
    <>
      <p>{discussion.content}</p>
    </>
    , { title: discussion.title }
  )
})


export default app
