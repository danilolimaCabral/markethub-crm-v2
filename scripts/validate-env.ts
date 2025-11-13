/**
 * Environment Variables Validation Script
 * 
 * This script validates that all required environment variables are set
 * and have valid values before starting the application.
 */

import dotenv from 'dotenv';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config();

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Define validation schema for environment variables
const envSchema = z.object({
  // Application
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  FRONTEND_URL: z.string().url().optional(),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().int().positive().optional(),
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  
  // JWT Secrets
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Super Admin (optional)
  SUPERADMIN_USERNAME: z.string().optional(),
  SUPERADMIN_PASSWORD: z.string().optional(),
  
  // Mercado Livre API (optional but recommended)
  ML_CLIENT_ID: z.string().optional(),
  ML_CLIENT_SECRET: z.string().optional(),
  ML_REDIRECT_URI: z.string().url().optional(),
  
  // Monitoring (optional)
  SENTRY_DSN: z.string().url().optional(),
  
  // Redis (optional)
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.coerce.number().int().positive().optional(),
  REDIS_PASSWORD: z.string().optional(),
});

type EnvVars = z.infer<typeof envSchema>;

/**
 * Print section header
 */
function printHeader(title: string): void {
  console.log(`\n${colors.cyan}═══════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}  ${title}${colors.reset}`);
  console.log(`${colors.cyan}═══════════════════════════════════════════════════${colors.reset}\n`);
}

/**
 * Print success message
 */
function printSuccess(message: string): void {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

/**
 * Print warning message
 */
function printWarning(message: string): void {
  console.log(`${colors.yellow}⚠️  ${message}${colors.reset}`);
}

/**
 * Print error message
 */
function printError(message: string): void {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

/**
 * Print info message
 */
function printInfo(message: string): void {
  console.log(`${colors.blue}ℹ️  ${message}${colors.reset}`);
}

/**
 * Check if .env file exists
 */
function checkEnvFileExists(): boolean {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    printError('.env file not found!');
    printInfo('Create a .env file based on .env.example');
    return false;
  }
  printSuccess('.env file found');
  return true;
}

/**
 * Validate environment variables
 */
function validateEnvironment(): { success: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
      result.error.errors.forEach(err => {
        const path = err.path.join('.');
        const message = err.message;
        errors.push(`${path}: ${message}`);
      });
    } else {
      printSuccess('All required environment variables are valid');
    }
  } catch (error) {
    errors.push(`Validation error: ${error}`);
  }

  // Check optional but important variables
  const optionalImportant = [
    'ML_CLIENT_ID',
    'ML_CLIENT_SECRET',
    'SENTRY_DSN',
    'REDIS_URL',
  ];

  optionalImportant.forEach(key => {
    if (!process.env[key]) {
      warnings.push(`${key} is not set (optional but recommended for production)`);
    }
  });

  return { success: errors.length === 0, errors, warnings };
}

/**
 * Check JWT secrets strength
 */
function checkJWTSecrets(): void {
  const jwtSecret = process.env.JWT_SECRET || '';
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || '';

  if (jwtSecret.length < 32) {
    printError('JWT_SECRET is too weak (less than 32 characters)');
  } else if (jwtSecret === jwtRefreshSecret) {
    printWarning('JWT_SECRET and JWT_REFRESH_SECRET should be different');
  } else if (jwtSecret.includes('change') || jwtSecret.includes('secret')) {
    printWarning('JWT_SECRET appears to be a placeholder. Change it to a random string!');
  } else {
    printSuccess('JWT secrets are properly configured');
  }
}

/**
 * Check database connection string
 */
function checkDatabaseURL(): void {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    printError('DATABASE_URL is not set');
    return;
  }

  if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
    printWarning('DATABASE_URL points to localhost (ok for development)');
  } else {
    printSuccess('DATABASE_URL is configured');
  }

  if (dbUrl.includes('postgres') || dbUrl.includes('postgresql')) {
    printSuccess('Using PostgreSQL database');
  }
}

/**
 * Check Mercado Livre configuration
 */
function checkMercadoLivreConfig(): void {
  const mlClientId = process.env.ML_CLIENT_ID;
  const mlClientSecret = process.env.ML_CLIENT_SECRET;

  if (!mlClientId || !mlClientSecret) {
    printWarning('Mercado Livre API credentials not configured');
    printInfo('Integration will not work without ML_CLIENT_ID and ML_CLIENT_SECRET');
  } else {
    printSuccess('Mercado Livre API credentials configured');
  }
}

/**
 * Generate example .env file
 */
function generateEnvExample(): void {
  const examplePath = path.join(process.cwd(), '.env.example');
  
  if (fs.existsSync(examplePath)) {
    printSuccess('.env.example file exists');
  } else {
    printInfo('Creating .env.example file...');
    
    const exampleContent = `# Application
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/markethub

# JWT Secrets (change these to random strings!)
JWT_SECRET=change-this-to-a-random-secret-key-at-least-32-chars
JWT_REFRESH_SECRET=change-this-to-another-random-secret-key-32-chars
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Super Admin (optional)
SUPERADMIN_USERNAME=admin
SUPERADMIN_PASSWORD=change-this-password

# Mercado Livre API
ML_CLIENT_ID=your-ml-client-id
ML_CLIENT_SECRET=your-ml-client-secret
ML_REDIRECT_URI=http://localhost:3000/api/mercadolivre/callback

# Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Redis (optional)
REDIS_URL=redis://localhost:6379
`;

    fs.writeFileSync(examplePath, exampleContent);
    printSuccess('.env.example file created');
  }
}

/**
 * Main validation function
 */
function main(): void {
  printHeader('🔍 Environment Variables Validation');

  // Check .env file exists
  if (!checkEnvFileExists()) {
    generateEnvExample();
    process.exit(1);
  }

  // Validate all environment variables
  printHeader('📋 Validating Required Variables');
  const validation = validateEnvironment();

  // Print errors
  if (validation.errors.length > 0) {
    printHeader('❌ Validation Errors');
    validation.errors.forEach(err => printError(err));
  }

  // Print warnings
  if (validation.warnings.length > 0) {
    printHeader('⚠️  Warnings');
    validation.warnings.forEach(warn => printWarning(warn));
  }

  // Additional checks
  printHeader('🔐 Security Checks');
  checkJWTSecrets();

  printHeader('🗄️  Database Configuration');
  checkDatabaseURL();

  printHeader('🛍️  Marketplace Integration');
  checkMercadoLivreConfig();

  // Summary
  printHeader('📊 Validation Summary');
  if (validation.success) {
    printSuccess('All required environment variables are properly configured!');
    printInfo('You can now start the application.');
    process.exit(0);
  } else {
    printError(`Found ${validation.errors.length} error(s)`);
    printWarning(`Found ${validation.warnings.length} warning(s)`);
    printInfo('Fix the errors before starting the application.');
    process.exit(1);
  }
}

// Run validation
main();
