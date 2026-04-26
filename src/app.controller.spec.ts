import { HealthCheckResult } from '@nestjs/terminus';
import { Test, TestingModule } from '@nestjs/testing';

import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let appService: { checkHealth: jest.Mock };

  beforeEach(async () => {
    appService = {
      checkHealth: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: appService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('checkHealth', () => {
    it('should return health check result from service', async () => {
      const healthResult: HealthCheckResult = {
        status: 'ok',
        info: { database: { status: 'up' } },
        error: {},
        details: { database: { status: 'up' } },
      };
      appService.checkHealth.mockResolvedValue(healthResult);

      await expect(appController.checkHealth()).resolves.toEqual(healthResult);
      expect(appService.checkHealth).toHaveBeenCalledTimes(1);
    });
  });
});
