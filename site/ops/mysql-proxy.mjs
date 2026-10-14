import net from 'net';

const LOCAL_PORT = 3306;
const TARGET_PORT = 3306;
const TARGET_HOST = '192.168.127.22';

const server = net.createServer((clientSocket) => {
  const targetSocket = net.createConnection(TARGET_PORT, TARGET_HOST);

  clientSocket.pipe(targetSocket);
  targetSocket.pipe(clientSocket);

  clientSocket.on('error', (err) => {
    targetSocket.destroy();
  });
  targetSocket.on('error', (err) => {
    clientSocket.destroy();
  });
});

server.listen(LOCAL_PORT, '127.0.0.1', () => {
  console.log(`[MySQL Bridge] 127.0.0.1:${LOCAL_PORT} -> ${TARGET_HOST}:${TARGET_PORT} [READY]`);
});
