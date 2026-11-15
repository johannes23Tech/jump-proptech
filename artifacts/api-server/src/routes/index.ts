import { Router, type IRouter } from 'express';
import authRouter from './auth';
import healthRouter from './health';
import maintenanceRouter from './maintenance';
import propertiesRouter from './properties';
import rentRouter from './rent';
import tenanciesRouter from './tenancies';
import tenantsRouter from './tenants';
import unitsRouter from './units';
import workspaceRouter from './workspace';
import tenantRouter from './tenant';
import techRouter from './tech';
import rolesRouter from './roles';
import { requireUser, requireRole } from '../middleware/auth';

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

router.use(requireUser);
router.use(workspaceRouter);
router.use(propertiesRouter);
router.use(unitsRouter);
router.use(tenantsRouter);
router.use(tenanciesRouter);
router.use(rentRouter);
router.use(maintenanceRouter);

// Tenant portal (tenant role)
router.use('/tenant', requireRole(['tenant']), tenantRouter);

// Tech / super-admin (tech role)
router.use('/tech', requireRole(['tech']), techRouter);

// Role management (landlord + tech)
router.use('/admin/roles', requireRole(['landlord', 'tech']), rolesRouter);

export default router;
