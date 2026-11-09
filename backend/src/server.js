import http from 'http';
import app from './app.js';
import { initDatabase } from './database/db.js';
import { initWebSocketServer } from './websocket/wsServer.js';
import { EnvironmentService } from './services/jmeter/environmentService.js';

const PORT = process.env.PORT || 3001;

async function bootstrap() {
  try {
    // 1. Initialize Database
    initDatabase();
    console.log('[JMETRIX] Banco de dados SQLite inicializado.');

    // 2. Create HTTP server
    const server = http.createServer(app);

    // 3. Initialize WebSocket Server
    initWebSocketServer(server);
    console.log('[JMETRIX] Servidor WebSocket inicializado na rota /ws.');

    // 4. Start HTTP Server
    server.listen(PORT, async () => {
      console.log(`====================================================`);
      console.log(`🚀 JMETRIX Backend API ativo na porta ${PORT}`);
      console.log(`   http://localhost:${PORT}`);
      console.log(`====================================================`);

      // Environment check
      const env = await EnvironmentService.getEnvironmentStatus();
      if (env.ready) {
        console.log(`[JMETRIX Motor] Apache JMeter ${env.jmeter.version} DETECTADO E PRONTO!`);
        console.log(`   Binário: ${env.jmeter.path}`);
        console.log(`   Java: ${env.java.version}`);
      } else {
        console.warn(`[JMETRIX Motor] ATENÇÃO: Ambiente incompleto.`);
        if (!env.java.available) console.warn(`   Java não encontrado.`);
        if (!env.jmeter.available) console.warn(`   JMeter não encontrado no caminho padrão.`);
      }
    });
  } catch (err) {
    console.error('[JMETRIX Fatal] Falha na inicialização do servidor:', err);
    process.exit(1);
  }
}

bootstrap();

