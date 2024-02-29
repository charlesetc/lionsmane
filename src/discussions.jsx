/** @jsx jsx */
/** @jsxFrag Fragment */

import { jsx, Fragment } from 'https://deno.land/x/hono/middleware.ts'
import { Hono } from 'https://deno.land/x/hono/mod.ts'
import { Discussions, Comments, Users } from "./tables.js"
import { date } from "./helpers.js"

const app = new Hono();

async function DiscussionCard({discussion}) { 
  const author = await Users.find({id: discussion.author})
  return ( 
    <div class='discussion-card'>
      <span>
        <a href={`/discussions/${discussion.id}`}>{discussion.title}</a>
      </span>
      <span>
        <a href={`/users/${author.id}`} class='author'>{author.name}</a> &mdash;&nbsp;
        {date(discussion.created_at)}
      </span>
    </div>
  )
}

app.get('/', async (c) => {
  let discussions = await Discussions.all()
  discussions = discussions.sort((a, b) => a.created_at - b.created_at)

  return c.render(
    <>
      <a href="/">Back</a>

      <div class='discussion-list'>
        {discussions.map((discussion) => <DiscussionCard discussion={discussion} />)}
      </div>

      <a class='button grey' href="/discussions/new">Start a new discussion</a>
    </>
    , { title: 'Discussions' }
  )
})

app.get('/new', async (c) => {
  return c.render(
    <>
      <a href="/discussions">Back</a>
      <form class='wideform' action="/discussions/new" method="post">
        <input required type="text" name="title" placeholder="Title" />
        <textarea fancy="true" required name="content" placeholder="Content"></textarea>
        <button type="submit">Create</button>
      </form>
    </>
    , { title: 'New Discussion', }
  )
})

app.post('/new', async (c) => {
  const user = await c.current_user()
  if (!user) return c.redirect('/login')

  const {title, content} = Object.fromEntries(await c.req.formData())

  const discussion = await Discussions.create({
    title,
    author: user.id,
    content,
  })

  return c.redirect(`/discussions/${discussion.id}`)
})

app.post('/:id/newcomment', async (c) => {
  const user = await c.current_user()
  if (!user) return c.redirect('/login')

  const {content} = Object.fromEntries(await c.req.formData())
  const discussion = await Discussions.find({ id: c.req.param('id') })
  if (!discussion) {
    return c.notFound()
  }

  Comments.create({
    content,
    author: user.id,
    discussion: discussion.id,
  })
  
  return c.redirect(`/discussions/${discussion.id}?scroll=true`)
})

// NOTE: Make sure this is the last route in the file
// because it's a catch-all route
app.get('/:id', async (c) => {
  const discussion = await Discussions.find({ id: c.req.param('id') })
  if (!discussion) {
    return c.notFound()
  }

  let comments = await Comments.list({ discussion: discussion.id })
  comments = comments.sort((a, b) => a.created_at - b.created_at)
  const author = await Users.find({id: discussion.author})
  return c.render(
    <div class='discussion'>
      <p class='author-and-date'>
        <a href={`/users/${author.id}`} class='author'>{author.name}</a> &mdash;&nbsp;
        {date(discussion.created_at)}
      </p>

      <a href="/discussions">Back</a>


      <div class='content'>
        <pre>{discussion.content}</pre>
      </div>

      {comments.map((comment) => <Comment comment={comment} />)}
      
      <form class='wideform' method="post" action={`/discussions/${discussion.id}/newcomment`}>
        <textarea fancy='true' required name="content" placeholder="Comment"></textarea>
        <button type="submit">Comment</button>
      </form>
    </div>
    , { title: discussion.title }
  )
})

async function Comment({comment}) {
  const author = await Users.find({ id: comment.author })
  return (
    <div class='comment'>
      <a href={`/users/${author.id}`} class='author'>{author.name}</a>
      <p class='date'>{date(comment.created_at)}</p>
      <pre class='content'>{comment.content}</pre>
    </div>
  )
}

export default app
