import { PrismaClient, Role, OrderStatus, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.queueToken.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.foodItem.deleteMany();
  await prisma.category.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.canteen.deleteMany();
  await prisma.queueSnapshot.deleteMany();

  const passwordHash = await bcrypt.hash('Password@123', 10);

  // 1. Create Canteen
  const canteen = await prisma.canteen.create({
    data: {
      name: 'Campus Central Canteen',
      location: 'Block A, Ground Floor',
      openingTime: '08:00',
      closingTime: '20:00',
      maxCapacity: 60,
      status: 'OPEN',
    },
  });

  // 2. Create Users & Profiles
  // Admin
  const adminUser = await prisma.user.create({
    data: {
      name: 'Vikram Sharma (Admin)',
      email: 'admin@canteenq.local',
      phone: '+91 9876543210',
      passwordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  // College Admin
  const collegeAdminUser = await prisma.user.create({
    data: {
      name: 'Dr. Ramesh Nair (Dean / College Admin)',
      email: 'collegeadmin@canteenq.local',
      phone: '+91 9876543211',
      passwordHash,
      role: Role.COLLEGE_ADMIN,
      isActive: true,
    },
  });

  // Staff Members
  const staffMembers = [
    { name: 'Rajesh Kumar (Head Chef)', email: 'staff@canteenq.local', empId: 'EMP-001', role: 'Head Chef & Counter Lead', shift: 'Morning' },
    { name: 'Sanjay Kapoor (Chef)', email: 'chef@canteenq.local', empId: 'EMP-006', role: 'Head Chef', shift: 'Morning' },
    { name: 'Anil Verma', email: 'anil.staff@canteenq.local', empId: 'EMP-002', role: 'Preparation Station 1', shift: 'Morning' },
    { name: 'Sunita Menon', email: 'sunita.staff@canteenq.local', empId: 'EMP-003', role: 'Beverages & Snacks Bar', shift: 'General' },
    { name: 'Karthik Rao', email: 'karthik.staff@canteenq.local', empId: 'EMP-004', role: 'Meals Station Lead', shift: 'Afternoon' },
    { name: 'Meenakshi Iyer', email: 'meenakshi.staff@canteenq.local', empId: 'EMP-005', role: 'Order Pickup Coordinator', shift: 'Evening' },
  ];

  const createdStaff = [];
  for (const s of staffMembers) {
    const user = await prisma.user.create({
      data: {
        name: s.name,
        email: s.email,
        phone: '+91 98112233' + Math.floor(10 + Math.random() * 89),
        passwordHash,
        role: Role.STAFF,
        isActive: true,
        staff: {
          create: {
            employeeId: s.empId,
            designation: s.role,
            shift: s.shift,
          },
        },
      },
      include: { staff: true },
    });
    createdStaff.push(user);
  }

  // Demo Student
  const primaryStudentUser = await prisma.user.create({
    data: {
      name: 'Aditya Krishnan',
      email: 'student@canteenq.local',
      phone: '+91 9898989801',
      passwordHash,
      role: Role.STUDENT,
      isActive: true,
      student: {
        create: {
          studentId: 'STU-2024-001',
          department: 'Computer Science',
          semester: 6,
          className: 'CS-B',
          cart: {
            create: { totalAmount: 0 },
          },
        },
      },
    },
    include: { student: true },
  });

  // 20 Additional Students
  const departments = ['Computer Science', 'Information Tech', 'Electronics', 'Mechanical', 'Civil', 'Biotech'];
  const studentNames = [
    'Priya Sharma', 'Rohan Gupta', 'Sneha Patel', 'Arjun Reddy', 'Divya Nair',
    'Manish Choudhary', 'Ananya Roy', 'Varun Rao', 'Pooja Bhatt', 'Karan Johar',
    'Neha Deshmukh', 'Tarun Mittal', 'Ritu Aggarwal', 'Siddharth Sen', 'Kavita Joshi',
    'Akash Singh', 'Simran Kaur', 'Deepak Verma', 'Swati Mishra', 'Naveen Kumar'
  ];

  const createdStudents = [primaryStudentUser.student!];
  for (let i = 0; i < studentNames.length; i++) {
    const stuNum = (i + 2).toString().padStart(3, '0');
    const u = await prisma.user.create({
      data: {
        name: studentNames[i],
        email: `student${i + 2}@canteenq.local`,
        phone: `+91 9700000${stuNum}`,
        passwordHash,
        role: Role.STUDENT,
        isActive: true,
        student: {
          create: {
            studentId: `STU-2024-${stuNum}`,
            department: departments[i % departments.length],
            semester: (i % 8) + 1,
            className: `SEC-${String.fromCharCode(65 + (i % 4))}`,
            cart: {
              create: { totalAmount: 0 },
            },
          },
        },
      },
      include: { student: true },
    });
    if (u.student) createdStudents.push(u.student);
  }

  // 3. Create Categories
  const categoriesData = [
    { name: 'Meals', description: 'Wholesome, filling lunch and dinner plates' },
    { name: 'Breakfast', description: 'Fresh morning south & north Indian delicacies' },
    { name: 'Snacks', description: 'Crispy, tasty bite-sized evening snacks' },
    { name: 'Beverages', description: 'Hot teas, fresh filter coffee, coolers and fresh juices' },
    { name: 'Fast Food', description: 'Burgers, sandwiches, rolls and noodles cooked to order' },
    { name: 'Desserts', description: 'Sweet treats, pastries and refreshing sundaes' },
  ];

  const categoryMap: { [key: string]: string } = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categoryMap[cat.name] = created.id;
  }

  // 4. Create 30+ Food Items with realistic images & INR prices
  const foodItemsData = [
    // Meals
    {
      name: 'Chicken Biryani',
      description: 'Aromatic basmati rice cooked with tender marinated chicken, saffron and authentic spices. Served with raita.',
      price: 150,
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop',
      category: 'Meals',
      preparationTime: 8,
      stockQuantity: 45,
      isAvailable: true,
      isVeg: false,
      rating: 4.8,
    },
    {
      name: 'Veg Kerala Thali Meals',
      description: 'Traditional multi-course vegetarian feast with sambar, rasam, avial, thoran, curd and papad.',
      price: 90,
      image: 'https://images.unsplash.com/photo-1610057099443-fde8c4d50f91?w=600&auto=format&fit=crop',
      category: 'Meals',
      preparationTime: 5,
      stockQuantity: 60,
      isAvailable: true,
      isVeg: true,
      rating: 4.6,
    },
    {
      name: 'Paneer Butter Masala Combo',
      description: 'Rich cottage cheese cubes in silky tomato-cashew gravy with 2 butter naans or steamed rice.',
      price: 130,
      image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&auto=format&fit=crop',
      category: 'Meals',
      preparationTime: 10,
      stockQuantity: 30,
      isAvailable: true,
      isVeg: true,
      rating: 4.7,
    },
    {
      name: 'Malabar Porotta with Chicken Curry',
      description: 'Two flaky, layered Malabar parottas served with spicy, coconut-infused chicken curry.',
      price: 120,
      image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop',
      category: 'Meals',
      preparationTime: 7,
      stockQuantity: 35,
      isAvailable: true,
      isVeg: false,
      rating: 4.9,
    },
    {
      name: 'Chicken Fried Rice with Chilli Chicken',
      description: 'Wok-tossed basmati rice with eggs, shredded chicken, accompanied by Indo-Chinese spicy chilli chicken gravy.',
      price: 160,
      image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop',
      category: 'Meals',
      preparationTime: 12,
      stockQuantity: 25,
      isAvailable: true,
      isVeg: false,
      rating: 4.5,
    },
    {
      name: 'Egg Biryani Special',
      description: 'Fragrant spiced biryani rice layered with fried spiced eggs and caramelized onions.',
      price: 110,
      image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop',
      category: 'Meals',
      preparationTime: 6,
      stockQuantity: 40,
      isAvailable: true,
      isVeg: false,
      rating: 4.4,
    },

    // Breakfast
    {
      name: 'Masala Dosa with Sambar & Chutney',
      description: 'Crispy fermented crepe stuffed with savory mashed potato masala, served with piping hot sambar and coconut chutney.',
      price: 60,
      image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop',
      category: 'Breakfast',
      preparationTime: 6,
      stockQuantity: 50,
      isAvailable: true,
      isVeg: true,
      rating: 4.9,
    },
    {
      name: 'Idli Vada Combo',
      description: '2 fluffy steamed rice cakes and 1 golden medu vada with spicy coconut chutney and sambar.',
      price: 50,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop',
      category: 'Breakfast',
      preparationTime: 3,
      stockQuantity: 70,
      isAvailable: true,
      isVeg: true,
      rating: 4.7,
    },
    {
      name: 'Puri Masala (3 Pcs)',
      description: 'Golden puffed whole-wheat puris served with mildly spiced potato bhaji.',
      price: 55,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop',
      category: 'Breakfast',
      preparationTime: 5,
      stockQuantity: 40,
      isAvailable: true,
      isVeg: true,
      rating: 4.5,
    },
    {
      name: 'Ghee Roast Dosa',
      description: 'Paper-thin dosa roasted in pure desi ghee to golden perfection.',
      price: 75,
      image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=600&auto=format&fit=crop',
      category: 'Breakfast',
      preparationTime: 5,
      stockQuantity: 35,
      isAvailable: true,
      isVeg: true,
      rating: 4.8,
    },
    {
      name: 'Upma with Chutney',
      description: 'Savory roasted semolina tempered with mustard seeds, curry leaves, ginger, and crunchy cashews.',
      price: 40,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop',
      category: 'Breakfast',
      preparationTime: 3,
      stockQuantity: 25,
      isAvailable: true,
      isVeg: true,
      rating: 4.2,
    },

    // Snacks
    {
      name: 'Vegetable Samosa (2 Pcs)',
      description: 'Crispy pyramid pastries stuffed with spiced potatoes, green peas and cumin seeds with mint chutney.',
      price: 30,
      image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop',
      category: 'Snacks',
      preparationTime: 2,
      stockQuantity: 80,
      isAvailable: true,
      isVeg: true,
      rating: 4.7,
    },
    {
      name: 'Chicken Egg Puff',
      description: 'Flaky baked puff pastry stuffed with spicy shredded chicken and boiled egg masala.',
      price: 35,
      image: 'https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop',
      category: 'Snacks',
      preparationTime: 2,
      stockQuantity: 40,
      isAvailable: true,
      isVeg: false,
      rating: 4.6,
    },
    {
      name: 'Parippu Vada (Dal Vada 2 Pcs)',
      description: 'Crunchy Bengal gram lentil patties spiced with chopped onions, green chillies and curry leaves.',
      price: 25,
      image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=600&auto=format&fit=crop',
      category: 'Snacks',
      preparationTime: 2,
      stockQuantity: 50,
      isAvailable: true,
      isVeg: true,
      rating: 4.5,
    },
    {
      name: 'Paneer Cutlet (2 Pcs)',
      description: 'Crispy breaded patties loaded with mashed paneer, herbs and spices.',
      price: 45,
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop',
      category: 'Snacks',
      preparationTime: 4,
      stockQuantity: 20,
      isAvailable: true,
      isVeg: true,
      rating: 4.3,
    },
    {
      name: 'French Fries (Peri-Peri)',
      description: 'Golden salted French fries dusted with fiery peri-peri seasoning and mayonnaise dip.',
      price: 70,
      image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=600&auto=format&fit=crop',
      category: 'Snacks',
      preparationTime: 6,
      stockQuantity: 35,
      isAvailable: true,
      isVeg: true,
      rating: 4.7,
    },

    // Beverages
    {
      name: 'South Indian Filter Coffee',
      description: 'Traditional decoction brewed with fresh dairy milk and chicory blend, served in a dabarah.',
      price: 20,
      image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop',
      category: 'Beverages',
      preparationTime: 2,
      stockQuantity: 100,
      isAvailable: true,
      isVeg: true,
      rating: 4.9,
    },
    {
      name: 'Masala Chai',
      description: 'Strong milk tea simmered with freshly crushed cardamom, ginger, and cloves.',
      price: 15,
      image: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?w=600&auto=format&fit=crop',
      category: 'Beverages',
      preparationTime: 2,
      stockQuantity: 120,
      isAvailable: true,
      isVeg: true,
      rating: 4.8,
    },
    {
      name: 'Fresh Lime Soda (Sweet & Salt)',
      description: 'Invigorating freshly squeezed lime juice mixed with sparkling soda and rock salt.',
      price: 35,
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop',
      category: 'Beverages',
      preparationTime: 2,
      stockQuantity: 60,
      isAvailable: true,
      isVeg: true,
      rating: 4.6,
    },
    {
      name: 'Cold Coffee with Ice Cream',
      description: 'Thick blended creamy espresso milkshake topped with a rich vanilla ice cream scoop.',
      price: 75,
      image: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=600&auto=format&fit=crop',
      category: 'Beverages',
      preparationTime: 3,
      stockQuantity: 40,
      isAvailable: true,
      isVeg: true,
      rating: 4.8,
    },
    {
      name: 'Mango Lassi',
      description: 'Smooth and thick sweet yogurt beverage infused with Alphonso mango pulp and cardamom.',
      price: 55,
      image: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=600&auto=format&fit=crop',
      category: 'Beverages',
      preparationTime: 3,
      stockQuantity: 30,
      isAvailable: true,
      isVeg: true,
      rating: 4.7,
    },
    {
      name: 'Green Apple Mojito',
      description: 'Muddled fresh mint sprigs, lime wedges, and crisp green apple syrup over crushed ice.',
      price: 65,
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop',
      category: 'Beverages',
      preparationTime: 3,
      stockQuantity: 25,
      isAvailable: true,
      isVeg: true,
      rating: 4.5,
    },

    // Fast Food
    {
      name: 'Crispy Chicken Zinger Burger',
      description: 'Crispy fried chicken breast fillet with iceberg lettuce, spicy mayo in a toasted sesame bun.',
      price: 110,
      image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop',
      category: 'Fast Food',
      preparationTime: 8,
      stockQuantity: 35,
      isAvailable: true,
      isVeg: false,
      rating: 4.7,
    },
    {
      name: 'Classic Veg Club Sandwich',
      description: 'Triple-layered grilled sandwich with cheese, tomatoes, cucumbers, capsicum and mint chutney.',
      price: 80,
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop',
      category: 'Fast Food',
      preparationTime: 7,
      stockQuantity: 30,
      isAvailable: true,
      isVeg: true,
      rating: 4.4,
    },
    {
      name: 'Veg Hakka Noodles',
      description: 'Wok tossed noodles with crunchy julienned bell peppers, shredded cabbage, carrots and spring onions.',
      price: 95,
      image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop',
      category: 'Fast Food',
      preparationTime: 8,
      stockQuantity: 40,
      isAvailable: true,
      isVeg: true,
      rating: 4.5,
    },
    {
      name: 'Chicken Shawarma Roll',
      description: 'Marinated rotisserie chicken slivers wrapped in rumali roti with garlic toum and pickled vegetables.',
      price: 100,
      image: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=600&auto=format&fit=crop',
      category: 'Fast Food',
      preparationTime: 5,
      stockQuantity: 45,
      isAvailable: true,
      isVeg: false,
      rating: 4.9,
    },
    {
      name: 'Cheese Corn Grilled Sandwich',
      description: 'Sweet corn kernels, gooey melted mozzarella cheese, and Italian herbs between butter-toasted bread.',
      price: 90,
      image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=600&auto=format&fit=crop',
      category: 'Fast Food',
      preparationTime: 6,
      stockQuantity: 25,
      isAvailable: true,
      isVeg: true,
      rating: 4.6,
    },

    // Desserts
    {
      name: 'Gulab Jamun with Ice Cream (2 Pcs)',
      description: 'Warm, soft milk-solid dumplings soaked in rose-cardamom syrup alongside cold vanilla bean ice cream.',
      price: 60,
      image: 'https://images.unsplash.com/photo-1593798677682-e3e9d8f36c5b?w=600&auto=format&fit=crop',
      category: 'Desserts',
      preparationTime: 2,
      stockQuantity: 40,
      isAvailable: true,
      isVeg: true,
      rating: 4.8,
    },
    {
      name: 'Triple Chocolate Brownie',
      description: 'Dense fudge brownie loaded with chocolate chunks, served warm with rich chocolate fudge sauce.',
      price: 85,
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop',
      category: 'Desserts',
      preparationTime: 3,
      stockQuantity: 20,
      isAvailable: true,
      isVeg: true,
      rating: 4.9,
    },
    {
      name: 'Fruit Salad Sundae',
      description: 'Seasonal cut fresh fruits topped with strawberry and mango gelato, roasted cashew nuts and honey drizzle.',
      price: 90,
      image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=600&auto=format&fit=crop',
      category: 'Desserts',
      preparationTime: 4,
      stockQuantity: 15,
      isAvailable: true,
      isVeg: true,
      rating: 4.7,
    },
  ];

  const createdFoodItems = [];
  for (const item of foodItemsData) {
    const created = await prisma.foodItem.create({
      data: {
        name: item.name,
        description: item.description,
        price: item.price,
        image: item.image,
        categoryId: categoryMap[item.category],
        preparationTime: item.preparationTime,
        stockQuantity: item.stockQuantity,
        isAvailable: item.isAvailable,
        isVeg: item.isVeg,
        rating: item.rating,
      },
    });
    createdFoodItems.push(created);
  }

  // 5. Create Historical and Active Orders for queue and analytics
  // Let's create realistic orders
  const statuses = [
    OrderStatus.COMPLETED,
    OrderStatus.COMPLETED,
    OrderStatus.COMPLETED,
    OrderStatus.COMPLETED,
    OrderStatus.COMPLETED,
    OrderStatus.READY,
    OrderStatus.PREPARING,
    OrderStatus.PREPARING,
    OrderStatus.ACCEPTED,
    OrderStatus.ACCEPTED,
    OrderStatus.PLACED,
  ];

  let tokenCounter = 100;
  for (let i = 0; i < 18; i++) {
    tokenCounter++;
    const tokenStr = `CQ-${tokenCounter}`;
    const student = createdStudents[i % createdStudents.length];
    const status = i < 7 ? OrderStatus.COMPLETED : (i < 10 ? OrderStatus.READY : (i < 14 ? OrderStatus.PREPARING : OrderStatus.ACCEPTED));
    const food1 = createdFoodItems[i % createdFoodItems.length];
    const food2 = createdFoodItems[(i + 3) % createdFoodItems.length];
    
    const qty1 = 1 + (i % 2);
    const qty2 = 1;
    const subtotal = (food1.price * qty1) + (food2.price * qty2);
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const totalAmount = subtotal + tax;

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${i.toString().padStart(3, '0')}`;
    const queuePos = status === OrderStatus.COMPLETED ? null : (i - 6);
    const estWait = status === OrderStatus.COMPLETED ? 0 : Math.max(4, (queuePos || 1) * 3);

    const order = await prisma.order.create({
      data: {
        orderNumber,
        studentId: student.id,
        tokenNumber: tokenStr,
        status,
        paymentStatus: PaymentStatus.SUCCESS,
        paymentMethod: i % 2 === 0 ? 'UPI' : 'CARD',
        subtotal,
        tax,
        totalAmount,
        queuePosition: queuePos,
        estimatedWaitingTime: estWait,
        estimatedPreparationTime: Math.max(food1.preparationTime, food2.preparationTime),
        qrVerificationCode: `CQ-VERIFY-${tokenStr}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        createdAt: new Date(Date.now() - (18 - i) * 15 * 60 * 1000),
        acceptedAt: new Date(Date.now() - (18 - i) * 12 * 60 * 1000),
        preparingAt: status !== OrderStatus.ACCEPTED ? new Date(Date.now() - (18 - i) * 8 * 60 * 1000) : null,
        readyAt: status === OrderStatus.READY || status === OrderStatus.COMPLETED ? new Date(Date.now() - (18 - i) * 3 * 60 * 1000) : null,
        completedAt: status === OrderStatus.COMPLETED ? new Date() : null,
        items: {
          create: [
            {
              foodItemId: food1.id,
              quantity: qty1,
              unitPrice: food1.price,
              subtotal: food1.price * qty1,
            },
            {
              foodItemId: food2.id,
              quantity: qty2,
              unitPrice: food2.price,
              subtotal: food2.price * qty2,
            },
          ],
        },
        token: {
          create: {
            tokenNumber: tokenStr,
            position: queuePos || 0,
            status: status === OrderStatus.COMPLETED ? 'COMPLETED' : (status === OrderStatus.READY ? 'SERVING' : 'ACTIVE'),
            estimatedWaitTime: estWait,
            completedAt: status === OrderStatus.COMPLETED ? new Date() : null,
          },
        },
        payment: {
          create: {
            transactionId: `TXN-${Date.now()}-${tokenCounter}`,
            provider: 'TEST_MODE',
            amount: totalAmount,
            status: PaymentStatus.SUCCESS,
            paidAt: new Date(Date.now() - (18 - i) * 14 * 60 * 1000),
          },
        },
      },
    });

    // Add a notification for the student
    if (i === 12) {
      await prisma.notification.create({
        data: {
          userId: primaryStudentUser.id,
          title: `Order ${tokenStr} is being prepared!`,
          message: `Your food is on station 1. Estimated wait is ~${estWait} minutes.`,
          type: 'ORDER_STATUS',
          isRead: false,
        },
      });
    }
  }

  // 6. Seed Queue Snapshots for realistic crowd density history & charts
  const now = new Date();
  for (let h = 8; h >= 0; h--) {
    const timestamp = new Date(now.getTime() - h * 3600 * 1000);
    // Simulate natural campus lunch rush around 12:00-14:00
    const hour = timestamp.getHours();
    let crowdPct = 25;
    let activeOrds = 4;
    if (hour >= 12 && hour <= 14) {
      crowdPct = 78 + (h % 10);
      activeOrds = 22 + (h % 5);
    } else if (hour >= 16 && hour <= 18) {
      crowdPct = 55 + (h % 8);
      activeOrds = 14 + (h % 4);
    } else {
      crowdPct = 30 + (h % 10);
      activeOrds = 8 + (h % 3);
    }

    await prisma.queueSnapshot.create({
      data: {
        timestamp,
        queueLength: activeOrds,
        activeOrders: activeOrds,
        averageWaitingTime: Math.round(activeOrds * 1.5),
        crowdPercentage: crowdPct,
      },
    });
  }

  console.log('Database seeded successfully!');
  console.log('Demo Credentials:');
  console.log(' - Student: student@canteenq.local / Password@123');
  console.log(' - Staff: staff@canteenq.local / Password@123');
  console.log(' - Admin: admin@canteenq.local / Password@123');
  console.log(' - College Admin: collegeadmin@canteenq.local / Password@123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
