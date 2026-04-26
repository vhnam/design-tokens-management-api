import { HealthCheckResult, HealthCheckService } from '@nestjs/terminus';

import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;
  let healthCheckService: { check: jest.Mock };
  let healthIndicatorService: { check: jest.Mock };
  let mockDb: { execute: jest.Mock };

  beforeEach(() => {
    jest.clearAllMocks();

    healthCheckService = {
      check: jest.fn(),
    };
    healthIndicatorService = {
      check: jest.fn().mockReturnValue({
        up: jest.fn().mockReturnValue({ database: { status: 'up' } }),
        down: jest.fn().mockImplementation((message: string) => ({
          database: { status: 'down', message },
        })),
      }),
    };
    mockDb = {
      execute: jest.fn(),
    };
    service = new AppService(
      mockDb as never,
      healthCheckService as unknown as HealthCheckService,
      healthIndicatorService,
    );
  });

  it('should run database indicator via Terminus health check', async () => {
    const healthResult: HealthCheckResult = {
      status: 'ok',
      info: { database: { status: 'up' } },
      error: {},
      details: { database: { status: 'up' } },
    };
    mockDb.execute.mockResolvedValue([{ '?column?': 1 }]);
    healthCheckService.check.mockImplementationOnce(
      async (indicators: Array<() => Promise<unknown>>) => {
        await indicators[0]();
        return healthResult;
      },
    );

    await expect(service.checkHealth()).resolves.toEqual(healthResult);
    expect(healthCheckService.check).toHaveBeenCalledTimes(1);
    expect(healthIndicatorService.check).toHaveBeenCalledWith('database');
    expect(mockDb.execute).toHaveBeenCalledTimes(1);
  });

  it('should report database down when query fails', async () => {
    const healthResult: HealthCheckResult = {
      status: 'error',
      info: {},
      error: { database: { status: 'down', message: 'DB unavailable' } },
      details: { database: { status: 'down', message: 'DB unavailable' } },
    };

    mockDb.execute.mockRejectedValue(new Error('DB unavailable'));
    healthCheckService.check.mockImplementationOnce(
      async (indicators: Array<() => Promise<unknown>>) => {
        const indicatorResult = await indicators[0]();
        expect(indicatorResult).toEqual({
          database: { status: 'down', message: 'DB unavailable' },
        });
        return healthResult;
      },
    );

    await expect(service.checkHealth()).resolves.toEqual(healthResult);
    expect(healthCheckService.check).toHaveBeenCalledTimes(1);
    expect(healthIndicatorService.check).toHaveBeenCalledWith('database');
    expect(mockDb.execute).toHaveBeenCalledTimes(1);
  });
});
