import { Router } from 'express';
import { upload } from '../../lib/multer';
import { auth } from '../../middlewares/auth';
import { CourseController } from './course.controller';

const router = Router();

// Create new course with multipart form-data & multiple images upload
router.post('/', auth('ADMIN'), upload.array('images', 5), CourseController.createCourse);

// Get all courses with search & pagination (Authenticated)
router.get('/', auth(), CourseController.getAllCourses);

// Get single course by ID (Authenticated)
router.get('/:id', auth(), CourseController.getCourseById);

// Update course (Admin only)
router.patch('/:id', auth('ADMIN'), upload.array('images', 5), CourseController.updateCourse);

// Soft delete course (Admin only)
router.delete('/:id', auth('ADMIN'), CourseController.deleteCourse);

export const CourseRoutes = router;
