import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StaffService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.staff.findMany({
      include: { user: true },
      orderBy: { employeeId: 'asc' },
    });
  }

  async findByUserId(userId: string) {
    return this.prisma.staff.findUnique({
      where: { userId },
      include: { user: true },
    });
  }
}
