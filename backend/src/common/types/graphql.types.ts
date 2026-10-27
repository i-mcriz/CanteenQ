import { ObjectType, Field, ID, Float, Int, registerEnumType, InputType } from '@nestjs/graphql';
import { Role, OrderStatus, PaymentStatus } from '@prisma/client';

registerEnumType(Role, { name: 'Role' });
registerEnumType(OrderStatus, { name: 'OrderStatus' });
registerEnumType(PaymentStatus, { name: 'PaymentStatus' });

@ObjectType()
export class UserType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  phone?: string;

  @Field(() => Role)
  role: Role;

  @Field()
  isActive: boolean;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class StudentType {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field(() => UserType, { nullable: true })
  user?: UserType;

  @Field()
  studentId: string;

  @Field()
  department: string;

  @Field(() => Int)
  semester: number;

  @Field()
  className: string;
}

@ObjectType()
export class StaffType {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field(() => UserType, { nullable: true })
  user?: UserType;

  @Field()
  employeeId: string;

  @Field()
  designation: string;

  @Field()
  shift: string;
}

@ObjectType()
export class CanteenType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  location: string;

  @Field()
  openingTime: string;

  @Field()
  closingTime: string;

  @Field(() => Int)
  maxCapacity: number;

  @Field()
  status: string;
}

@ObjectType()
export class CategoryType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;
}

@ObjectType()
export class FoodItemType {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => Float)
  price: number;

  @Field({ nullable: true })
  image?: string;

  @Field()
  categoryId: string;

  @Field(() => CategoryType, { nullable: true })
  category?: CategoryType;

  @Field(() => Int)
  preparationTime: number;

  @Field(() => Int)
  stockQuantity: number;

  @Field()
  isAvailable: boolean;

  @Field()
  isVeg: boolean;

  @Field(() => Float)
  rating: number;
}

@ObjectType()
export class CartItemType {
  @Field(() => ID)
  id: string;

  @Field()
  cartId: string;

  @Field()
  foodItemId: string;

  @Field(() => FoodItemType)
  foodItem: FoodItemType;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  subtotal: number;
}

@ObjectType()
export class CartType {
  @Field(() => ID)
  id: string;

  @Field()
  studentId: string;

  @Field(() => Float)
  totalAmount: number;

  @Field(() => [CartItemType])
  items: CartItemType[];
}

@ObjectType()
export class OrderItemType {
  @Field(() => ID)
  id: string;

  @Field()
  foodItemId: string;

  @Field(() => FoodItemType)
  foodItem: FoodItemType;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  subtotal: number;
}

@ObjectType()
export class QueueTokenType {
  @Field(() => ID)
  id: string;

  @Field()
  tokenNumber: string;

  @Field()
  orderId: string;

  @Field(() => Int)
  position: number;

  @Field()
  status: string;

  @Field(() => Int)
  estimatedWaitTime: number;

  @Field()
  issuedAt: Date;

  @Field({ nullable: true })
  completedAt?: Date;
}

@ObjectType()
export class OrderType {
  @Field(() => ID)
  id: string;

  @Field()
  orderNumber: string;

  @Field()
  studentId: string;

  @Field(() => StudentType, { nullable: true })
  student?: StudentType;

  @Field({ nullable: true })
  tokenNumber?: string;

  @Field(() => OrderStatus)
  status: OrderStatus;

  @Field(() => PaymentStatus)
  paymentStatus: PaymentStatus;

  @Field()
  paymentMethod: string;

  @Field(() => Float)
  subtotal: number;

  @Field(() => Float)
  tax: number;

  @Field(() => Float)
  totalAmount: number;

  @Field(() => Int, { nullable: true })
  queuePosition?: number;

  @Field(() => Int, { nullable: true })
  estimatedWaitingTime?: number;

  @Field(() => Int, { nullable: true })
  estimatedPreparationTime?: number;

  @Field({ nullable: true })
  qrVerificationCode?: string;

  @Field()
  createdAt: Date;

  @Field({ nullable: true })
  acceptedAt?: Date;

  @Field({ nullable: true })
  preparingAt?: Date;

  @Field({ nullable: true })
  readyAt?: Date;

  @Field({ nullable: true })
  completedAt?: Date;

  @Field(() => [OrderItemType])
  items: OrderItemType[];

  @Field(() => QueueTokenType, { nullable: true })
  token?: QueueTokenType;
}

