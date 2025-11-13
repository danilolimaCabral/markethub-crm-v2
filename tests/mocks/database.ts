import { vi } from 'vitest';

// Mock database query function
export const mockQuery = vi.fn();

// Mock successful user query
export const mockUserQuery = {
  rows: [
    {
      id: '123e4567-e89b-12d3-a456-426614174000',
      email: 'test@example.com',
      username: 'testuser',
      password_hash: '$2a$10$XvKvq1ZjK5Q5L5Y5P5K5Q5O5O5O5O5O5O5O5O5O5O5O5O5O5O',
      role: 'user',
      tenant_id: '123e4567-e89b-12d3-a456-426614174001',
      is_active: true,
      two_factor_enabled: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ],
  rowCount: 1,
};

// Mock admin user
export const mockAdminQuery = {
  rows: [
    {
      id: '123e4567-e89b-12d3-a456-426614174002',
      email: 'admin@example.com',
      username: 'admin',
      password_hash: '$2a$10$XvKvq1ZjK5Q5L5Y5P5K5Q5O5O5O5O5O5O5O5O5O5O5O5O5O5O',
      role: 'admin',
      tenant_id: '123e4567-e89b-12d3-a456-426614174001',
      is_active: true,
      two_factor_enabled: false,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ],
  rowCount: 1,
};

// Mock empty query result
export const mockEmptyQuery = {
  rows: [],
  rowCount: 0,
};

// Mock insert result
export const mockInsertQuery = {
  rows: [{ id: '123e4567-e89b-12d3-a456-426614174003' }],
  rowCount: 1,
};
