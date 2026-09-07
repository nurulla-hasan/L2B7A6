export const enrollmentInclude = {
  courseOffering: {
    include: {
      course: {
        select: { id: true, title: true, code: true, credits: true, images: true },
      },
      semester: {
        select: { id: true, name: true, year: true, startDate: true, endDate: true },
      },
      teacher: {
        select: { id: true, name: true, email: true },
      },
    },
  },
  payments: {
    select: {
      id: true,
      amount: true,
      status: true,
      transactionId: true,
      createdAt: true,
    },
  },
};

export const studentSelect = {
  select: {
    id: true,
    name: true,
    email: true,
    imageUrl: true,
    studentProfile: {
      select: {
        studentId: true,
        department: true,
        batch: true,
      },
    },
  },
};

