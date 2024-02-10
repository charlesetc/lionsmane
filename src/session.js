import { kv } from './kv.js'
import { sessionMiddleware } from 'https://deno.land/x/hono_sessions/mod.ts'
import { DenoKvStore } from 'https://deno.land/x/hono_sessions/src/store/deno/DenoKvStore.ts'

export default function setupSessions(app) {
  const store = new DenoKvStore(kv)
  app.use('*', sessionMiddleware({
    store, 
    encryptionKey: "a.temporary.key.a.temporary.key.a.temporary.key",
    cookieOptions: {
      sameSite: 'Lax',
      path: '/',
      httpOnly: true,
    },
  }))

  app.use(async (c, next) => {
    c.session = () => c.get('session')
    await next()
  })
}

