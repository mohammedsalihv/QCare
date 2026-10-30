const net = require('node:net');
(async () => {
  for (const port of [22, 5000]) {
    const result = await new Promise(resolve => {
      const socket = net.createConnection({ host: '192.168.1.160', port });
      socket.setTimeout(5000);
      socket.once('connect', () => { socket.destroy(); resolve('reachable'); });
      socket.once('timeout', () => { socket.destroy(); resolve('connection timed out'); });
      socket.once('error', error => resolve(error.code));
    });
    console.log(`QCare server port ${port}: ${result}`);
  }
})();
