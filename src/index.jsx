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
  useRequestContext as useContext,
} from 'https://deno.land/x/hono/middleware.ts'
import sessions from './session.js'
import * as tables from './tables.js'
import flash from './flash.js'
import layout from './layout.jsx'
import discussions from './discussions.jsx'
import users from './users.jsx'

const app = new Hono();

 async function current_user(c, next) {
  c.current_user = async () => { 
    const userid = c.session().get('user')
    if (!userid) return null
    const user = await tables.Users.find({ id: userid })
    return user
  }

  await next()
}

app.use(logger())
app.use(compress())
app.use(csrf())
app.use(flash)
app.use('/*', layout())
app.use(current_user)
sessions(app)

app.route('/discussions', discussions)
app.route('/', users)

function landingPage(c) {
  return c.render(
    <>
      <img class='logo' src='/lioness-drawing.png' alt='Lionsmane logo' />
      <section class='main'>
        <h1>Lionsmane</h1>
        <p>
          The world we have is too complex to make sense of alone; the problems we’re
          facing too important to tolerate distraction in the name of ad revenue.
        </p>

        <a class='button' href="/signup">Sign up</a>
        <a class='button' href="/login">Log in</a>
      </section>
    </>,
    {
      title: 'Lionsmane',
      layout: 'landing', // at the moment, this just means no heading
    })
}

async function Dashboard() {
  const c = useContext()
  const user = await c.current_user()
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
  if (await c.current_user()) {
    return c.render(<Dashboard />, { title: 'Lionsmane' })
  } else {
    return landingPage(c)
  }
})

app.use('/*', serveStatic({ root: './assets' }))
    

Deno.serve(app.fetch)
