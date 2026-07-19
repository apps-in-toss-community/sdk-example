/**
 * engine 프로브 페이지를 로컬로 서빙하고 Simulator Safari가 POST한 verdict를 받아 적는다.
 *
 * 127.0.0.1에만 bind한다 — Simulator는 호스트의 네트워크 스택을 공유하므로
 * 루프백으로 충분하고, 외부에 열 이유가 없다. 결과를 받으면 즉시 종료한다.
 *
 * 커뮤니티 오픈소스 프로젝트입니다.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';

const [, , htmlPath, outPath, portArg] = process.argv;
if (!htmlPath || !outPath) {
  console.error('usage: node scripts/engine-probe-collect.mjs <page.html> <out.json> [port]');
  process.exit(1);
}

const html = readFileSync(htmlPath, 'utf8');
const port = Number(portArg || 8899);
const TIMEOUT_MS = 90_000;

const server = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/result') {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
    });
    req.on('end', () => {
      writeFileSync(outPath, body, 'utf8');
      res.writeHead(204).end();
      console.log('RESULT_RECEIVED');
      server.close();
      setTimeout(() => process.exit(0), 100);
    });
    return;
  }
  res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }).end(html);
});

server.listen(port, '127.0.0.1', () => console.log(`listening on 127.0.0.1:${port}`));

setTimeout(() => {
  console.error(`TIMEOUT: ${TIMEOUT_MS}ms 안에 verdict가 오지 않았습니다.`);
  process.exit(2);
}, TIMEOUT_MS);
