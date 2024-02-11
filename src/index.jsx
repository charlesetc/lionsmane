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
} from 'https://deno.land/x/hono/middleware.ts'
import sessions from './session.js'
import { kv } from './kv.js'
import flash from './flash.js'
import defaultLayout from './layout.jsx'
import discussions from './discussions.jsx'
import users from './users.jsx'

const app = new Hono();

app.use(logger())
app.use(compress())
app.use(csrf())
app.use(flash)
sessions(app)
app.use('/*', defaultLayout())
app.route('/discussions', discussions)
app.route('/', users)

function LandingPage() {
  return (
    <>
      <p>
        The world we have is too complex to make sense of alone; the problems we’re
        facing too important to tolerate distraction in the name of ad revenue.
      </p>

      <a class='button' href="/signup">Sign up</a>
      <a class='button' href="/login">Log in</a>
    </>
  )
}

async function Dashboard({user}) {
  return (
    <>
      <p>Logged in as {user.name} | {user.email} <a href="/logout">Log out</a></p>

    <ul>
      <li><a href="/users">User index</a></li>
      <li><a href="/discussions">Discussions</a></li>
    </ul>
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

app.use('/*', serveStatic({ root: './assets' }))
    

Deno.serve(app.fetch)
