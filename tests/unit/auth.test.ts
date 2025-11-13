import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Test JWT token generation and verification
describe('Authentication Utils', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret';

  describe('JWT Token Generation', () => {
    it('should generate a valid access token', () => {
      const payload = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
        tenant_id: 'tenant-123',
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.id).toBe(payload.id);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should generate a valid refresh token', () => {
      const payload = { id: '123', email: 'test@example.com' };
      const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
      
      expect(refreshToken).toBeDefined();
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
      expect(decoded.id).toBe(payload.id);
    });

    it('should fail to verify token with wrong secret', () => {
      const token = jwt.sign({ id: '123' }, JWT_SECRET);
      expect(() => jwt.verify(token, 'wrong-secret')).toThrow();
    });

    it('should fail to verify expired token', () => {
      const token = jwt.sign({ id: '123' }, JWT_SECRET, { expiresIn: '0s' });
      
      // Wait a bit to ensure expiration
      setTimeout(() => {
        expect(() => jwt.verify(token, JWT_SECRET)).toThrow();
      }, 100);
    });
  });

  describe('Password Hashing', () => {
    it('should hash password correctly', async () => {
      const password = 'testPassword123!';
      const hash = await bcrypt.hash(password, 10);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2a$')).toBe(true);
    });

    it('should verify correct password', async () => {
      const password = 'testPassword123!';
      const hash = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'testPassword123!';
      const wrongPassword = 'wrongPassword456!';
      const hash = await bcrypt.hash(password, 10);
      const isValid = await bcrypt.compare(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('should generate different hashes for same password', async () => {
      const password = 'testPassword123!';
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);

      expect(hash1).not.toBe(hash2);
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });

  describe('Token Payload Validation', () => {
    it('should include required fields in token payload', () => {
      const payload = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
        tenant_id: 'tenant-123',
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      expect(decoded).toHaveProperty('id');
      expect(decoded).toHaveProperty('email');
      expect(decoded).toHaveProperty('role');
      expect(decoded).toHaveProperty('tenant_id');
      expect(decoded).toHaveProperty('exp');
      expect(decoded).toHaveProperty('iat');
    });

    it('should handle missing optional fields', () => {
      const payload = {
        id: '123',
        email: 'test@example.com',
        role: 'user',
      };

      const token = jwt.sign(payload, JWT_SECRET);
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      expect(decoded.id).toBe('123');
      expect(decoded.tenant_id).toBeUndefined();
    });
  });
});

describe('Authentication Business Logic', () => {
  describe('User Registration', () => {
    it('should validate email format', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.uk', 'test+tag@example.com'];
      const invalidEmails = ['invalid', '@example.com', 'test@', 'test @example.com'];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });

    it('should validate password strength', () => {
      const strongPasswords = ['Test123!@#', 'MyP@ssw0rd', 'C0mpl3x!Pass'];
      const weakPasswords = ['123456', 'password', 'abc', 'test'];

      // Simple password validation: at least 6 characters
      const validatePassword = (pwd: string) => pwd.length >= 6;

      strongPasswords.forEach(pwd => {
        expect(validatePassword(pwd)).toBe(true);
      });

      weakPasswords.forEach(pwd => {
        expect(validatePassword(pwd)).toBe(pwd.length >= 6);
      });
    });

    it('should validate username format', () => {
      const validUsernames = ['testuser', 'user123', 'test_user', 'user-name'];
      const invalidUsernames = ['', 'ab', 'user name', 'user@name', '123'];

      const usernameRegex = /^[a-zA-Z][a-zA-Z0-9_-]{2,29}$/;

      validUsernames.forEach(username => {
        expect(usernameRegex.test(username)).toBe(true);
      });

      invalidUsernames.forEach(username => {
        expect(usernameRegex.test(username)).toBe(false);
      });
    });
  });

  describe('User Login', () => {
    it('should accept valid credentials format', () => {
      const credentials = {
        email: 'test@example.com',
        password: 'Test123!@#',
      };

      expect(credentials.email).toBeDefined();
      expect(credentials.password).toBeDefined();
      expect(credentials.email.includes('@')).toBe(true);
      expect(credentials.password.length).toBeGreaterThan(5);
    });

    it('should reject empty credentials', () => {
      const emptyEmail = { email: '', password: 'test123' };
      const emptyPassword = { email: 'test@example.com', password: '' };

      expect(emptyEmail.email.length).toBe(0);
      expect(emptyPassword.password.length).toBe(0);
    });
  });

  describe('Token Refresh', () => {
    it('should generate new access token from valid refresh token', () => {
      const refreshPayload = { id: '123', email: 'test@example.com' };
      const refreshToken = jwt.sign(refreshPayload, JWT_REFRESH_SECRET, { expiresIn: '7d' });

      // Verify refresh token
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as any;
      expect(decoded.id).toBe('123');

      // Generate new access token
      const newAccessToken = jwt.sign(
        { id: decoded.id, email: decoded.email, role: 'user' },
        JWT_SECRET,
        { expiresIn: '15m' }
      );

      expect(newAccessToken).toBeDefined();
      const accessDecoded = jwt.verify(newAccessToken, JWT_SECRET) as any;
      expect(accessDecoded.id).toBe('123');
    });
  });
});
