import bcrypt from 'bcryptjs';
import config from '../config/index';
import { prisma } from './prisma';

const DEFAULT_PASSWORD = config.admin_password || '11111111';

export const seed = async (): Promise<void> => {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  // 1. Seed Admin
  const adminEmail = config.admin_email || 'admin@example.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: config.admin_name || 'System Admin',
        email: adminEmail,
        password: passwordHash,
        role: 'ADMIN',
        emailVerified: true,
        status: 'ACTIVE',
      },
    });
    console.log(`[Seed] Admin created successfully: ${adminEmail} (password: ${DEFAULT_PASSWORD})`);
  } else {
    console.log(`[Seed] Admin already exists: ${adminEmail}`);
  }

  // 2. Seed Teacher
  const teacherEmail = 'teacher@example.com';
  const existingTeacher = await prisma.user.findUnique({
    where: { email: teacherEmail },
  });

  if (!existingTeacher) {
    await prisma.user.create({
      data: {
        name: 'Dr. John Doe',
        email: teacherEmail,
        password: passwordHash,
        role: 'TEACHER',
        emailVerified: true,
        status: 'ACTIVE',
        teacherProfile: {
          create: {
            designation: 'Assistant Professor',
            department: 'Computer Science & Engineering',
            employeeId: 'T-1001',
            bio: 'Senior faculty of Computer Science & Engineering',
          },
        },
      },
    });
    console.log(
      `[Seed] Teacher created successfully: ${teacherEmail} (password: ${DEFAULT_PASSWORD})`,
    );
  } else {
    console.log(`[Seed] Teacher already exists: ${teacherEmail}`);
  }

  // 3. Seed Student
  const studentEmail = 'student@example.com';
  const existingStudent = await prisma.user.findUnique({
    where: { email: studentEmail },
  });

  if (!existingStudent) {
    await prisma.user.create({
      data: {
        name: 'Jane Smith',
        email: studentEmail,
        password: passwordHash,
        role: 'STUDENT',
        emailVerified: true,
        status: 'ACTIVE',
        studentProfile: {
          create: {
            studentId: 'STU-2026-001',
            department: 'Computer Science & Engineering',
            batch: '2026',
            semester: 'Fall',
          },
        },
      },
    });
    console.log(
      `[Seed] Student created successfully: ${studentEmail} (password: ${DEFAULT_PASSWORD})`,
    );
  } else {
    console.log(`[Seed] Student already exists: ${studentEmail}`);
  }

  // 4. Seed Semester
  const existingSemester = await prisma.semester.findFirst({
    where: { name: 'Fall', year: 2026, deletedAt: null },
  });

  if (!existingSemester) {
    const semester = await prisma.semester.create({
      data: {
        name: 'Fall',
        year: 2026,
        startDate: new Date('2026-09-01'),
        endDate: new Date('2026-12-31'),
      },
    });
    console.log(
      `[Seed] Semester created successfully: ${semester.name} ${semester.year} (${semester.id})`,
    );
  } else {
    console.log(`[Seed] Semester already exists: Fall 2026 (${existingSemester.id})`);
  }

  // 5. Seed Course
  const courseCode = 'CSE-102';
  const existingCourse = await prisma.course.findFirst({
    where: { code: courseCode, deletedAt: null },
  });

  if (!existingCourse) {
    const course = await prisma.course.create({
      data: {
        title: 'Object Oriented Programming',
        code: courseCode,
        credits: 3.0,
        images: ['https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800'],
      },
    });
    console.log(
      `[Seed] Course created successfully: ${course.title} [${course.code}] (${course.id})`,
    );
  } else {
    console.log(
      `[Seed] Course already exists: ${existingCourse.title} [${existingCourse.code}] (${existingCourse.id})`,
    );
  }
};

export const seedAdmin = seed;
