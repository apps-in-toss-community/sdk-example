// engine 프로브 페이지를 서빙하고 iOS Simulator Safari가 POST한 verdict를 받아 적는다.
// 결과를 받으면 즉시 종료 — 대기 상태로 남지 않는다.

import { readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';

const [, , htmlPath, outPath, portArg] = process.argv;
const html = readFileSync(htmlPath, 'utf8');
const port = Number(portArg || 8899);

const server = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/result') {
    let body = '';
    req.on('data', (c) => {
      body += c;
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

server.listen(port, '127.0.0.1', () => console.log(`listening ${port}`));
setTimeout(() => {
  console.error('TIMEOUT: no result');
  process.exit(2);
}, 90_000);
