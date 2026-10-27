import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string) {
    const cleanEmail = email.toLowerCase().trim();
    let user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        student: true,
        staff: true,
      },
    });

    if (!user) {
      if (cleanEmail === 'chef@canteenq.local') {
        user = await this.prisma.user.findUnique({
          where: { email: 'staff@canteenq.local' },
          include: { student: true, staff: true },
        });
      } else if (cleanEmail === 'staff@canteenq.local') {
        user = await this.prisma.user.findUnique({
          where: { email: 'chef@canteenq.local' },
          include: { student: true, staff: true },
        });
      }
    }

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }

  async login(email: string, pass: string) {
    const user = await this.validateUser(email, pass);
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }

  async register(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: Role;
    department?: string;
    semester?: number;
    className?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const role = data.role || Role.STUDENT;

    const user = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase().trim(),
        phone: data.phone,
        passwordHash,
        role,
        isActive: true,
        ...(role === Role.STUDENT
          ? {
              student: {
                create: {
                  studentId: `STU-${Date.now().toString().slice(-6)}`,
                  department: data.department || 'General',
                  semester: data.semester || 1,
                  className: data.className || 'Sec-A',
                  cart: {
                    create: { totalAmount: 0 },
                  },
                },
              },
            }
          : {}),
      },
      include: {
        student: true,
        staff: true,
      },
    });

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user,
    };
  }

  async getCurrentUser(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        student: true,
        staff: true,
      },
    });
  }
}
