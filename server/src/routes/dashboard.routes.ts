import { Router } from 'express';
import {
  getSalesLeads,
  getSanctionQueue,
  approveLoan,
  rejectLoan,
  getDisbursementQueue,
  disburseLoan,
  getCollectionQueue,
  recordPayment,
  getLoanPayments,
} from '../controllers/dashboard.controller';
import authMiddleware from '../middleware/auth.middleware';
import requireRoles from '../middleware/role.middleware';
import { Role } from '../constants/roles';

const router = Router();

// All dashboard routes require authentication
router.use(authMiddleware);

// Sales 
router.get('/sales', requireRoles(Role.SALES, Role.ADMIN), getSalesLeads);

// Sanction 
router.get('/sanction', requireRoles(Role.SANCTION, Role.ADMIN), getSanctionQueue);
router.patch('/sanction/:loanId/approve', requireRoles(Role.SANCTION, Role.ADMIN), approveLoan);
router.patch('/sanction/:loanId/reject', requireRoles(Role.SANCTION, Role.ADMIN), rejectLoan);

// Disbursement 
router.get('/disbursement', requireRoles(Role.DISBURSEMENT, Role.ADMIN), getDisbursementQueue);
router.patch('/disbursement/:loanId/disburse', requireRoles(Role.DISBURSEMENT, Role.ADMIN), disburseLoan);

// Collection 
router.get('/collection', requireRoles(Role.COLLECTION, Role.ADMIN), getCollectionQueue);
router.post('/collection/:loanId/payment', requireRoles(Role.COLLECTION, Role.ADMIN), recordPayment);
router.get('/collection/:loanId/payments', requireRoles(Role.COLLECTION, Role.ADMIN), getLoanPayments);

export default router;
