import { Router } from 'express';
import platformsRouter from './platforms';
import demandsRouter from './demands';
import worklogsRouter from './worklogs';
import contractsRouter from './contracts';
import invoicesRouter from './invoices';
import clientsRouter from './clients';
import instancesRouter from './instances';
import documentsRouter from './documents';
import dashboardRouter from './dashboard';

const router = Router();

// Rotas do Control Tower
router.use('/platforms', platformsRouter);
router.use('/demands', demandsRouter);
router.use('/worklogs', worklogsRouter);
router.use('/contracts', contractsRouter);
router.use('/invoices', invoicesRouter);
router.use('/clients', clientsRouter);
router.use('/instances', instancesRouter);
router.use('/documents', documentsRouter);
router.use('/dashboard', dashboardRouter);

export default router;
