import { assertEquals } from "https://deno.land/std@0.217.0/assert/mod.ts";

const kv = await Deno.openKv();

export function table(name, primary_key, indices) {
  return {
    async save(value) {
      const tx = kv.atomic()
      await kv.set([name, primary_key, value[primary_key]], value)
      for (const index of indices) {
        await kv.set([name, index, value[index], value[primary_key]], value[primary_key])
      }
    },
    async find(query) {
      if (primary_key in query) {
         return (await kv.get([name, query[primary_key]])).value
      }

      for (const index of indices) {
        if (index in query) {
          const key = (await kv.get([name, index, query[index]])).value
          return (await kv.get([name, primary_key, key])).value
        }
      }
    },
    async list(query) {
      for (const index of indices) {
        if (index in query) {
          const entries = await kv.list({prefix: [name, index, query[index]]})
          const values = []
          for await (const entry of entries) {
            const o = (await kv.get([name, primary_key, entry.value])).value
            values.push(o)
          }
          return values
        }
      }
    }
  }
}

Deno.test("table save & find", async () => {
    const users = table("users", "id", ["email"])
    await users.save({ id: 1, email: "test1@test.com" })
    await users.save({ id: 2, email: "test2@test.com" })
    await users.save({ id: 3, email: "test3@test.com" })
    assertEquals(await users.find({ id: 1 }), { id: 1, email: "test1@test.com" })
    assertEquals(await users.find({ email: "test2@test.com" }), { id: 2, email: "test2@test.com" })
    assertEquals(await users.find({ email: "test1@test.com" }), { id: 1, email: "test1@test.com" })
})

Deno.test("table list", async () => {
    const users = table("users", "id", ["email"])
    await users.save({ id: 1, email: "wow" })
    await users.save({ id: 2, email: "test2@test.com" })
    await users.save({ id: 3, email: "wow" })
    assertEquals(await users.list({ email: "wow" }), [{ id: 1, email: "wow" }, { id: 3, email: "wow" }])
})


export async function deleteAll(prefix) {
  for await (const entry of kv.list({prefix})) {
    await kv.delete(entry.key);
  }
}

export async function listAll(prefix) {
  const list = [];
  for await (const entry of kv.list({prefix})) {
    list.push({key: entry.key, value: entry.value});
  }
  return list;
}

export async function deleteEverything() {
  for await (const entry of kv.list({prefix: []})) {
    await kv.delete(entry.key);
  }
}
