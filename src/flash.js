export default async function flash(c, next) {
  c.flash = {
    add: (flash) => c.session().set('flashes', [...c.flash.get(c), flash]),
    get: () => c.session().get('flashes') || [],
    clear: () => c.session().set('flashes', []),
  }
  await next()
}

