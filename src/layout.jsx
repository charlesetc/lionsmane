/** @jsx jsx */
/** @jsxFrag Fragment */

import { jsx, Fragment, jsxRenderer, useRequestContext } from 'https://deno.land/x/hono/middleware.ts'

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


const defaultLayout = () => jsxRenderer(({ children, title, styles }) => {
    title = title || "Lionsmane"
    styles = styles || ""
    return (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{title}</title>
          <script src="https://unpkg.com/htmx.org@1.9.10"></script>
          <link rel="stylesheet" href="/main.css" />
          <style>{styles}</style>
        </head>

        <body>
          <h1>{title}</h1>

          <Flashes />

          {children}
        </body>
      </html>
    )
  })

export default defaultLayout
