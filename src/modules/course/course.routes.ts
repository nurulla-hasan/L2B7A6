import { Router } from 'express';
import { upload } from '../../lib/multer';
import { auth } from '../../middlewares/auth';
import { courseController } from './course.controller';

export const courseRouter = Router();

// Create new course with multipart form-data & multiple images upload
courseRouter.post('/', auth('ADMIN'), upload.array('images', 5), courseController.createCourse);

// Get all courses with search & pagination (Authenticated)
courseRouter.get('/', auth(), courseController.getAllCourses);

// Get single course by ID (Authenticated)
courseRouter.get('/:id', auth(), courseController.getCourseById);

// Update course (Admin only)
courseRouter.patch('/:id', auth('ADMIN'), upload.array('images', 5), courseController.updateCourse);

// Soft delete course (Admin only)
courseRouter.delete('/:id', auth('ADMIN'), courseController.deleteCourse);
