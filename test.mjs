// A GitHub outage returns an HTML error page; res.json() on it threw a parse error that
// read like a bug here, and the adapter then handed GitHub's message to the caller.
import { test } from "node:test";
import assert from "node:assert/strict";
import { ghGraphQL, repoStatus } from "./api/_lib.js";
import { adapt } from "./functions/_adapter.js";

test("a non-ok GitHub response throws a named error, not a JSON parse error", async () => {
  globalThis.fetch = async () => new Response("<html>502</html>", { status: 502 });
  await assert.rejects(() => ghGraphQL("{}", {}), /GitHub GraphQL 502/);
});

test("GraphQL-level errors still surface", async () => {
  globalThis.fetch = async () => Response.json({ errors: [{ message: "Bad credentials" }] });
  await assert.rejects(() => ghGraphQL("{}", {}), /Bad credentials/);
});

test("the adapter does not leak the upstream message to the caller", async () => {
  const handler = adapt(async () => { throw new Error("Bad credentials for token ghp_secret"); });
  const res = await handler({ request: new Request("https://cadence.heyitsmejosh.com/api/stats"), env: {} });
  assert.equal(res.status, 502);
  const body = await res.text();
  assert.ok(!body.includes("ghp_secret"), body);
});

test("repoStatus buckets by commit count", () => {
  assert.equal(repoStatus(21), "active");
  assert.equal(repoStatus(6), "stable");
  assert.equal(repoStatus(1), "slow");
});
