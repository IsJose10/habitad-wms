const { spawn } = require('child_process');
const http = require('http');

const PORT = 4001;

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = http.request({
      host: '127.0.0.1', port: PORT, path, method,
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let buf = '';
      res.on('data', c => { buf += c; });
      res.on('end', () => {
        let parsed; try { parsed = JSON.parse(buf); } catch { parsed = buf; }
        resolve({ status: res.statusCode, body: parsed });
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function waitForServer(proc) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server start timeout')), 10000);
    proc.stdout.on('data', d => {
      const text = String(d);
      if (text.includes('CORRIENDO LOCALMENTE')) { 
        clearTimeout(timer); 
        resolve(); 
      }
    });
    proc.on('exit', code => { 
      clearTimeout(timer); 
      reject(new Error('server exited ' + code)); 
    });
  });
}

(async () => {
  console.log('Iniciando servidor de prueba en puerto', PORT);
  const server = spawn('node', ['server.js'], { env: { ...process.env, PORT: String(PORT) } });
  
  // Imprimir salida del servidor
  server.stdout.on('data', d => {
    process.stdout.write('[Servidor] ' + d);
  });
  server.stderr.on('data', d => {
    process.stderr.write('[Servidor-Error] ' + d);
  });

  try {
    await waitForServer(server);
    console.log('\n--- Enviando solicitud de OTP ---');
    const otpRes = await req('POST', '/api/auth/otp-request', { username: 'admin' });
    console.log('Respuesta del servidor:', otpRes.status, otpRes.body);
    
    // Esperar un segundo para que los logs asíncronos del email terminen de imprimirse
    await new Promise(resolve => setTimeout(resolve, 1500));
  } catch (e) {
    console.error('Error durante la prueba:', e);
  } finally {
    console.log('Deteniendo servidor de prueba...');
    server.kill();
  }
})();
