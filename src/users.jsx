/** @jsx jsx */
/** @jsxFrag Fragment */

import { jsx, Fragment } from 'https://deno.land/x/hono/middleware.ts'
import { Hono } from 'https://deno.land/x/hono/mod.ts'
import * as scrypt from "https://deno.land/x/scrypt/mod.ts";
import { Users, Discussions, Comments } from "./tables.js"
import { date } from "./helpers.js"

const app = new Hono();

async function DiscussionCard({discussion, author}) { 
  return ( 
    <div class='card'>
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



app.get('/users', async (c) => {
  const users = await Users.all()
  return c.render(
    <>
      <a href="/">Back</a>
      <ul>
        {users.map((user) => (
          <li>
            <a href={`/users/${user.id}`}>
              {user.name}
            </a>
          </li>
        ))}
      </ul>
    </>
    , { title: 'Users' }
  )
})

app.post('/signup', async (c) => {
  const {name, email, password} = Object.fromEntries(await c.req.formData())
  const existing = await Users.find({ email })
  if (existing) {
    c.flash.add("User already exists")
    return c.redirect('/signup')
  }

  const hash = await scrypt.hash(password, {logN: 8})
  const user = await Users.create({
    name,
    email,
    hash,
  }, "U", 8)

  c.session().set('user', user.id)
  return c.redirect('/')
})


app.get('/signup', (c) => {
  return c.render(
    <>
      <a href="/">Back</a>
      <form method='POST' action='/signup' class='signup'>
        <input required autofocus type="text" name="name" placeholder="First Name" />
        <input required type="email" name="email" placeholder="Email" />
        <input required type="password" name="password" placeholder="Password" />
        <button class='grey' type="submit">Sign up</button>
      </form>
    </>,
    { title: 'Sign up', layout: 'signuplogin' }
  )
})

app.post('/login', async (c) => {
  const {email, password} = Object.fromEntries(await c.req.formData())
  const user = await Users.find({ email })
  if (!user) {
    c.flash.add("Invalid email or password")
    return c.redirect('/login')
  }
  
  const valid = await scrypt.verify(password, user.hash)
  
  if (!valid) {
    c.flash.add("Invalid email or password")
    return c.redirect('/login')
  }

  c.session().set('user', user.id)
    
  return c.redirect('/')
})


app.get('/login', (c) => {
  return c.render(
    <>
      <a href="/">Back</a>

      <form  method='POST' action='/login' class='login'>
        <input required autofocus type="email" name="email" placeholder="Email" />
        <input required type="password" name="password" placeholder="Password" />
        <button class='grey' type="submit">Log in</button>
      </form>
    </>
    , { title: 'Log in', layout: 'signuplogin' }
  )
})

app.get('/logout', (c) => {
  c.session().deleteSession()
  return c.redirect('/')
})

async function discussions_user_commented_on(user) {
  const comments_by_user = await Comments.list({author: user.id});
  const discussion_ids = new Set(comments_by_user.map((comment) => comment.discussion))

  const discussions = []
  for (const id of discussion_ids) {
    const discussion = await Discussions.find({id})
    discussions.push(discussion)
  } 
  return discussions
}

app.get('/users/:id', async (c) => {
  const user = await Users.find({ id: c.req.param('id') })
  if (!user) return c.notFound()
  let started = await Discussions.list({author: user.id})
  let commented = await discussions_user_commented_on(user)
  commented = commented.filter((discussion) => discussion.author !== user.id)

  return c.render(
    <>
      <a href="/">Home</a>
      <h2>Started</h2>
      <div class='card-list'>
        {started.map((discussion) => <DiscussionCard discussion={discussion} author={user} />)}
      </div>

      <h2>Commented</h2>
      <div class='card-list'>
        {commented.map((discussion) => <DiscussionCard discussion={discussion} author={user} />)}
      </div>
    </>
    , { title: user.name }
  )
})


export default app
