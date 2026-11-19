import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildVillageSnapshot, getWatchRoots } from './adapters.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 4777;
const HOST = '127.0.0.1';
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

const wsClients = new Set();
let lastStateHash = '';
let lastBroadcastAt = 0;
let latestSnapshot = null;
let latestSnapshotAt = 0;

function computeStateFingerprint(snapshot) {
  return JSON.stringify({
    diag: [snapshot.diagnostics?.ok !== false, snapshot.diagnostics?.message || ''],
    islands: snapshot.islands.map((i) => [i.id, i.activeCount, i.villagerCount, i.fruit, i.sources]),
    villagers: snapshot.villagers.map((v) => [
      v.conversationId,
      v.agentSource,
      v.displayName,
      v.species,
      v.questTitle,
      v.doorplateLabel,
      v.isRunning,
      v.activity,
      v.actionKey,
      v.station,
      v.icon,
      v.detail,
      v.errorFull,
      v.stepCount,
    ]),
  });
}

function getFreshSnapshot() {
  const now = Date.now();
  if (!latestSnapshot || now - latestSnapshotAt > 250) {
    latestSnapshot = buildVillageSnapshot();
    latestSnapshotAt = now;
  }
  return latestSnapshot;
}

function getStatePayload(clientEtag, hostConversationId = '') {
  const snapshot = getFreshSnapshot();
  const etag = crypto
    .createHash('sha1')
    .update(computeStateFingerprint(snapshot))
    .digest('hex')
    .slice(0, 16);

  if (clientEtag && clientEtag === etag) {
    return { unchanged: true, etag };
  }
  return { ...snapshot, etag, hostConversationId };
}

function openProjectFolder(islandId) {
  const snapshot = getFreshSnapshot();
  const island = snapshot.islands.find((item) => item.id === islandId);
  if (!island?.folderPath) {
    return { ok: false, error: 'This island has no local folder path.' };
  }

  const resolved = path.resolve(island.folderPath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    return { ok: false, error: 'Workspace folder was not found on disk.' };
  }

  const cmd =
    process.platform === 'win32'
      ? 'explorer.exe'
      : process.platform === 'darwin'
        ? 'open'
        : 'xdg-open';

  const child = execFile(cmd, [resolved], { windowsHide: false }, () => {});
  child.unref();
  return { ok: true, path: resolved };
}

