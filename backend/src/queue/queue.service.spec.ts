import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';

describe('QueueService', () => {
  let service: QueueService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      order: {
        findUnique: jest.fn(),
        count: jest.fn(),
      },
      staff: {
        count: jest.fn().mockResolvedValue(4),
      },
      canteen: {
        findFirst: jest.fn().mockResolvedValue({ maxCapacity: 50 }),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('should calculate queue position correctly based on orders ahead', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord-123',
      createdAt: new Date(),
      status: OrderStatus.PREPARING,
    });
    prisma.order.count.mockResolvedValue(5);

    const position = await service.calculateQueuePosition('ord-123');
    expect(position).toBe(6); // 5 ahead + 1
  });

  it('should return position 0 for completed orders', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord-123',
      createdAt: new Date(),
      status: OrderStatus.COMPLETED,
    });

    const position = await service.calculateQueuePosition('ord-123');
    expect(position).toBe(0);
  });

  it('should calculate waiting time dynamically based on prep time and stations', async () => {
    prisma.order.findUnique.mockResolvedValue({
      id: 'ord-456',
      status: OrderStatus.ACCEPTED,
      items: [
        { foodItem: { preparationTime: 10 } },
        { foodItem: { preparationTime: 6 } },
      ],
    });
    prisma.order.count.mockResolvedValue(3); // 3 orders ahead

    const waitTime = await service.calculateWaitingTime('ord-456');
    expect(waitTime).toBeGreaterThanOrEqual(10);
  });

  it('should categorize crowd density properly (LOW, MODERATE, HIGH)', async () => {
    // 15 orders on 50 capacity = 30% -> LOW
    prisma.order.count.mockResolvedValue(15);
    let crowd = await service.calculateCrowdDensity();
    expect(crowd.percentage).toBe(30);
    expect(crowd.status).toBe('LOW');

    // 25 orders on 50 capacity = 50% -> MODERATE
    prisma.order.count.mockResolvedValue(25);
    crowd = await service.calculateCrowdDensity();
    expect(crowd.percentage).toBe(50);
    expect(crowd.status).toBe('MODERATE');

    // 42 orders on 50 capacity = 84% -> HIGH
    prisma.order.count.mockResolvedValue(42);
    crowd = await service.calculateCrowdDensity();
    expect(crowd.percentage).toBe(84);
    expect(crowd.status).toBe('HIGH');
  });
});
