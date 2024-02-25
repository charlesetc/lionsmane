/** @jsx jsx */
/** @jsxFrag Fragment */

import { jsx, Fragment } from 'https://deno.land/x/hono/middleware.ts'
import { Hono } from 'https://deno.land/x/hono/mod.ts'
import { kv } from './kv.js'
import { nanoid } from "https://deno.land/x/nanoid/mod.ts"
import * as scrypt from "https://deno.land/x/scrypt/mod.ts";

const app = new Hono();

app.get('/users', async (c) => {
  const users = [];
  for await (const {key: _, value} of kv.list({prefix: ["users", "id"]})) {
    users.push(value)
  }

  return c.render(
    <>
      <a href="/">Back</a>
      <ul>
        {users.map((user) => (
          <li>{user.name} | {user.email}</li>
        ))}
      </ul>
    </>
    , { title: 'Users' }
  )
})

app.post('/signup', async (c) => {
  const {name, email, password} = Object.fromEntries(await c.req.formData())

  const user = (await kv.get(["users", "email", email])).value
  if (user) {
    c.flash.add("User already exists")
    return c.redirect('/signup')
  }

  const hash = await scrypt.hash(password, {logN: 8})
  const id = nanoid(8)

  await kv.set(["users", "id", id], {
    id,
    name,
    email,
    hash,
  })

  await kv.set(["users", "email", email], id)

  c.session().set('user', id)

  return c.redirect('/')
})


app.get('/signup', (c) => {
  return c.render(
    <>
      <a href="/">Back</a>
      <form method='POST' action='/signup' class='signup'>
        <input required type="text" name="name" placeholder="First Name" />
        <input required type="email" name="email" placeholder="Email" />
        <input required type="password" name="password" placeholder="Password" />
        <button type="submit">Sign up</button>
      </form>
    </>,
    { title: 'Sign up', layout: 'signuplogin' }
  )
})

app.post('/login', async (c) => {
  const {email, password} = Object.fromEntries(await c.req.formData())
  const userid = (await kv.get(["users", "email", email])).value
  if (!userid) {
    c.flash.add("Invalid email or password")
    return c.redirect('/login')
  }

  const user = (await kv.get(["users", "id", userid])).value
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
        <input required type="email" name="email" placeholder="Email" />
        <input required type="password" name="password" placeholder="Password" />
        <button type="submit">Log in</button>
      </form>
    </>
    , { title: 'Log in', layout: 'signuplogin' }
  )
})

app.get('/logout', (c) => {
  c.session().deleteSession()
  return c.redirect('/')
})


export default app
