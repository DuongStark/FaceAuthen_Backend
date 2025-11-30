import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed IP config với các IP mặc định
 */
async function seedIPConfig() {
  console.log('🌱 Seeding IP configuration...');

  // Tạo config mặc định
  const existingConfig = await prisma.iPConfig.findFirst();
  if (!existingConfig) {
    await prisma.iPConfig.create({
      data: {
        enabled: true,
        errorMessage: 'Bạn chỉ có thể điểm danh khi sử dụng wifi của trường',
      },
    });
    console.log('✅ Created default IP config');
  } else {
    console.log('⏭️ IP config already exists, skipping...');
  }

  // Danh sách IP mặc định từ config cũ
  const defaultIPs = [
    {
      ipAddress: '113.190.142.206',
      type: 'SINGLE' as const,
      description: 'IP trường - 1',
      isActive: true,
    },
    {
      ipAddress: '222.252.29.85',
      type: 'SINGLE' as const,
      description: 'IP trường - 2',
      isActive: true,
    },
  ];

  for (const ip of defaultIPs) {
    const existing = await prisma.allowedIP.findUnique({
      where: { ipAddress: ip.ipAddress },
    });

    if (!existing) {
      await prisma.allowedIP.create({
        data: ip,
      });
      console.log(`✅ Added IP: ${ip.ipAddress}`);
    } else {
      console.log(`⏭️ IP ${ip.ipAddress} already exists, skipping...`);
    }
  }

  console.log('🎉 IP configuration seeding completed!');
}

seedIPConfig()
  .catch((e) => {
    console.error('Error seeding IP config:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
