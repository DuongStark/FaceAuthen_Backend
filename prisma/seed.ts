import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create lecturer account
  const lecturerPassword = 'lecturer123';
  const passwordHash = await bcrypt.hash(lecturerPassword, 10);
  
  const lecturer = await prisma.user.upsert({
    where: { email: 'lecturer@uni.edu' },
    update: {},
    create: {
      email: 'lecturer@uni.edu',
      passwordHash,
      displayName: 'Dr. John Smith',
      role: 'lecturer',
    },
  });

  console.log('✓ Lecturer account: lecturer@uni.edu');
  console.log('  Password: lecturer123');

  // Create a sample class
  const sampleClass = await prisma.class.upsert({
    where: { id: 'class-001' },
    update: {},
    create: {
      id: 'class-001',
      lecturerId: lecturer.uid,
      name: 'Introduction to Computer Science',
      code: 'CS101',
      description: 'Basic concepts of programming and software development',
    },
  });

  console.log('✓ Sample class: CS101');

  // Create sample students
  const sampleStudents = [
    { studentId: 'SV001', name: 'Nguyen Van A', email: 'sv001@student.uni.edu' },
    { studentId: 'SV002', name: 'Tran Thi B', email: 'sv002@student.uni.edu' },
    { studentId: 'SV003', name: 'Le Van C', email: 'sv003@student.uni.edu' },
    { studentId: 'SV004', name: 'Pham Thi D', email: 'sv004@student.uni.edu' },
    { studentId: 'SV005', name: 'Hoang Van E', email: 'sv005@student.uni.edu' },
  ];

  for (const student of sampleStudents) {
    await prisma.student.upsert({
      where: {
        classId_studentId: {
          classId: sampleClass.id,
          studentId: student.studentId,
        },
      },
      update: {},
      create: {
        classId: sampleClass.id,
        studentId: student.studentId,
        name: student.name,
        email: student.email,
      },
    });
  }

  console.log(`✓ Created ${sampleStudents.length} sample students`);
  
  // Create face descriptors for sample students
  let descriptorCount = 0;
  for (const student of sampleStudents) {
    const studentRecord = await prisma.student.findFirst({
      where: { studentId: student.studentId },
    });
    
    if (studentRecord) {
      // Create 2 dummy descriptors per student for testing
      for (let i = 0; i < 2; i++) {
        await prisma.faceDescriptor.upsert({
          where: {
            id: `desc-${student.studentId}-${i}`,
          },
          update: {},
          create: {
            id: `desc-${student.studentId}-${i}`,
            studentId: studentRecord.id,
            descriptor: [
              0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0,
              1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2.0,
              // Dummy descriptor values
            ],
          },
        });
        descriptorCount++;
      }
    }
  }
  
  console.log(`✓ Created ${descriptorCount} face descriptors`);
  
  // Create a test student account
  const studentPassword = await bcrypt.hash('student123', 10);
  await prisma.user.upsert({
    where: { email: 'student@uni.edu' },
    update: {},
    create: {
      email: 'student@uni.edu',
      passwordHash: studentPassword,
      displayName: 'Test Student',
      role: 'student',
    },
  });
  
  console.log('\nSeed completed successfully!');
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
