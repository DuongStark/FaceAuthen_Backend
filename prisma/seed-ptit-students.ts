import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const students = [
  { studentId: 'B23DCCN001', name: 'Nguyễn Văn An', email: 'annv.B23dccn001@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN002', name: 'Trần Thị Bình', email: 'binhtt.B23dccn002@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN003', name: 'Lê Hoàng Cường', email: 'cuonglh.B23dccn003@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN004', name: 'Phạm Minh Đức', email: 'ducpm.B23dccn004@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN005', name: 'Hoàng Thu Hà', email: 'haht.B23dccn005@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN006', name: 'Vũ Đình Hùng', email: 'hungvd.B23dccn006@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN007', name: 'Đặng Thị Hương', email: 'huongdt.B23dccn007@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN008', name: 'Bùi Văn Khoa', email: 'khoabv.B23dccn008@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN009', name: 'Ngô Thị Lan', email: 'lantt.B23dccn009@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN010', name: 'Trịnh Văn Long', email: 'longtv.B23dccn010@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN011', name: 'Đinh Thị Mai', email: 'maidt.B23dccn011@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN012', name: 'Phan Văn Nam', email: 'nampv.B23dccn012@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN013', name: 'Dương Thị Ngọc', email: 'ngocdt.B23dccn013@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN014', name: 'Võ Minh Phát', email: 'phatvm.B23dccn014@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN015', name: 'Lý Thị Quỳnh', email: 'quynhlt.B23dccn015@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN016', name: 'Cao Văn Sơn', email: 'soncv.B23dccn016@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN017', name: 'Mai Thị Thanh', email: 'thanhmt.B23dccn017@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN018', name: 'Hồ Văn Tuấn', email: 'tuanhv.B23dccn018@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN019', name: 'Chu Thị Uyên', email: 'uyenct.B23dccn019@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN020', name: 'Tô Văn Vinh', email: 'vinhtv.B23dccn020@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN021', name: 'Trương Thị Xuân', email: 'xuantt.B23dccn021@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN022', name: 'Lâm Văn Yên', email: 'yenlv.B23dccn022@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN023', name: 'Nguyễn Thị Ánh', email: 'anhnt.B23dccn023@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN024', name: 'Trần Văn Bảo', email: 'baotv.B23dccn024@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN025', name: 'Lê Thị Chi', email: 'chilet.B23dccn025@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN026', name: 'Phạm Văn Dũng', email: 'dungpv.B23dccn026@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN027', name: 'Hoàng Thị Nga', email: 'nganht.B23dccn027@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN028', name: 'Vũ Văn Hải', email: 'haivv.B23dccn028@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN029', name: 'Đặng Thị Kim', email: 'kimdt.B23dccn029@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN030', name: 'Bùi Văn Linh', email: 'linhbv.B23dccn030@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN031', name: 'Ngô Thị My', email: 'myntt.B23dccn031@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN032', name: 'Trịnh Văn Nghĩa', email: 'nghiatv.B23dccn032@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN033', name: 'Đinh Thị Oanh', email: 'oanhdt.B23dccn033@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN034', name: 'Phan Văn Phong', email: 'phongpv.B23dccn034@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN035', name: 'Dương Thị Quỳnh', email: 'quynhdt.B23dccn035@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN036', name: 'Võ Văn Tài', email: 'taivv.B23dccn036@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN037', name: 'Lý Thị Thu', email: 'thult.B23dccn037@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN038', name: 'Cao Văn Trung', email: 'trungcv.B23dccn038@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN039', name: 'Mai Thị Vân', email: 'vanmt.B23dccn039@stu.ptit.edu.vn' },
  { studentId: 'B23DCCN040', name: 'Hồ Văn Đạt', email: 'dathv.B23dccn040@stu.ptit.edu.vn' },
];

async function seedPTITStudents() {
  console.log('🌱 Seeding PTIT students...');

  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, 10);

  let createdCount = 0;
  let skippedCount = 0;

  for (const student of students) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: student.email },
      });

      if (existingUser) {
        console.log(`⏭️  Skipped: ${student.email} (already exists)`);
        skippedCount++;
        continue;
      }

      // Create user account
      await prisma.user.create({
        data: {
          email: student.email,
          passwordHash,
          displayName: student.name,
          role: 'student',
        },
      });

      console.log(`✅ Created: ${student.name} (${student.email})`);
      createdCount++;
    } catch (error) {
      console.error(`❌ Error creating ${student.email}:`, error);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Created: ${createdCount} users`);
  console.log(`⏭️  Skipped: ${skippedCount} users`);
  console.log(`📧 All students have password: ${password}`);
}

seedPTITStudents()
  .catch((error) => {
    console.error('Error seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
