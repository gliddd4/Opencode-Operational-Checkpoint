import test from "node:test"
import assert from "node:assert/strict"

import plugin, { CompactionPlugin, OPERATIONAL_CHECKPOINT_PROMPT } from "../server.js"

test("compaction hook replaces output.prompt with the operational checkpoint prompt", async () => {
  const output = { prompt: "OpenCode's default compaction prompt", other: "preserved" }
  const hooks = await CompactionPlugin()

  await hooks["experimental.session.compacting"]({}, output)

  assert.equal(output.prompt, OPERATIONAL_CHECKPOINT_PROMPT)
  assert.equal(output.other, "preserved")
  assert.equal(plugin.id, "opencode-compaction.server")
  assert.equal(plugin.server, CompactionPlugin)
})

test("compaction hook incorporates one or more context entries in input order", async () => {
  const context = ["first accumulated context", "second accumulated context"]
  const output = { context, prompt: "OpenCode's default compaction prompt" }
  const hooks = await CompactionPlugin()

  await hooks["experimental.session.compacting"]({}, output)

  assert.equal(output.prompt.match(/first accumulated context/g)?.length, 1)
  assert.equal(output.prompt.match(/second accumulated context/g)?.length, 1)
  assert.ok(output.prompt.indexOf("first accumulated context") < output.prompt.indexOf("second accumulated context"))
  assert.equal(output.prompt.split(OPERATIONAL_CHECKPOINT_PROMPT).length - 1, 1)
  assert.ok(output.prompt.endsWith(OPERATIONAL_CHECKPOINT_PROMPT))
})

test("compaction hook leaves output.context and its entries unchanged", async () => {
  const context = ["preserve this", "", "and this"]
  const originalContext = [...context]
  const output = { context, prompt: "OpenCode's default compaction prompt" }
  const hooks = await CompactionPlugin()

  await hooks["experimental.session.compacting"]({}, output)

  assert.strictEqual(output.context, context)
  assert.deepEqual(output.context, originalContext)
})

test("context wrapper describes data incorporation without competing checkpoint sections", async () => {
  const output = { context: ["context entry"], prompt: "OpenCode's default compaction prompt" }
  const hooks = await CompactionPlugin()

  await hooks["experimental.session.compacting"]({}, output)

  assert.match(output.prompt, /context entry/)
  assert.match(output.prompt, /data context/i)
  assert.doesNotMatch(output.prompt, /create .*section|separate .*section|competing/i)
  assert.match(output.prompt, /eleven numbered sections|eleven sections/i)
  assert.match(output.prompt, /epistemic labels/i)
})
