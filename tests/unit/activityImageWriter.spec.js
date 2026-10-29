import { test, expect } from "@playwright/test";
import {
  createActivityImageWriter,
  createActivityQueue,
  createActivityRemover,
  createActivityWriter,
} from "../../src/lib/tripData";

// Mocked Supabase: records every Storage / table call in order. `fail` makes a
// named step return an error (or, for "update", report zero rows).
const TRIP = "cb2a7994-4560-4118-9bb2-100d371785cf";
const ACT = "11111111-1111-4111-8111-111111111111";
const OLD = `${TRIP}/activities/${ACT}/old.jpg`;

function mockSupabase({ fail = {}, hold = {} } = {}) {
  const log = [];
  const supabase = {
    storage: {
      from: () => ({
        upload: async (path) => {
          log.push(`upload ${path}`);
          return { error: fail.upload ? new Error("upload failed") : null };
        },
        remove: async (paths) => {
          log.push(`remove ${paths.join(",")}`);
          const bad = fail.remove === true || (fail.remove && paths.includes(fail.remove));
          return { error: bad ? new Error("remove failed") : null };
        },
        createSignedUrls: async (paths) => {
          log.push("sign");
          return { data: paths.map((path) => ({ path, signedUrl: `https://x/object/sign/trip-photos/${path}?t=1`, error: null })), error: null };
        },
      }),
    },
    from: (table) => ({
      update: (patch) => ({
        eq: () => ({
          select: async () => {
            log.push(`update ${table} ${JSON.stringify(patch)}`);
            if (fail.update) return { data: null, error: new Error("db failed") };
            return { data: fail.zeroRows ? [] : [{ id: ACT }], error: null };
          },
        }),
      }),
      insert: async () => {
        log.push(`insert ${table}`);
        await hold.insert;
        return { error: null };
      },
      delete: () => ({
        eq: () => ({
          select: async () => {
            log.push(`delete ${table}`);
            return { data: fail.deleteRow ? null : [{ id: ACT }], error: fail.deleteRow ? new Error("row delete failed") : null };
          },
        }),
      }),
    }),
  };
  return { supabase, log };
}
const blob = () => new Blob(["x"], { type: "image/jpeg" });
const idx = (log, prefix) => log.findIndex((l) => l.startsWith(prefix));

test("replace: upload -> DB -> sign -> delete old, new path under trip/activity", async () => {
  const { supabase, log } = mockSupabase();
  const w = createActivityImageWriter(supabase);
  const { path, url } = await w.replace(ACT, blob(), OLD);
  expect(path).toMatch(new RegExp(`^${TRIP}/activities/${ACT}/[0-9a-f-]{36}\\.jpg$`));
  expect(url).toContain(path);
  expect(path).not.toBe(OLD);
  expect(idx(log, "upload")).toBeLessThan(idx(log, "update"));
  expect(idx(log, "update")).toBeLessThan(idx(log, "remove"));
  expect(log).toContain(`update activities {"image_url":"${path}"}`);
  expect(log).toContain(`remove ${OLD}`);
});

test("seeded activity (no stored path): nothing to delete", async () => {
  const { supabase, log } = mockSupabase();
  await createActivityImageWriter(supabase).replace(ACT, blob(), null);
  expect(log.some((l) => l.startsWith("remove"))).toBe(false);
});

test("upload failure: DB never touched, old image never deleted", async () => {
  const { supabase, log } = mockSupabase({ fail: { upload: true } });
  await expect(createActivityImageWriter(supabase).replace(ACT, blob(), OLD)).rejects.toThrow("upload failed");
  expect(log.filter((l) => l.startsWith("update") || l.startsWith("remove"))).toEqual([]);
});

for (const [name, fail] of [["error", { update: true }], ["zero rows", { zeroRows: true }]]) {
  test(`DB update failure (${name}): new object deleted, old image kept`, async () => {
    const { supabase, log } = mockSupabase({ fail });
    await expect(createActivityImageWriter(supabase).replace(ACT, blob(), OLD)).rejects.toThrow();
    const removed = log.filter((l) => l.startsWith("remove"));
    expect(removed).toHaveLength(1);
    expect(removed[0]).not.toContain("old.jpg"); // only the NEW object is cleaned up
    expect(log).not.toContain(`remove ${OLD}`);
  });
}

test("old-file delete failure does not undo the successful replacement", async () => {
  const { supabase } = mockSupabase({ fail: { remove: true } });
  const out = await createActivityImageWriter(supabase).replace(ACT, blob(), OLD);
  expect(out.path).toContain(`/activities/${ACT}/`);
});

test("back-to-back replacements delete the previous NEW object, not a stale path", async () => {
  const { supabase, log } = mockSupabase();
  const w = createActivityImageWriter(supabase);
  const [a, b] = await Promise.all([w.replace(ACT, blob(), OLD), w.replace(ACT, blob(), OLD)]);
  expect(log).toContain(`remove ${OLD}`);
  expect(log).toContain(`remove ${a.path}`); // second replacement removed the first's object
  expect(log).not.toContain(`remove ${b.path}`);
});

test("a new activity's image upload waits for its INSERT", async () => {
  let release;
  const hold = { insert: new Promise((r) => (release = r)) };
  const { supabase, log } = mockSupabase({ hold });
  const queue = createActivityQueue();
  const activityWriter = createActivityWriter(supabase, queue);
  const imageWriter = createActivityImageWriter(supabase, queue);
  const inserted = activityWriter.insert("stop-1", { id: ACT, name: "n", cost: "", sortOrder: 1000 });
  const replaced = imageWriter.replace(ACT, blob(), null);
  await new Promise((r) => setTimeout(r, 30));
  expect(log).toEqual(["insert activities"]); // no upload while the INSERT is pending
  release();
  await inserted;
  await replaced;
  expect(idx(log, "insert")).toBeLessThan(idx(log, "upload"));
});

test("delete removes the stored image after the row; cleanup failure doesn't fail the delete", async () => {
  const { supabase, log } = mockSupabase({ fail: { remove: true } });
  const queue = createActivityQueue();
  const imageWriter = createActivityImageWriter(supabase, queue);
  const remove = createActivityRemover({
    activityWriter: createActivityWriter(supabase, queue),
    imageWriter,
    discardFieldEdits: () => {},
  });
  await expect(remove(ACT, OLD)).resolves.toBeUndefined(); // the delete itself succeeded
  await queue.ready(ACT);
  expect(idx(log, "delete")).toBeLessThan(idx(log, `remove ${OLD}`));
});

test("failed row delete leaves the stored image alone", async () => {
  const { supabase, log } = mockSupabase({ fail: { deleteRow: true } });
  const queue = createActivityQueue();
  const remove = createActivityRemover({
    activityWriter: createActivityWriter(supabase, queue),
    imageWriter: createActivityImageWriter(supabase, queue),
    discardFieldEdits: () => {},
  });
  await expect(remove(ACT, OLD)).rejects.toThrow();
  await queue.ready(ACT);
  expect(log.some((l) => l.startsWith("remove"))).toBe(false);
});
