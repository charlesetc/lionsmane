export const kv = await Deno.openKv();

export async function deleteAll(ns) {
  for await (const entry of kv.list({prefix: [ns]})) {
    await kv.delete(entry.key);
  }
}

export async function listAll(ns) {
  const list = [];
  for await (const entry of kv.list({prefix: [ns]})) {
    list.push(entry.value);
  }
  return list;
}

export async function deleteEverything() {
  for await (const entry of kv.list({prefix: []})) {
    await kv.delete(entry.key);
  }
}
