import * as assert from "https://deno.land/std@0.217.0/assert/mod.ts";
import { nanoid } from "https://deno.land/x/nanoid/mod.ts"

export const kv = await Deno.openKv();

export function table(name, indices) {
  const primary_key = "id"

  async function save(value) {
      // TODO: use kv.atomic
      await kv.set([name, primary_key, value[primary_key]], value)
      for (const index of indices) {
        await kv.set([name, index, value[index], value[primary_key]], value[primary_key])
      }
  }

  async function list(query) {
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

  async function find(query) { 
      if (primary_key in query) {
         return (await kv.get([name, primary_key, query[primary_key]])).value
      }

      const found = await list(query)
      if (found.length > 0) {
        return found[0]
      }
      return null
  }

  async function all() {
    const entries = await kv.list({prefix: [name, primary_key]})
    const values = []
    for await (const entry of entries) {
      values.push(entry.value)
    }
    return values
  }

  async function create(data, prefix = "", length = 14) {
    const id = prefix ? `${prefix}-${nanoid(length)}` : nanoid()
    if (!data[primary_key]) data[primary_key] = id
    data['created_at'] = new Date()
    await save(data)
    return data
  }

  async function update(query, data) {
    // NOTE: this is not atomic and it would be nice if it was
    const found = await find(query)
    if (found) {
      await save({...found, ...data})
    }
  }

  return { update, find, list, all, create }
}

function assertEquals(a, b) {
  if (Array.isArray(a))
    a = a.map((o) => { delete o.created_at; return o })

  if (Array.isArray(b))
    b = b.map((o) => { delete o.created_at; return o })

  if (a instanceof Object)
    delete a.created_at

  if (b instanceof Object)
    delete b.created_at

  assert.assertEquals(a, b)
}

Deno.test("table save & find", async () => {
    const users = table("tests", ["email"])
    await users.create({ id: 1, email: "test1@test.com" })
    await users.create({ id: 2, email: "test2@test.com" })
    await users.create({ id: 3, email: "test3@test.com" })
    assertEquals(await users.find({ id: 1 }), { id: 1, email: "test1@test.com" })
    assertEquals(await users.find({ email: "test2@test.com" }), { id: 2, email: "test2@test.com" })
    assertEquals(await users.find({ email: "test1@test.com" }), { id: 1, email: "test1@test.com" })
})

Deno.test("table list", async () => {
    const users = table("tests", ["email"])
    await users.create({ id: 1, email: "wow" })
    await users.create({ id: 2, email: "test2@test.com" })
    await users.create({ id: 3, email: "wow" })
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
