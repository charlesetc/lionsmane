 export class DObject {
  constructor(state, env) {}

  async fetch(request, env) {
    let id = env.MY_DURABLE_OBJECT.idFromName(new URL(request.url).pathname);

    let stub = env.MY_DURABLE_OBJECT.get(id);

    let response = await stub.fetch(request);

    return response;
  };
}
