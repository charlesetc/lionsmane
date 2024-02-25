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
  await kv.set(["discussions", discussion_id], {
    id: discussion_id,
    title,
    author: user.id,
  })

  const post_id = nanoid()
  kv.set(["posts", discussion_id, post_id], {
    id: post_id,
    content,
    author: user.id,
    discussion: discussion_id,
  })

  return c.redirect('/discussions')
})

// NOTE: Make sure this is the last route in the file
// because it's a catch-all route
app.get('/:id', async (c) => {
  const discussion_id = c.req.param('id')
  const discussion = (await kv.get(["discussions", discussion_id])).value

  if (!discussion) {
    return c.notFound()
  }

  const posts = []

  for await (const {key: _, value} of kv.list({prefix: ["posts", discussion_id]})) {
    posts.push(value)
  }

  return c.render(
    <>
      <a href="/discussions">Back</a>
      {posts.map((post) => <Post post={post} />)}
    </>
    , { title: discussion.title }
  )
})

async function Post({post}) {
  const author = (await kv.get(["users", "id", post.author])).value
  return (
    <div class='post'>
      <a href={`/users/${author.id}`} class='author'>{author.name}</a>
      <p class='content'>{post.content}</p>
    </div>
  )
}

export default app
