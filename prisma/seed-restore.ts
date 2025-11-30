import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface StudentRow {
  id: string;
  class_id: string;
  student_id: string;
  name: string;
  email: string;
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  // 1. Tạo tài khoản giảng viên
  console.log('1️⃣ Creating lecturer account...');
  const lecturerPassword = await bcrypt.hash('lecturer123', 10);
  
  const lecturer = await prisma.user.create({
    data: {
      email: 'lecturer@uni.edu',
      passwordHash: lecturerPassword,
      displayName: 'Giảng viên PTIT',
      role: 'lecturer',
    },
  });
  console.log(`✅ Lecturer created: ${lecturer.email}\n`);

  // 2. Tạo 3 lớp học
  console.log('2️⃣ Creating 3 classes...');
  const class1 = await prisma.class.create({
    data: {
      lecturerId: lecturer.uid,
      name: 'Lớp D23DCCN - Nhóm 1',
      code: 'D23DCCN-01',
      description: 'Lớp học nhóm 1 khóa D23',
    },
  });
  console.log(`✅ Class 1 created: ${class1.name}`);

  const class2 = await prisma.class.create({
    data: {
      lecturerId: lecturer.uid,
      name: 'Lớp D23DCCN - Nhóm 2',
      code: 'D23DCCN-02',
      description: 'Lớp học nhóm 2 khóa D23',
    },
  });
  console.log(`✅ Class 2 created: ${class2.name}`);

  const class3 = await prisma.class.create({
    data: {
      lecturerId: lecturer.uid,
      name: 'Lớp D23DCCN - Nhóm 3',
      code: 'D23DCCN-03',
      description: 'Lớp học nhóm 3 khóa D23',
    },
  });
  console.log(`✅ Class 3 created: ${class3.name}\n`);

  // Map old class_id to new class_id
  const classMapping: Record<string, string> = {
    'f1d2b172-f72d-4c43-81af-58c6916c0c93': class1.id,
    'cf87cdc6-697e-453f-8f32-9c701c52ebdc': class2.id,
    'ebacacc9-f463-4fc9-8538-2f6a02bd6a10': class3.id,
  };

  // 3. Đọc file CSV và tạo sinh viên
  console.log('3️⃣ Reading CSV and creating students...');
  const csvPath = path.join(__dirname, '..', 'students_rows (1).csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.trim().split('\n');
  
  // Skip header
  const studentRows: StudentRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(',');
    if (parts.length >= 5) {
      studentRows.push({
        id: parts[0],
        class_id: parts[1],
        student_id: parts[2],
        name: parts[3],
        email: parts[4],
      });
    }
  }

  console.log(`📋 Found ${studentRows.length} students in CSV\n`);

  // Hash password cho student
  const studentPassword = await bcrypt.hash('password123', 10);
  
  let createdCount = 0;
  const uniqueEmails = new Set<string>();

  for (const row of studentRows) {
    // Skip nếu email trùng
    if (uniqueEmails.has(row.email)) {
      console.log(`⏭️ Skipping duplicate email: ${row.email}`);
      continue;
    }
    uniqueEmails.add(row.email);

    const newClassId = classMapping[row.class_id];
    if (!newClassId) {
      console.log(`⚠️ Unknown class_id: ${row.class_id} for student ${row.student_id}`);
      continue;
    }

    try {
      // Tạo user account cho sinh viên
      const studentUser = await prisma.user.create({
        data: {
          email: row.email,
          passwordHash: studentPassword,
          displayName: row.name,
          role: 'student',
        },
      });

      // Tạo student record trong class
      await prisma.student.create({
        data: {
          classId: newClassId,
          studentId: row.student_id,
          name: row.name,
          email: row.email,
        },
      });

      createdCount++;
      if (createdCount % 20 === 0) {
        console.log(`📝 Created ${createdCount} students...`);
      }
    } catch (error: any) {
      console.log(`❌ Error creating student ${row.student_id}: ${error.message}`);
    }
  }

  console.log(`\n✅ Created ${createdCount} student accounts and records`);

  // 4. Tạo IP config mặc định
  console.log('\n4️⃣ Creating default IP config...');
  await prisma.iPConfig.create({
    data: {
      enabled: true,
      errorMessage: 'Bạn chỉ có thể điểm danh khi sử dụng wifi của trường',
    },
  });

  // Thêm IP mặc định
  await prisma.allowedIP.createMany({
    data: [
      { ipAddress: '113.190.142.206', type: 'SINGLE', description: 'IP trường - 1', isActive: true },
      { ipAddress: '222.252.29.85', type: 'SINGLE', description: 'IP trường - 2', isActive: true },
    ],
  });
  console.log('✅ IP config created\n');

  // Summary
  console.log('🎉 Seed completed!');
  console.log('=====================================');
  console.log(`👨‍🏫 Lecturer: lecturer@uni.edu / lecturer123`);
  console.log(`📚 Classes: 3`);
  console.log(`👨‍🎓 Students: ${createdCount}`);
  console.log(`🔐 Student password: password123`);
  console.log('=====================================');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
