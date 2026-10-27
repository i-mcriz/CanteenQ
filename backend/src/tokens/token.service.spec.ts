import { Test, TestingModule } from '@nestjs/testing';
import { TokenService } from './token.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TokenService', () => {
  let service: TokenService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      queueToken: {
        count: jest.fn().mockResolvedValue(23),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  it('should generate next token in sequential format SQ-{number}', async () => {
    const token = await service.generateNextToken();
    expect(token).toBe('SQ-124'); // 101 + 23 = 124
  });

  it('should generate secure pickup verification code without leaking sensitive info', () => {
    const code = service.generateQrVerificationCode('SQ-124', 'order-abc-987654');
    expect(code).toContain('SQ-PICKUP:SQ-124:987654:');
    expect(code).not.toContain('password');
    expect(code).not.toContain('card');
  });
});
