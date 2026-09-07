export const paymentInclude = {
  enrollment: {
    include: {
      student: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      courseOffering: {
        include: {
          course: {
            select: { id: true, title: true, code: true, credits: true },
          },
          semester: {
            select: { id: true, name: true, year: true },
          },
          teacher: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  },
};