@ObjectType()
export class NotificationType {
  @Field(() => ID)
  id: string;

  @Field()
  userId: string;

  @Field()
  title: string;

  @Field()
  message: string;

  @Field()
  type: string;

  @Field()
  isRead: boolean;

  @Field()
  createdAt: Date;
}

@ObjectType()
export class CrowdDensityType {
  @Field(() => Float)
  percentage: number;

  @Field()
  status: string; // LOW, MODERATE, HIGH

  @Field(() => Int)
  activeOrders: number;

  @Field(() => Int)
  estimatedWaitMinutes: number;

  @Field(() => Int)
  queueLength: number;

  @Field(() => Int)
  canteenCapacity: number;
}

@ObjectType()
export class QueueStatusType {
  @Field(() => Int)
  queuePosition: number;

  @Field(() => Int)
  ordersAhead: number;

  @Field(() => Int)
  estimatedWaitMinutes: number;

  @Field(() => CrowdDensityType)
  crowdDensity: CrowdDensityType;

  @Field({ nullable: true })
  tokenNumber?: string;

  @Field(() => OrderStatus, { nullable: true })
  orderStatus?: OrderStatus;
}

@ObjectType()
export class HourlyMetricType {
  @Field()
  hour: string;

  @Field(() => Int)
  orders: number;

  @Field(() => Float)
  revenue: number;
}

@ObjectType()
export class PopularFoodType {
  @Field()
  name: string;

  @Field(() => Int)
  count: number;

  @Field(() => Float)
  revenue: number;
}

@ObjectType()
export class AnalyticsType {
  @Field(() => Int)
  totalOrders: number;

  @Field(() => Float)
  totalRevenue: number;

  @Field(() => Float)
  averageWaitingTime: number;

  @Field(() => Float)
  averagePreparationTime: number;

  @Field(() => Float)
  currentCrowdPercentage: number;

  @Field()
  peakHour: string;

  @Field(() => Float)
  completionRate: number;

  @Field(() => Float)
  cancellationRate: number;

  @Field(() => [HourlyMetricType])
  hourlyOrders: HourlyMetricType[];

  @Field(() => [PopularFoodType])
  popularFoods: PopularFoodType[];
}

@ObjectType()
export class PredictionType {
  @Field()
  predictedPeakPeriod: string;

  @Field(() => Int)
  expectedOrders: number;

  @Field(() => Float)
  expectedCrowdPercentage: number;

  @Field(() => Int)
  expectedWaitMinutes: number;

  @Field(() => [HourlyMetricType])
  forecastNextHours: HourlyMetricType[];

  @Field(() => [String])
  highDemandItems: string[];
}

@ObjectType()
export class ReportSummaryType {
  @Field()
  generatedAt: Date;

  @Field(() => Int)
  totalOrdersToday: number;

  @Field(() => Float)
  totalRevenueToday: number;

  @Field(() => Float)
  averageWaitTimeToday: number;

  @Field(() => Int)
  activeQueueLength: number;

  @Field()
  systemHealth: string;
}

@ObjectType()
export class PaymentPayloadType {
  @Field()
  orderId: string;

  @Field(() => Float)
  amount: number;

  @Field()
  currency: string;

  @Field()
  transactionId: string;

  @Field()
  provider: string;

  @Field()
  razorpayKeyId: string;

  @Field()
  paymentMethod: string;
}

@ObjectType()
export class PaymentVerificationType {
  @Field()
  id: string;

  @Field()
  orderId: string;

  @Field()
  transactionId: string;

  @Field()
  provider: string;

  @Field(() => Float)
  amount: number;

  @Field()
  currency: string;

  @Field(() => PaymentStatus)
  status: PaymentStatus;
}


@ObjectType()
export class AuthPayloadType {
  @Field()
  accessToken: string;

  @Field(() => UserType)
  user: UserType;
}

@InputType()
export class FoodItemInput {
  @Field()
  name: string;

  @Field()
  description: string;

  @Field(() => Float)
  price: number;

  @Field({ nullable: true })
  image?: string;

  @Field()
  categoryId: string;

  @Field(() => Int, { defaultValue: 10 })
  preparationTime: number;

  @Field(() => Int, { defaultValue: 50 })
  stockQuantity: number;

  @Field(() => Boolean, { defaultValue: true })
  isAvailable: boolean;

  @Field(() => Boolean, { defaultValue: true })
  isVeg: boolean;
}
