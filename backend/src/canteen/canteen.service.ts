import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CanteenService {
  constructor(private prisma: PrismaService) {}

  async getCanteen() {
    let canteen = await this.prisma.canteen.findFirst();
    if (!canteen) {
      canteen = await this.prisma.canteen.create({
        data: {
          name: 'Campus Central Canteen',
          location: 'Block A, Ground Floor',
          openingTime: '08:00',
          closingTime: '20:00',
          maxCapacity: 60,
          status: 'OPEN',
        },
      });
    }
    return canteen;
  }

  async updateCanteen(data: {
    name?: string;
    location?: string;
    openingTime?: string;
    closingTime?: string;
    maxCapacity?: number;
    status?: string;
  }) {
    const canteen = await this.getCanteen();
    return this.prisma.canteen.update({
      where: { id: canteen.id },
      data,
    });
  }
}
