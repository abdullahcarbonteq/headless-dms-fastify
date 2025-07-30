// src/server.ts
import app from './app.js';
import { config } from './config/index.js';
const PORT = config.server.port;
app.listen({ port: PORT, host: '0.0.0.0' })
    .then(() => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📁 Upload directory: ${config.app.upload.uploadDir}`);
    console.log(`📏 Max file size: ${config.app.upload.maxFileSize / (1024 * 1024)}MB`);
    console.log(`📄 Allowed file types: ${config.app.upload.allowedMimeTypes.join(', ')}`);
    console.log(`🌍 CORS origin: ${config.app.cors.origin}`);
    console.log(`🔧 Environment: ${config.app.environment}`);
})
    .catch((err) => {
    console.error('Error starting server:', err);
    process.exit(1);
});
