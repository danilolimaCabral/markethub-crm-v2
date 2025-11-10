import pool from '../db';

export interface SystemLog {
  id: number;
  tenant_id: number | null;
  level: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  message: string;
  stack_trace: string | null;
  user_id: number | null;
  ip_address: string | null;
  user_agent: string | null;
  request_url: string | null;
  request_method: string | null;
  metadata: any;
  created_at: Date;
}

export class SystemLogModel {
  // Criar log
  static async create(data: {
    tenant_id?: number;
    level: 'info' | 'warning' | 'error' | 'critical';
    category: string;
    message: string;
    stack_trace?: string;
    user_id?: number;
    ip_address?: string;
    user_agent?: string;
    request_url?: string;
    request_method?: string;
    metadata?: any;
  }): Promise<SystemLog> {
    const result = await pool.query(
      `INSERT INTO system_logs 
       (tenant_id, level, category, message, stack_trace, user_id, ip_address, user_agent, request_url, request_method, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        data.tenant_id || null,
        data.level,
        data.category,
        data.message,
        data.stack_trace || null,
        data.user_id || null,
        data.ip_address || null,
        data.user_agent || null,
        data.request_url || null,
        data.request_method || null,
        data.metadata ? JSON.stringify(data.metadata) : null
      ]
    );
    return result.rows[0];
  }

  // Listar logs com filtros
  static async list(filters: {
    tenant_id?: number;
    level?: string;
    category?: string;
    limit?: number;
    offset?: number;
    start_date?: Date;
    end_date?: Date;
  }): Promise<SystemLog[]> {
    let query = 'SELECT * FROM system_logs WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.tenant_id !== undefined) {
      query += ` AND tenant_id = $${paramIndex}`;
      params.push(filters.tenant_id);
      paramIndex++;
    }

    if (filters.level) {
      query += ` AND level = $${paramIndex}`;
      params.push(filters.level);
      paramIndex++;
    }

    if (filters.category) {
      query += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }

    if (filters.start_date) {
      query += ` AND created_at >= $${paramIndex}`;
      params.push(filters.start_date);
      paramIndex++;
    }

    if (filters.end_date) {
      query += ` AND created_at <= $${paramIndex}`;
      params.push(filters.end_date);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(filters.limit);
      paramIndex++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramIndex}`;
      params.push(filters.offset);
      paramIndex++;
    }

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Contar logs por nível
  static async countByLevel(tenant_id?: number): Promise<any> {
    let query = `
      SELECT level, COUNT(*) as count
      FROM system_logs
      WHERE 1=1
    `;
    const params: any[] = [];

    if (tenant_id !== undefined) {
      query += ' AND tenant_id = $1';
      params.push(tenant_id);
    }

    query += ' GROUP BY level';

    const result = await pool.query(query, params);
    return result.rows;
  }

  // Estatísticas de erros por tenant
  static async errorsByTenant(hours: number = 24): Promise<any> {
    const result = await pool.query(
      `SELECT 
         t.id as tenant_id,
         t.name as tenant_name,
         COUNT(*) FILTER (WHERE sl.level = 'error') as errors,
         COUNT(*) FILTER (WHERE sl.level = 'critical') as critical_errors,
         COUNT(*) FILTER (WHERE sl.level = 'warning') as warnings,
         MAX(sl.created_at) as last_error_at
       FROM tenants t
       LEFT JOIN system_logs sl ON t.id = sl.tenant_id 
         AND sl.created_at >= NOW() - INTERVAL '${hours} hours'
         AND sl.level IN ('error', 'critical', 'warning')
       GROUP BY t.id, t.name
       ORDER BY errors DESC, critical_errors DESC`,
      []
    );
    return result.rows;
  }

  // Limpar logs antigos
  static async cleanup(days: number = 30): Promise<number> {
    const result = await pool.query(
      'DELETE FROM system_logs WHERE created_at < NOW() - INTERVAL \'$1 days\'',
      [days]
    );
    return result.rowCount || 0;
  }
}
