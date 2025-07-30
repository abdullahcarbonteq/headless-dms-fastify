import { z } from 'zod';

// Database configuration schema
export const databaseConfigSchema = z.object({
  url: z.string().url('DATABASE_URL must be a valid URL'),
});

// JWT configuration schema
export const jwtConfigSchema = z.object({
  secret: z.string().min(1, 'JWT_SECRET is required'),
  expiresIn: z.string().default('24h'),
});

// Server configuration schema
export const serverConfigSchema = z.object({
  port: z.coerce.number().int().positive().default(3000),
  host: z.string().default('0.0.0.0'),
});

// Logging configuration schema
export const loggingConfigSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  format: z.enum(['json', 'simple']).default('simple'),
  enableConsole: z.boolean().default(true),
  enableFile: z.boolean().default(false),
  filePath: z.string().optional(),
});

// Upload configuration schema
export const uploadConfigSchema = z.object({
  maxFileSize: z.coerce.number().int().positive().default(10 * 1024 * 1024), // 10MB
  allowedMimeTypes: z.array(z.string()).default(['application/pdf', 'image/jpeg', 'image/png']),
  uploadDir: z.string().default('uploads'),
  maxFiles: z.coerce.number().int().positive().default(1),
});

// Application configuration schema
export const appConfigSchema = z.object({
  environment: z.enum(['development', 'production', 'test']).default('development'),
  cors: z.object({
    origin: z.string().default('*'),
    credentials: z.boolean().default(true),
  }),
  logging: loggingConfigSchema,
  upload: uploadConfigSchema,
});

// Root configuration schema
export const configSchema = z.object({
  database: databaseConfigSchema,
  jwt: jwtConfigSchema,
  server: serverConfigSchema,
  app: appConfigSchema,
});

// Type exports
export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
export type JWTConfig = z.infer<typeof jwtConfigSchema>;
export type ServerConfig = z.infer<typeof serverConfigSchema>;
export type LoggingConfig = z.infer<typeof loggingConfigSchema>;
export type UploadConfig = z.infer<typeof uploadConfigSchema>;
export type AppConfig = z.infer<typeof appConfigSchema>;
export type Config = z.infer<typeof configSchema>; 