import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class TokenService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generates next sequential authoritative token number: e.g. SQ-101, SQ-102
   */
  async generateNextToken(): Promise<string> {
    const totalTokensCount = await this.prisma.queueToken.count();
    const nextSeq = 101 + totalTokensCount;
    return `SQ-${nextSeq}`;
  }

  /**
   * Creates a secure QR pickup verification signature string.
   * Does NOT contain passwords, cards, or sensitive data.
   */
  generateQrVerificationCode(tokenNumber: string, orderId: string): string {
    const salt = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `SQ-PICKUP:${tokenNumber}:${orderId.slice(-6)}:${salt}`;
  }
}
