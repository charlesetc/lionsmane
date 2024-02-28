/** @jsx jsx */
/** @jsxFrag Fragment */

import { jsx, Fragment } from 'https://deno.land/x/hono/middleware.ts'
import { Hono } from 'https://deno.land/x/hono/mod.ts'
import { nanoid } from "https://deno.land/x/nanoid/mod.ts"
import { Discussions, Comments } from "./tables.js"

const app = new Hono();

app.get('/', async (c) => {
  const discussions = await Discussions.all()
  return c.render(
    <>
      <a href="/">Back</a>
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
  const user = await c.current_user()
  if (!user) return c.redirect('/login')

  const {title, content} = Object.fromEntries(await c.req.formData())
 
  const discussion_id = nanoid(10)

  Discussions.save({
    id: discussion_id,
    title,
    author: user.id,
    content,
  })

  return c.redirect('/discussions')
})

// NOTE: Make sure this is the last route in the file
// because it's a catch-all route
app.get('/:id', async (c) => {
  const discussion = await Discussions.find({ id: c.req.param('id') })

  if (!discussion) {
    return c.notFound()
  }

  const comments = await Comments.list({ discussion: discussion.id })
  return c.render(
    <>
      <a href="/discussions">Back</a>
      {comments.map((comment) => <Comment comment={comment} />)}
      
      <a class='new-comment'>New Comment</a>
    </>
    , { title: discussion.title }
  )
})

async function Comment({comment}) {
  const author = (await kv.get(["users", "id", comment.author])).value
  return (
    <div class='comment'>
      <a href={`/users/${author.id}`} class='author'>{author.name}</a>
      <p class='content'>{comment.content}</p>
    </div>
  )
}

export default app
