function db(context) {
  return context.locals.runtime.env.DOBJECT;
}

function save(context) {
  console.log('hi there', DOBJECT)
}
