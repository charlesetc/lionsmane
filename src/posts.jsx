/** @jsx jsx */
/** @jsxFrag Fragment */

import { jsx, Fragment } from 'https://deno.land/x/hono/middleware.ts'
import { Hono } from 'https://deno.land/x/hono/mod.ts'
import { kv } from './kv.js'

const app = new Hono();


export function createPost(post, discussionId) {
  kv.set([ "posts", post.id ], post)
  kv.set([ "discussion-post-index", discussionId], post.id)
}



export default app
