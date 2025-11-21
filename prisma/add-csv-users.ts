import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🔑 Adding user accounts for CSV students...\n');

  // Read CSV file
  const csvPath = path.join(process.cwd(), 'test_students.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.log('❌ File test_students.csv not found!');
    return;
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').slice(1); // Skip header
  
  const students = lines
    .filter(line => line.trim())
    .map(line => {
      const [studentId, name, email] = line.split(',').map(s => s.trim());
      return { studentId, name, email };
    });

  console.log(`📄 Found ${students.length} students in CSV\n`);

  const studentPassword = await bcrypt.hash('password123', 10);
  let created = 0;
  let existing = 0;

  for (const student of students) {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: student.email },
      });

      if (existingUser) {
        existing++;
        console.log(`⏭️  ${student.email} - already exists`);
        continue;
      }

      // Create user account
      await prisma.user.create({
        data: {
          email: student.email,
          passwordHash: studentPassword,
          displayName: student.name,
          role: 'student',
        },
      });

      created++;
      console.log(`✅ ${student.email} - account created`);
    } catch (error: any) {
      console.error(`❌ Error creating account for ${student.email}:`, error.message);
    }
  }

  console.log('\n📊 Summary:');
  console.log('═══════════════════════════════════');
  console.log(`✅ Created: ${created} accounts`);
  console.log(`⏭️  Existing: ${existing} accounts`);
  console.log(`📧 Email: d23dccn001@stu.ptit.edu.vn`);
  console.log(`🔑 Password: password123`);
  console.log('═══════════════════════════════════');
  console.log('\n🎉 Done!');
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
