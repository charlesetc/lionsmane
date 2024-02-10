/** @jsx jsx */
/** @jsxFrag Fragment */

import { Hono } from 'https://deno.land/x/hono/mod.ts'
import {
  csrf,
  compress,
  logger,
  jsx,
  Fragment,
  serveStatic,
  jsxRenderer,
  useRequestContext
} from 'https://deno.land/x/hono/middleware.ts'
import * as scrypt from "https://deno.land/x/scrypt/mod.ts";
import sessions from './session.js'
import { kv } from './kv.js'
import flash from './flash.js'

const app = new Hono();

app.use(logger())
app.use(compress())
app.use(csrf())
app.use(flash)
sessions(app)

async function Flashes() {
  const c = useRequestContext()
  const flashes = await c.flash.get()
  console.log({flashes})
  await c.flash.clear()
  return (
    <>
      {flashes.map((flash) => (
        <div class="flash">{flash}</div>
      ))}
    </>
  )
}

app.use('/*',
  jsxRenderer(({ children, title }) => {
    return (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{title || "Lionsmane"}</title>
          <script src="https://unpkg.com/htmx.org@1.9.10"></script>
          <link rel="stylesheet" href="/main.css" />
        </head>

        <body hx-boost='true'>
          <Flashes />

          {children}
        </body>
      </html>
    )
  })
)

function LandingPage() {
  return (
    <>
      <h1>Lionsmane</h1>

      <p>
        The world we have is too complex to make sense of alone; the problems we’re
        facing too important to tolerate distraction in the name of ad revenue.
      </p>

      <a class='button' href="/signup">Sign up</a>
      <a class='button' href="/login">Log in</a>
    </>
  )
}

function Dashboard({user}) {
  return (
    <>
      <h1>Lionsmane</h1>
      <p>Logged in as {user.name} | {user.email} <a href="/logout">Log out</a></p>
    </>
  )
}


app.get('/', async (c) => {
  const email = c.session().get('email')
  if (email) {
    const user = (await kv.get(["users", email])).value
    return c.render(<Dashboard user={user} />, { title: 'Lionsmane' })
  } else {
    return c.render(<LandingPage />, { title: 'Lionsmane' })
  }
})

app.post('/signup', async (c) => {
  const {name, email, password} = Object.fromEntries(await c.req.formData())

  const user = (await kv.get(["users", email])).value
  if (user) {
    c.flash.add("User already exists")
    return c.redirect('/signup')
  }

  const hash = await scrypt.hash(password, {logN: 8})

  await kv.set(["users", email], {
    name,
    email,
    hash,
  })
  c.session().set('email', email)

  return c.redirect('/')
})



app.get('/signup', (c) => {
  return c.render(
    <>
      <h1>Lionsmane</h1>

      <a href="/">Back</a>

      <form method='POST' action='/signup' class='signup'>
        <input required type="text" name="name" placeholder="Name" />
        <input required type="email" name="email" placeholder="Email" />
        <input required type="password" name="password" placeholder="Password" />
        <button type="submit">Sign up</button>
      </form>
    </>,
  )
})

app.post('/login', async (c) => {
  const {email, password} = Object.fromEntries(await c.req.formData())
  const user = (await kv.get(["users", email])).value
  
  if (!user) {
    c.flash.add("Invalid email or password")
    return c.redirect('/login')
  }
  
  const valid = await scrypt.verify(password, user.hash)
  
  if (!valid) {
    c.flash.add("Invalid email or password")
    return c.redirect('/login')
  }

  c.session().set('email', email)
    
  return c.redirect('/')
})


app.get('/login', (c) => {
  return c.render(
    <>
      <h1>Lionsmane</h1>

      <a href="/">Back</a>

      <form  method='POST' action='/login' class='login'>
        <input required type="email" name="email" placeholder="Email" />
        <input required type="password" name="password" placeholder="Password" />
        <button type="submit">Log in</button>
      </form>
    </>
  )
})

app.get('/logout', (c) => {
  c.session().deleteSession()
  return c.redirect('/')
})

app.use('/*', serveStatic({ root: './assets' }))
    

Deno.serve(app.fetch)
