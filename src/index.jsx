/** @jsx jsx */
/** @jsxFrag Fragment */

import { Hono } from 'https://deno.land/x/hono/mod.ts'
import { jsx, Fragment, serveStatic, jsxRenderer, useRequestContext } from 'https://deno.land/x/hono/middleware.ts'

const app = new Hono();
const kv = await Deno.openKv();

app.get('/*',
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
          {children}
        </body>
      </html>
    )
  })
)


app.get('/', (c) => {
  const id = kv['id'] ? kv['id'] + 1 : 1
  kv['id'] = id
  return c.render(
    <>
      <h1>Lionsmane</h1>

      <p>
    This site has been visited {id} times.
    </p>


      <p>
        The world we have is too complex to make sense of alone; the problems we’re
        facing too important to tolerate distraction in the name of ad revenue.
      </p>

      <a class='button' href="/signup">Sign up</a>
      <a class='button' href="/login">Log in</a>
    </>, 
    { 
      title: 'Lionsmane'
    }
  )
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

app.get('/login', (c) => {
  return c.render(
    <>
      <h1>Lionsmane</h1>

      <a href="/">Back</a>

      <form  method='POST' action='/login' class='login'>
        <input required type="text" name="name" placeholder="Name" />
        <input required type="email" name="email" placeholder="Email" />
        <input required type="password" name="password" placeholder="Password" />
        <button type="submit">Log in</button>
      </form>
    </>
  )
})

app.post('/signup', async (c) => {
  const {name, email, password} = Object.fromEntries(await c.req.formData())
  console.log({name, email, password})
  // and now need to save ...
  return c.redirect('/')
})

app.use('/*', serveStatic({ root: './assets' }))
    

Deno.serve(app.fetch)
