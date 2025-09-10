import { NextApiRequest, NextApiResponse } from 'next';

interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version?: string;
  environment: string;
  checks: {
    server: 'ok' | 'error';
    memory: 'ok' | 'warning' | 'error';
    nodejs: 'ok' | 'error';
  };
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse>
) {
  try {
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
    const memoryTotalMB = Math.round(memoryUsage.heapTotal / 1024 / 1024);

    // Memory check: warn if over 80% usage, error if over 95%
    const memoryPercentage = (memoryUsedMB / memoryTotalMB) * 100;
    let memoryStatus: 'ok' | 'warning' | 'error' = 'ok';
    if (memoryPercentage > 95) {
      memoryStatus = 'error';
    } else if (memoryPercentage > 80) {
      memoryStatus = 'warning';
    }

    const health: HealthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version,
      environment: process.env.NODE_ENV || 'unknown',
      checks: {
        server: 'ok',
        memory: memoryStatus,
        nodejs: 'ok',
      },
    };

    // Overall health status
    const hasErrors = Object.values(health.checks).includes('error');
    if (hasErrors) {
      health.status = 'unhealthy';
      res.status(503);
    } else {
      res.status(200);
    }

    res.json(health);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
      checks: {
        server: 'error',
        memory: 'error',
        nodejs: 'error',
      },
    });
  }
}