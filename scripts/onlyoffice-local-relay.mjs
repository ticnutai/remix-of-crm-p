/**
 * ONLYOFFICE local save relay
 * ============================
 * Runs inside WSL next to the local Document Server container.
 *
 * Why it exists: the Document Server runs on this machine (localhost:8088),
 * so when a user saves, the download URL in the ONLYOFFICE callback points to
 * localhost — which the Supabase cloud function cannot reach. This relay
 * receives the callback locally, downloads the edited file from the local
 * Document Server, and forwards the callback to the cloud function with the
 * file content inlined as base64. The cloud function then writes it to
 * Storage with its service role as usual.
 *
 * Flow:
 *   DocumentServer (docker) --POST--> relay :9310 --POST+fileBase64--> Supabase onlyoffice-callback
 *
 * Run (inside WSL):  node onlyoffice-local-relay.mjs
 */

import http from "node:http";

const PORT = Number(process.env.RELAY_PORT || 9310);
const CLOUD_CALLBACK =
  process.env.CLOUD_CALLBACK_URL ||
  "https://eadeymehidcndudeycnf.supabase.co/functions/v1/onlyoffice-callback";

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://localhost:${PORT}`);

  if (req.method === "GET" && url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method !== "POST" || !url.pathname.includes("onlyoffice-callback")) {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: 1, message: "not found" }));
    return;
  }

  try {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const payload = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
    const documentId = url.searchParams.get("documentId") || "";
    const status = Number(payload.status);
    log(`callback: documentId=${documentId} status=${status}`);

    // 2 = ready for saving, 6 = force save → fetch the edited file locally.
    if ((status === 2 || status === 6) && payload.url) {
      const fileResponse = await fetch(payload.url);
      if (!fileResponse.ok) {
        throw new Error(`download from Document Server failed: HTTP ${fileResponse.status}`);
      }
      const bytes = Buffer.from(await fileResponse.arrayBuffer());
      payload.fileBase64 = bytes.toString("base64");
      log(`downloaded ${bytes.length} bytes from Document Server`);
    }

    const forward = await fetch(`${CLOUD_CALLBACK}?documentId=${encodeURIComponent(documentId)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await forward.text();
    log(`forwarded to cloud: HTTP ${forward.status} ${body.slice(0, 120)}`);

    res.writeHead(200, { "Content-Type": "application/json" });
    // ONLYOFFICE only needs {"error":0} to consider the save acknowledged.
    res.end(forward.ok ? body : JSON.stringify({ error: 1 }));
  } catch (error) {
    log("relay error:", error.message);
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: 1, message: error.message }));
  }
});

server.listen(PORT, "0.0.0.0", () => {
  log(`ONLYOFFICE local save relay listening on 0.0.0.0:${PORT}`);
  log(`forwarding to: ${CLOUD_CALLBACK}`);
});
