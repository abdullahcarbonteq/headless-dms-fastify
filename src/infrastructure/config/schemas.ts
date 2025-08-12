import { z } from 'zod';

// 12 FACTOR APP: Config - Environment-based configuration
const portSchema = z.coerce.number()
  .int()
  .min(1, 'Port must be at least 1')
  .max(65535, 'Port must be at most 65535')
  .default(3000);

const hostSchema = z.string()
  .min(1, 'Host cannot be empty')
  .default('0.0.0.0');

const environmentSchema = z.enum(['development', 'production', 'test'])
  .default('development');

const jwtConfigSchema = z.object({
  secret: z.string().min(1, 'JWT secret is required'),
  expiresIn: z.string().default('24h'),
});

const databaseConfigSchema = z.object({
  url: z.string().min(1, 'Database URL is required'),
});

// 12 FACTOR APP: Port Binding - Services export via port binding
const serverConfigSchema = z.object({
  port: portSchema,
  host: hostSchema,
});

const corsConfigSchema = z.object({
  origin: z.string().default('*'),
  credentials: z.boolean().default(false),
});

const loggingConfigSchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  format: z.enum(['json', 'text']).default('json'),
  enableConsole: z.boolean().default(true),
  enableFile: z.boolean().default(false),
  filePath: z.string().optional(),
});

const uploadConfigSchema = z.object({
  maxFileSize: z.coerce.number()
    .int()
    .positive('Max file size must be a positive number')
    .default(10485760), // 10MB default
  allowedMimeTypes: z.array(z.string()).optional(),
  uploadDir: z.string().default('./uploads'),
  maxFiles: z.coerce.number()
    .int()
    .positive('Max files must be a positive number')
    .default(10),
});

const appConfigSchema = z.object({
  environment: environmentSchema,
  cors: corsConfigSchema,
  logging: loggingConfigSchema,
  upload: uploadConfigSchema,
});

export const configSchema = z.object({
  database: databaseConfigSchema,
  jwt: jwtConfigSchema,
  server: serverConfigSchema,
  app: appConfigSchema,
});

export type Config = z.infer<typeof configSchema>;
export type DatabaseConfig = z.infer<typeof databaseConfigSchema>;
export type JWTConfig = z.infer<typeof jwtConfigSchema>;
export type ServerConfig = z.infer<typeof serverConfigSchema>;
export type AppConfig = z.infer<typeof appConfigSchema>; 