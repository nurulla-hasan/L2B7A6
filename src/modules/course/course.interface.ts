export interface ICreateCoursePayload {
  title: string;
  code: string;
  credits: number;
}

export interface IUpdateCoursePayload {
  title?: string;
  code?: string;
  credits?: number;
}
