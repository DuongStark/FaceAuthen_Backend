import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Danh sách họ và tên tiếng Việt
const lastNames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương'];
const middleNames = ['Văn', 'Thị', 'Hữu', 'Đức', 'Minh', 'Anh', 'Tuấn', 'Quốc', 'Thanh', 'Hồng', 'Kim', 'Phương'];
const firstNames = ['An', 'Bình', 'Chi', 'Dũng', 'Hà', 'Hùng', 'Khánh', 'Linh', 'Mai', 'Nam', 'Phong', 'Quân', 'Sơn', 'Tâm', 'Tú', 'Uyên', 'Việt', 'Xuân', 'Yến', 'Đạt'];

function generateRandomName(): string {
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const middleName = middleNames[Math.floor(Math.random() * middleNames.length)];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  return `${lastName} ${middleName} ${firstName}`;
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Create lecturer account
  console.log('👨‍🏫 Creating lecturer account...');
  const lecturerPassword = 'lecturer123';
  const passwordHash = await bcrypt.hash(lecturerPassword, 10);
  
  const lecturer = await prisma.user.upsert({
    where: { email: 'lecturer@uni.edu' },
    update: {},
    create: {
      email: 'lecturer@uni.edu',
      passwordHash,
      displayName: 'Giảng Viên Nguyễn Văn A',
      role: 'lecturer',
    },
  });

  console.log('✓ Lecturer: lecturer@uni.edu / lecturer123\n');

  // Create 3 classes
  const classes = [
    { code: 'IT101', name: 'Lập Trình Cơ Bản', description: 'Môn học về lập trình căn bản' },
    { code: 'IT201', name: 'Cấu Trúc Dữ Liệu và Giải Thuật', description: 'Môn học về CTDL & GT' },
    { code: 'IT301', name: 'Lập Trình Web', description: 'Môn học về phát triển ứng dụng web' },
  ];

  console.log('📚 Creating classes...');
  const createdClasses = [];
  for (const classData of classes) {
    const newClass = await prisma.class.create({
      data: {
        lecturerId: lecturer.uid,
        name: classData.name,
        code: classData.code,
        description: classData.description,
      },
    });
    createdClasses.push(newClass);
    console.log(`✓ Class: ${classData.code} - ${classData.name}`);
  }

  console.log('\n👥 Creating students...');
  
  // Read CSV file nếu có
  let csvStudents: any[] = [];
  const csvPath = path.join(process.cwd(), 'sample_students.csv');
  if (fs.existsSync(csvPath)) {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').slice(1); // Skip header
    csvStudents = lines
      .filter(line => line.trim())
      .map(line => {
        const [studentId, name, email] = line.split(',').map(s => s.trim());
        return { studentId, name, email };
      });
    console.log(`✓ Loaded ${csvStudents.length} students from CSV`);
  }

  let totalStudentsCreated = 0;

  // Distribute CSV students across classes
  if (csvStudents.length > 0) {
    const studentPassword = await bcrypt.hash('password123', 10);
    
    for (let i = 0; i < csvStudents.length && i < 40; i++) {
      const student = csvStudents[i];
      const classIndex = Math.floor(i / 13); // Distribute evenly
      const targetClass = createdClasses[Math.min(classIndex, createdClasses.length - 1)];
      
      // Create student record
      await prisma.student.create({
        data: {
          classId: targetClass.id,
          studentId: student.studentId,
          name: student.name,
          email: student.email,
        },
      });
      
      // Create user account for CSV student
      await prisma.user.create({
        data: {
          email: student.email,
          passwordHash: studentPassword,
          displayName: student.name,
          role: 'student',
        },
      });
      
      totalStudentsCreated++;
    }
    console.log(`✓ Added ${Math.min(csvStudents.length, 40)} students from CSV`);
  }

  // Generate additional students to make 40 per class
  console.log('✓ Generating additional students...');
  let studentIdCounter = 1001;
  const studentPassword = await bcrypt.hash('password123', 10);
  
  for (const targetClass of createdClasses) {
    const existingCount = await prisma.student.count({
      where: { classId: targetClass.id },
    });
    
    const needed = 40 - existingCount;
    
    for (let i = 0; i < needed; i++) {
      const studentId = `D23DCCN${String(studentIdCounter).padStart(3, '0')}`;
      const name = generateRandomName();
      const email = `${studentId.toLowerCase()}@stu.ptit.edu.vn`;
      
      // Create student record
      await prisma.student.create({
        data: {
          classId: targetClass.id,
          studentId,
          name,
          email,
        },
      });
      
      // Create user account for student
      await prisma.user.create({
        data: {
          email,
          passwordHash: studentPassword,
          displayName: name,
          role: 'student',
        },
      });
      
      studentIdCounter++;
      totalStudentsCreated++;
    }
    
    console.log(`✓ Class ${targetClass.code}: 40 students (${needed} generated)`);
  }

  console.log(`\n✅ Total students created: ${totalStudentsCreated}`);
  console.log(`✅ Total user accounts created: ${totalStudentsCreated + 1} (including lecturer)`);
  console.log(`✅ Total classes: ${createdClasses.length}`);
  
  console.log('\n📊 Summary:');
  console.log('═══════════════════════════════════');
  console.log('👨‍🏫 Lecturer: lecturer@uni.edu / lecturer123');
  console.log(`📚 Classes: ${createdClasses.length}`);
  for (const cls of createdClasses) {
    const count = await prisma.student.count({ where: { classId: cls.id } });
    console.log(`   - ${cls.code}: ${count} students`);
  }
  console.log(`👥 Total Students: ${totalStudentsCreated}`);
  console.log(`🔑 Student Password: password123`);
  console.log(`📧 Student Email Format: d23dccn001@stu.ptit.edu.vn`);
  console.log('═══════════════════════════════════');
  console.log('\n🎉 Seed completed successfully!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
