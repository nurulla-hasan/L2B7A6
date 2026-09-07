export interface GradeResult {
  grade: string;
  gradePoint: number;
}

export const calculateGrade = (marks: number): GradeResult => {
  if (marks >= 80) return { grade: 'A+', gradePoint: 4.0 };
  if (marks >= 75) return { grade: 'A', gradePoint: 3.75 };
  if (marks >= 70) return { grade: 'A-', gradePoint: 3.5 };
  if (marks >= 65) return { grade: 'B+', gradePoint: 3.25 };
  if (marks >= 60) return { grade: 'B', gradePoint: 3.0 };
  if (marks >= 55) return { grade: 'B-', gradePoint: 2.75 };
  if (marks >= 50) return { grade: 'C+', gradePoint: 2.5 };
  if (marks >= 45) return { grade: 'C', gradePoint: 2.25 };
  if (marks >= 40) return { grade: 'D', gradePoint: 2.0 };
  return { grade: 'F', gradePoint: 0.0 };
};

export const resultInclude = {
  teacher: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  enrollment: {
    include: {
      student: {
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
      },
      courseOffering: {
        include: {
          course: {
            select: {
              id: true,
              title: true,
              code: true,
              credits: true,
            },
          },
          semester: {
            select: {
              id: true,
              name: true,
              year: true,
            },
          },
        },
      },
    },
  },
};

