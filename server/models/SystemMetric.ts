import pool from '../db';
import os from 'os';

export interface SystemMetric {
  id: number;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  tenant_id: number | null;
  metadata: any;
  created_at: Date;
}

export class SystemMetricModel {
  // Registrar métrica
  static async record(data: {
    metric_type: string;
    metric_name: string;
    metric_value: number;
    tenant_id?: number;
    metadata?: any;
  }): Promise<SystemMetric> {
    const result = await pool.query(
      `INSERT INTO system_metrics 
       (metric_type, metric_name, metric_value, tenant_id, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.metric_type,
        data.metric_name,
        data.metric_value,
        data.tenant_id || null,
        data.metadata ? JSON.stringify(data.metadata) : null
      ]
    );
    return result.rows[0];
  }

  // Obter métricas do sistema em tempo real
  static async getSystemMetrics(): Promise<any> {
    const cpuUsage = os.loadavg()[0] / os.cpus().length * 100;
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memoryUsage = ((totalMem - freeMem) / totalMem) * 100;

    return {
      cpu_usage: Math.round(cpuUsage * 100) / 100,
      memory_usage: Math.round(memoryUsage * 100) / 100,
      memory_total: Math.round(totalMem / 1024 / 1024 / 1024 * 100) / 100, // GB
      memory_used: Math.round((totalMem - freeMem) / 1024 / 1024 / 1024 * 100) / 100, // GB
      uptime: os.uptime(),
      platform: os.platform(),
      hostname: os.hostname()
    };
  }

  // Estatísticas de requests por tenant
  static async requestsByTenant(hours: number = 24): Promise<any> {
    const result = await pool.query(
      `SELECT 
         tenant_id,
         COUNT(*) as total_requests,
         AVG(metric_value) as avg_response_time,
         MAX(metric_value) as max_response_time
       FROM system_metrics
       WHERE metric_type = 'request'
         AND created_at >= NOW() - INTERVAL '${hours} hours'
       GROUP BY tenant_id
       ORDER BY total_requests DESC`,
      []
    );
    return result.rows;
  }

  // Métricas de performance
  static async getPerformanceMetrics(hours: number = 1): Promise<any> {
    const result = await pool.query(
      `SELECT 
         metric_name,
         AVG(metric_value) as avg_value,
         MIN(metric_value) as min_value,
         MAX(metric_value) as max_value,
         COUNT(*) as count
       FROM system_metrics
       WHERE metric_type = 'performance'
         AND created_at >= NOW() - INTERVAL '${hours} hours'
       GROUP BY metric_name`,
      []
    );
    return result.rows;
  }

  // Limpar métricas antigas
  static async cleanup(days: number = 7): Promise<number> {
    const result = await pool.query(
      'DELETE FROM system_metrics WHERE created_at < NOW() - INTERVAL \'$1 days\'',
      [days]
    );
    return result.rowCount || 0;
  }
}
