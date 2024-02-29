/** @jsx jsx */
/** @jsxFrag Fragment */

import { jsx, Fragment, jsxRenderer, useRequestContext } from 'https://deno.land/x/hono/middleware.ts'

async function Flashes() {
  const c = useRequestContext()
  const flashes = await c.flash.get()
  await c.flash.clear()
  return (
    <>
      {flashes.map((flash) => (
        <div class="flash">{flash}</div>
      ))}
    </>
  )
}


const layout = () => jsxRenderer(({ children, title, styles, layout }) => {
    title = title === undefined ? 'Lionsmane' : title
    styles = styles === undefined ? '' : styles
    layout = layout === undefined ? 'default' : layout

    return (
      <html lang="en">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>{title}</title>
          <script src="https://unpkg.com/htmx.org@1.9.10"></script>
          <link rel="stylesheet" href="/main.css" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="manifest" href="/site.webmanifest" />
          <style>{styles}</style>
          <script src='/js/scroll.js'></script>
        </head>

        <body class={layout}>

          {
            layout == 'signuplogin' &&
            <h1>
              <span class='title'>{title}</span>
            </h1>
          }

          {
            layout === 'default' && 
            <h1>
              <span class='title'>{title}</span>
            </h1>
          }

          <Flashes />

          {children}
        </body>
      </html>
    )
  })

export default layout
