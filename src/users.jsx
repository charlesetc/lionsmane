/** @jsx jsx */
/** @jsxFrag Fragment */

import { jsx, Fragment } from 'https://deno.land/x/hono/middleware.ts'
import { Hono } from 'https://deno.land/x/hono/mod.ts'
import { nanoid } from "https://deno.land/x/nanoid/mod.ts"
import * as scrypt from "https://deno.land/x/scrypt/mod.ts";
import { Users } from "./tables.js"

const app = new Hono();

app.get('/users', async (c) => {
  const users = await Users.all()
  return c.render(
    <>
      <a href="/">Back</a>
      <ul>
        {users.map((user) => (
          <li>
            <a href={`/users/${user.id}`}>
              {user.name} | {user.email}
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
  const user = await Users.find({ email })
  if (user) {
    c.flash.add("User already exists")
    return c.redirect('/signup')
  }

  const hash = await scrypt.hash(password, {logN: 8})
  const id = "U-" + nanoid(8)

  await Users.save({
    id,
    name,
    email,
    hash,
  })

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

app.get('/users/:id', async (c) => {
  const user = await Users.find({ id: c.req.param('id') })
  if (!user) return c.notFound()

  return c.render(
    <>
      <a href="/">Home</a>
      <p>{user.email}</p>
    </>
    , { title: user.name }
  )
})


export default app
