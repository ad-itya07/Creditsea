import { Router } from 'express';
import {
  submitDetails,
  uploadSalarySlip,
  applyForLoan,
  getMyLoan,
} from '../controllers/borrower.controller';
import authMiddleware from '../middleware/auth.middleware';
import requireRoles from '../middleware/role.middleware';
import { upload } from '../middleware/upload.middleware';
import { Role } from '../constants/roles';

const router = Router();

// All borrower routes require authentication + BORROWER role
router.use(authMiddleware, requireRoles(Role.BORROWER));

// POST /api/borrower/details — submit personal details + BRE
router.post('/details', submitDetails);

// POST /api/borrower/upload-salary-slip — upload salary slip
router.post('/upload-salary-slip', upload.single('salarySlip'), uploadSalarySlip);

// POST /api/borrower/apply — configure loan + apply
router.post('/apply', applyForLoan);

// GET /api/borrower/my-loan — get current loan status
router.get('/my-loan', getMyLoan);

export default router;
