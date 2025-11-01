export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const { pathname } = url;

    const json = (data, init = {}) =>
      new Response(JSON.stringify(data), {
        ...init,
        headers: {
          "content-type": "application/json; charset=utf-8",
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "authorization, content-type",
          "access-control-allow-methods": "GET,POST,OPTIONS",
        },
      });

    if (req.method === "OPTIONS") return json({ ok: true });
    if (req.method === "GET" && pathname === "/")
      return json({ ok: true, hint: "GET /status, POST /status" });

    // POST /status — Colab 上報
    if (req.method === "POST" && pathname === "/status") {
      const auth = req.headers.get("authorization") || "";
      if (!auth || auth !== `Bearer ${await env.API_BEARER}`)
        return json({ error: "unauthorized" }, { status: 401 });

      let body;
      try {
        body = await req.json();
      } catch {
        return json({ error: "invalid json" }, { status: 400 });
      }

      const { task, run_id, ts } = body || {};
      if (!task) return json({ error: "task required" }, { status: 400 });
      if (!run_id) return json({ error: "run_id required" }, { status: 400 });
      if (!ts) return json({ error: "ts required" }, { status: 400 });

      await Promise.all([
        env.STATUSES.put(`status:${task}`, JSON.stringify(body), {
          metadata: { t: Date.now() },
        }),
        env.STATUSES.put(`status:${task}:${run_id}`, JSON.stringify(body), {
          metadata: { t: Date.now() },
        }),
        upsertIndex(env.STATUSES, task),
      ]);
      return json({ ok: true });
    }

    // GET /status — 全部任務最新狀態
    if (req.method === "GET" && pathname === "/status") {
      const tasks = await getIndex(env.STATUSES);
      const list = await Promise.all(tasks.map((t) => readLatest(env.STATUSES, t)));
      list.sort((a, b) => new Date(b?.ts || 0) - new Date(a?.ts || 0));
      return json(list.filter(Boolean));
    }

    // GET /status/:task
    const m1 = pathname.match(/^\/status\/([^/]+)$/);
    if (req.method === "GET" && m1) {
      const task = decodeURIComponent(m1[1]);
      const data = await readLatest(env.STATUSES, task);
      return data ? json(data) : json({ error: "not found" }, { status: 404 });
    }

    // GET /status/:task/:runId
    const m2 = pathname.match(/^\/status\/([^/]+)\/([^/]+)$/);
    if (req.method === "GET" && m2) {
      const task = decodeURIComponent(m2[1]);
      const runId = decodeURIComponent(m2[2]);
      const raw = await env.STATUSES.get(`status:${task}:${runId}`);
      return raw ? json(JSON.parse(raw)) : json({ error: "not found" }, { status: 404 });
    }

    return json({
      ok: true,
      routes: ["POST /status", "GET /status", "GET /status/:task", "GET /status/:task/:runId"],
    });
  },
};

async function upsertIndex(KV, task) {
  const raw = await KV.get("index:tasks");
  let arr = raw ? JSON.parse(raw) : [];
  if (!arr.includes(task)) {
    arr.push(task);
    await KV.put("index:tasks", JSON.stringify(arr), { metadata: { t: Date.now() } });
  }
}
async function getIndex(KV) {
  const raw = await KV.get("index:tasks");
  return raw ? JSON.parse(raw) : [];
}
async function readLatest(KV, task) {
  const raw = await KV.get(`status:${task}`);
  return raw ? JSON.parse(raw) : null;
}