function openPopoutWindow({ port, token = '', conversationId = '' }) {
  const urlObj = new URL(`http://127.0.0.1:${port}/`);
  if (token) urlObj.searchParams.set('token', token);
  if (conversationId) urlObj.searchParams.set('conversationId', conversationId);
  urlObj.searchParams.set('popout', '1');
  const targetUrl = urlObj.toString();

  if (process.platform === 'win32') {
    const candidates = [
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe'),
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Microsoft\\Edge\\Application\\msedge.exe'),
    ].filter(Boolean);

    const browserExe = candidates.find((exe) => fs.existsSync(exe));
    if (browserExe) {
      const child = spawn(browserExe, [`--app=${targetUrl}`, '--window-size=960,640'], {
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
      });
      child.unref();
      return { ok: true, browser: path.basename(browserExe) };
    }

    const fallback = spawn('cmd.exe', ['/c', 'start', '', targetUrl], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    fallback.unref();
    return { ok: true, browser: 'default' };
  }

  if (process.platform === 'darwin') {
    const macBrowsers = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ];
    const browserExe = macBrowsers.find((exe) => fs.existsSync(exe));
    if (browserExe) {
      const child = spawn(browserExe, [`--app=${targetUrl}`, '--window-size=960,640'], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      return { ok: true, browser: path.basename(browserExe) };
    }
    spawn('open', [targetUrl], { detached: true, stdio: 'ignore' }).unref();
    return { ok: true, browser: 'default' };
  }

  spawn('xdg-open', [targetUrl], { detached: true, stdio: 'ignore' }).unref();
  return { ok: true, browser: 'default' };
}

const isSidecarEnv = Boolean(
  process.env.ANTIGRAVITY_LS_ADDRESS &&
  process.env.ANTIGRAVITY_CSRF_TOKEN &&
  process.env.ANTIGRAVITY_SIDECAR_WEB_PORT
);

if (isSidecarEnv) {
  const { SidecarApp, Response } = await import('sidecar_sdk');
  const app = new SidecarApp();

  app.page(
    '/',
    () =>
      new Response(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'), {
        contentType: 'text/html; charset=utf-8',
        headers: { 'Cache-Control': 'no-store' },
      })
  );

  for (const [route, file, contentType] of [
    ['/styles.css', 'styles.css', 'text/css; charset=utf-8'],
    ['/i18n.js', 'i18n.js', 'application/javascript; charset=utf-8'],
    ['/sprites.js', 'sprites.js', 'application/javascript; charset=utf-8'],
    ['/village.js', 'village.js', 'application/javascript; charset=utf-8'],
  ]) {
    app.api(
      route,
      () =>
        new Response(fs.readFileSync(path.join(__dirname, file), 'utf8'), {
          contentType,
          headers: { 'Cache-Control': 'no-store' },
        }),
      'GET'
    );
  }

  for (const fontFile of ['NanumSquareRoundR.woff2', 'NanumSquareRoundB.woff2', 'NanumSquareRoundEB.woff2']) {
    app.api(
      `/fonts/${fontFile}`,
      () =>
        new Response(fs.readFileSync(path.join(__dirname, 'fonts', fontFile)), {
          contentType: 'font/woff2',
          headers: { 'Cache-Control': 'public, max-age=86400' },
        }),
      'GET'
    );
  }

  app.api('/api/health', () => ({ ok: true, mode: 'sidecar' }), 'GET');

  app.api(
    '/api/state',
    (data) => getStatePayload(data?.etag || '', app.config.conversationId || ''),
    'GET'
  );

  app.api('/api/open-folder', (data) => openProjectFolder(String(data?.islandId || '')), 'POST');

  app.api(
    '/api/popout',
    (data) =>
      openPopoutWindow({
        port: Number(process.env.ANTIGRAVITY_SIDECAR_WEB_PORT),
        token: process.env.ANTIGRAVITY_SIDECAR_UI_TOKEN || '',
        conversationId: String(data?.conversationId || app.config.conversationId || ''),
      }),
    'POST'
  );

  await app.run();
} else {
  function encodeWsTextFrame(str) {
    const payload = Buffer.from(str, 'utf8');
    const len = payload.length;
    let header;

    if (len < 126) {
      header = Buffer.allocUnsafe(2);
      header[0] = 0x81;
      header[1] = len;
    } else if (len < 65536) {
      header = Buffer.allocUnsafe(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.allocUnsafe(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }

    return Buffer.concat([header, payload]);
  }

  function encodeWsPongFrame(payload) {
    const len = Math.min(payload.length, 125);
    const frame = Buffer.allocUnsafe(2 + len);
    frame[0] = 0x8a;
    frame[1] = len;
    if (len > 0) payload.copy(frame, 2, 0, len);
    return frame;
  }

  function sendWsJson(socket, obj) {
    if (!socket || socket.destroyed || !socket.writable) {
      wsClients.delete(socket);
      return;
    }
    try {
      socket.write(encodeWsTextFrame(JSON.stringify(obj)));
    } catch {
      wsClients.delete(socket);
    }
  }

  function refreshAndBroadcast(force = false) {
    const snapshot = buildVillageSnapshot();
    latestSnapshot = snapshot;
    latestSnapshotAt = Date.now();
    const hash = computeStateFingerprint(snapshot);
    const now = Date.now();

    if (force || hash !== lastStateHash || now - lastBroadcastAt >= 5000) {
      lastStateHash = hash;
      lastBroadcastAt = now;
      if (wsClients.size > 0) {
        const frame = encodeWsTextFrame(JSON.stringify({ type: 'snapshot', data: snapshot }));
        for (const client of wsClients) {
          if (client.destroyed || !client.writable) {
            wsClients.delete(client);
            continue;
          }
          try {
            client.write(frame);
          } catch {
            wsClients.delete(client);
          }
        }
      }
    }
  }

  function serveStatic(reqPath, res) {
    if (reqPath === '/preload.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end('/* standalone mode */');
      return;
    }
    const fileMap = {
      '/': 'index.html',
      '/index.html': 'index.html',
      '/styles.css': 'styles.css',
      '/i18n.js': 'i18n.js',
      '/sprites.js': 'sprites.js',
      '/village.js': 'village.js',
      '/fonts/NanumSquareRoundR.woff2': 'fonts/NanumSquareRoundR.woff2',
      '/fonts/NanumSquareRoundB.woff2': 'fonts/NanumSquareRoundB.woff2',
      '/fonts/NanumSquareRoundEB.woff2': 'fonts/NanumSquareRoundEB.woff2',
    };
    const fileName = fileMap[reqPath];
    if (!fileName) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    const resolved = path.join(__dirname, fileName);
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(resolved).pipe(res);
  }

  const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url || '/', `http://${HOST}:${PORT}`);
    const urlPath = reqUrl.pathname;

    if (urlPath === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ ok: true, mode: 'standalone', port: PORT, clients: wsClients.size }));
      return;
    }

    if (urlPath === '/api/state' && req.method === 'GET') {
      const etag = reqUrl.searchParams.get('etag') || '';
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(getStatePayload(etag)));
      return;
    }

    if (urlPath === '/api/open-folder' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : {};
          const result = openProjectFolder(String(data?.islandId || ''));
          res.writeHead(result.ok ? 200 : 400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: err.message }));
        }
      });
      return;
    }

    if (urlPath === '/api/popout' && req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(openPopoutWindow({ port: PORT })));
      return;
    }

    serveStatic(urlPath, res);
  });

  server.on('upgrade', (req, socket) => {
    const urlPath = (req.url || '/').split('?')[0];
    if (urlPath !== '/ws') {
      socket.destroy();
      return;
    }

    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }

    const accept = crypto.createHash('sha1').update(`${key}${WS_GUID}`).digest('base64');
    socket.write(
      [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${accept}`,
        '',
        '',
      ].join('\r\n')
    );

    socket.setNoDelay(true);
    wsClients.add(socket);
    sendWsJson(socket, { type: 'snapshot', data: getFreshSnapshot() });

    socket.on('data', (chunk) => {
      if (!chunk || chunk.length < 2) return;
      const opcode = chunk[0] & 0x0f;
      if (opcode === 0x08) {
        wsClients.delete(socket);
        socket.end();
      } else if (opcode === 0x09) {
        const masked = (chunk[1] & 0x80) !== 0;
        const len = chunk[1] & 0x7f;
        if (len < 126) {
          const offset = masked ? 6 : 2;
          const rawPayload = chunk.subarray(offset, offset + len);
          if (masked && chunk.length >= 6 + len) {
            const mask = chunk.subarray(2, 6);
            const unmasked = Buffer.allocUnsafe(len);
            for (let i = 0; i < len; i += 1) unmasked[i] = rawPayload[i] ^ mask[i % 4];
            socket.write(encodeWsPongFrame(unmasked));
          } else {
            socket.write(encodeWsPongFrame(rawPayload));
          }
        }
      }
    });

    socket.on('close', () => wsClients.delete(socket));
    socket.on('error', () => wsClients.delete(socket));
  });

  let watchDebounce = null;
  for (const watchRoot of getWatchRoots()) {
    try {
      fs.watch(watchRoot, { recursive: true }, () => {
        if (watchDebounce) clearTimeout(watchDebounce);
        watchDebounce = setTimeout(() => refreshAndBroadcast(false), 250);
      });
    } catch {
      // ignore watch error on unsupported platforms
    }
  }

  refreshAndBroadcast(true);
  setInterval(() => refreshAndBroadcast(false), 1000);

  server.listen(PORT, HOST, () => {
    console.log(`Agent Crossing universal server running at http://${HOST}:${PORT}`);
    if (process.env.AGENT_CROSSING_AUTO_OPEN === '1') {
      openPopoutWindow({ port: PORT });
    }
  });
}
