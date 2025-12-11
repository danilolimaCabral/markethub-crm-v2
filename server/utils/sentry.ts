/**
 * Sentry Integration for Error Monitoring
 * 
 * This module configures Sentry for production error tracking and monitoring.
 * It includes performance monitoring and custom error handlers.
 */

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { Express, Request, Response, NextFunction } from 'express';

const SENTRY_DSN = process.env.SENTRY_DSN;
const NODE_ENV = process.env.NODE_ENV || 'development';
const APP_VERSION = process.env.npm_package_version || '1.0.0';

/**
 * Initialize Sentry
 */
export function initSentry(): void {
  if (!SENTRY_DSN) {
    console.warn('⚠️  Sentry DSN not configured. Error monitoring disabled.');
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: NODE_ENV,
    release: `markethub-crm@${APP_VERSION}`,
    
    // Performance Monitoring
    tracesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0,
    
    // Profiling
    profilesSampleRate: NODE_ENV === 'production' ? 0.1 : 1.0,
    integrations: [
      nodeProfilingIntegration(),
    ],
    
    // Filter sensitive data
    beforeSend(event, hint) {
      // Remove sensitive information
      if (event.request) {
        delete event.request.cookies;
        if (event.request.headers) {
          delete event.request.headers.authorization;
          delete event.request.headers.cookie;
        }
      }
      
      return event;
    },
    
    // Ignore certain errors
    ignoreErrors: [
      'ECONNREFUSED',
      'ENOTFOUND',
      'ETIMEDOUT',
      'NetworkError',
      'Non-Error promise rejection',
    ],
    
    // Debug mode
    debug: NODE_ENV === 'development',
  });

  console.log('✅ Sentry initialized successfully');
}

/**
 * Setup Sentry request handler middleware
 */
export function setupSentryRequestHandler(app: Express): void {
  if (!SENTRY_DSN) return;
  
  // Sentry request handler - nova API v8+
  app.use(Sentry.setupExpressErrorHandler);
}

/**
 * Setup Sentry error handler middleware
 * IMPORTANT: This must be added AFTER all routes and BEFORE other error handlers
 */
export function setupSentryErrorHandler(app: Express): void {
  if (!SENTRY_DSN) return;
  
  // Error handler já configurado no setupExpressErrorHandler
}

/**
 * Capture exception manually
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (!SENTRY_DSN) {
    console.error('Error (Sentry disabled):', error);
    return;
  }

  Sentry.captureException(error, {
    extra: context,
  });
}

/**
 * Capture message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (!SENTRY_DSN) {
    console.log(`[${level.toUpperCase()}] ${message}`);
    return;
  }

  Sentry.captureMessage(message, level);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, data?: Record<string, any>): void {
  if (!SENTRY_DSN) return;

  Sentry.addBreadcrumb({
    message,
    level: 'info',
    data,
  });
}

/**
 * Set user context for error tracking
 */
export function setUser(user: { id: string; email?: string; username?: string }): void {
  if (!SENTRY_DSN) return;

  Sentry.setUser({
    id: user.id,
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context
 */
export function clearUser(): void {
  if (!SENTRY_DSN) return;
  Sentry.setUser(null);
}

/**
 * Create Sentry transaction for performance monitoring
 */
export function startTransaction(name: string, op: string = 'http.request') {
  if (!SENTRY_DSN) return null;
  
  return Sentry.startSpan({
    name,
    op,
  }, () => {});
}

/**
 * Custom error handler middleware with Sentry integration
 */
export function sentryErrorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  console.error('Error caught by Sentry middleware:', err);

  // Capture in Sentry
  Sentry.captureException(err, {
    extra: {
      url: req.url,
      method: req.method,
      body: req.body,
      query: req.query,
      user: (req as any).user,
    },
  });

  // Send error response
  const statusCode = err.status || 500;
  const message = NODE_ENV === 'production'
    ? 'Internal Server Error'
    : err.message || 'Something went wrong';

  res.status(statusCode).json({
    error: message,
    ...(NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

/**
 * Health check with Sentry status
 */
export function getSentryStatus(): { enabled: boolean; dsn?: string } {
  return {
    enabled: !!SENTRY_DSN,
    dsn: SENTRY_DSN ? '***' + SENTRY_DSN.slice(-10) : undefined,
  };
}

export default {
  initSentry,
  setupSentryRequestHandler,
  setupSentryErrorHandler,
  captureException,
  captureMessage,
  addBreadcrumb,
  setUser,
  clearUser,
  startTransaction,
  sentryErrorMiddleware,
  getSentryStatus,
};
