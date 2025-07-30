import { configSchema } from './schemas.js';
/**
 * Load and validate configuration from environment variables
 * This function will throw an error if required configuration is missing or invalid
 */
function loadConfig() {
    const rawConfig = {
        database: {
            url: process.env.DATABASE_URL,
        },
        jwt: {
            secret: process.env.JWT_SECRET,
            expiresIn: process.env.JWT_EXPIRES_IN,
        },
        server: {
            port: process.env.PORT,
            host: process.env.HOST,
        },
        app: {
            environment: process.env.NODE_ENV,
            cors: {
                origin: process.env.CORS_ORIGIN,
                credentials: process.env.CORS_CREDENTIALS === 'true',
            },
            logging: {
                level: process.env.LOG_LEVEL,
                format: process.env.LOG_FORMAT,
                enableConsole: process.env.LOG_ENABLE_CONSOLE === 'true',
                enableFile: process.env.LOG_ENABLE_FILE === 'true',
                filePath: process.env.LOG_FILE_PATH,
            },
            upload: {
                maxFileSize: process.env.UPLOAD_MAX_FILE_SIZE,
                allowedMimeTypes: process.env.UPLOAD_ALLOWED_MIME_TYPES
                    ? process.env.UPLOAD_ALLOWED_MIME_TYPES.split(',').map(type => type.trim())
                    : undefined,
                uploadDir: process.env.UPLOAD_DIR,
                maxFiles: process.env.UPLOAD_MAX_FILES,
            },
        },
    };
    // Validate configuration
    const result = configSchema.safeParse(rawConfig);
    if (!result.success) {
        console.error('❌ Configuration validation failed:');
        console.error(result.error.format());
        throw new Error('Invalid configuration. Please check your environment variables.');
    }
    console.log('✅ Configuration loaded successfully');
    return result.data;
}
// Export the validated configuration
export const config = loadConfig();
// Export individual config sections for convenience
export const { database, jwt, server, app } = config;
