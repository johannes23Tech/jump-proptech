import { z } from 'zod/v4';

/**
 * Shared API contracts: request validation (zod) and response types.
 * Imported by the API server for validation and by the web client for types.
 */

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const monthPattern = /^\d{4}-\d{2}$/;

const requiredText = (label: string, max = 200) =>
  z.string().trim().min(1, `${label} is required.`).max(max);

const optionalText = (max = 2000) => z.string().trim().max(max).default('');

const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .refine((value) => !value || emailPattern.test(value), 'Enter a valid email address.')
  .default('');

const isoDate = (label: string) =>
  z
    .string()
    .trim()
    .regex(isoDatePattern, `${label} must use the YYYY-MM-DD format.`);

const optionalIsoDate = z
  .string()
  .trim()
  .refine((value) => !value || isoDatePattern.test(value), 'Dates must use the YYYY-MM-DD format.')
  .default('');

export const occupancyStatusSchema = z.enum(['Vacant', 'Occupied', 'Maintenance']);
export const tenancyStatusSchema = z.enum(['Application', 'Active', 'Notice given', 'Ended']);
export const rentStatusSchema = z.enum(['Paid', 'Pending', 'Overdue']);
export const prioritySchema = z.enum(['Low', 'Medium', 'High']);
export const maintenanceStatusSchema = z.enum(['Open', 'In progress', 'Resolved']);

export const privateProfileSchema = z.object({
  idNumberOrPassport: optionalText(60),
  phoneNumber: requiredText('Phone number', 40),
  whatsappNumber: optionalText(40),
  email: optionalEmail,
  emergencyContact: optionalText(160),
  nextOfKin: optionalText(160),
  employer: optionalText(160),
  notes: optionalText(2000),
});

export const propertyInputSchema = z.object({
  name: requiredText('Property name', 120),
  type: requiredText('Property type', 60),
  address: requiredText('Address', 200),
  suburb: optionalText(80),
  city: requiredText('City', 80),
  province: requiredText('Province', 60),
  postalCode: optionalText(20),
  description: optionalText(2000),
});

export const unitInputSchema = z.object({
  propertyId: requiredText('Property', 40),
  number: requiredText('Unit number', 60),
  type: requiredText('Unit type', 60),
  monthlyRent: z.coerce.number().int('Monthly rent must be a whole number.').min(0, 'Monthly rent cannot be negative.'),
  occupancyStatus: occupancyStatusSchema.default('Vacant'),
  tenantId: z.string().trim().max(40).default(''),
});

export const tenancyInputSchema = z.object({
  propertyId: requiredText('Property', 40),
  unitId: requiredText('Unit', 40),
  moveInDate: isoDate('Move-in date'),
  leaseStart: isoDate('Lease start date'),
  leaseEnd: isoDate('Lease end date'),
  monthlyRent: z.coerce.number().int().min(0, 'Monthly rent cannot be negative.'),
  depositAmount: z.coerce.number().int().min(0, 'Deposit cannot be negative.'),
  paymentDueDay: z.coerce
    .number()
    .int('Payment due day must be a whole number.')
    .min(1, 'Payment due day must be between 1 and 31.')
    .max(31, 'Payment due day must be between 1 and 31.'),
  status: tenancyStatusSchema,
});

export const tenantInputSchema = z.object({
  firstName: requiredText('First name', 80),
  lastName: requiredText('Last name', 80),
  privateProfile: privateProfileSchema,
  tenancy: tenancyInputSchema,
  tenancyId: z.string().trim().max(40).optional(),
});

export const rentInputSchema = z.object({
  unitId: requiredText('Unit', 40),
  tenantId: requiredText('Tenant', 40),
  month: z.string().trim().regex(monthPattern, 'Rental month must use the YYYY-MM format.'),
  amount: z.coerce.number().int().min(0, 'Amount cannot be negative.'),
  dueDate: isoDate('Due date'),
  status: rentStatusSchema,
  paymentMethod: optionalText(60),
  paidDate: optionalIsoDate,
});

export const maintenanceInputSchema = z.object({
  propertyId: requiredText('Property', 40),
  unitId: z.string().trim().max(40).default(''),
  tenantId: z.string().trim().max(40).default(''),
  title: requiredText('Request title', 160),
  description: optionalText(2000),
  priority: prioritySchema,
  status: maintenanceStatusSchema,
});

export const profileInputSchema = z.object({
  name: z.string().trim().max(120).default(''),
  email: optionalEmail,
  phone: z.string().trim().max(40).default(''),
  company: z.string().trim().max(120).default(''),
});

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .max(200)
    .refine((value) => emailPattern.test(value), 'Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(200),
  fullName: requiredText('Full name', 120),
  company: z.string().trim().max(120).default(''),
});

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Email is required.').max(200),
  password: z.string().min(1, 'Password is required.').max(200),
});

export const unitUpdateSchema = unitInputSchema.partial();
export const propertyUpdateSchema = propertyInputSchema.partial();
export const rentUpdateSchema = rentInputSchema.partial();
export const maintenanceUpdateSchema = maintenanceInputSchema.partial();

export type OccupancyStatus = z.infer<typeof occupancyStatusSchema>;
export type TenancyStatus = z.infer<typeof tenancyStatusSchema>;
export type TenantStatus = 'Active' | 'Pending' | 'Former';
export type RentStatus = z.infer<typeof rentStatusSchema>;
export type Priority = z.infer<typeof prioritySchema>;
export type MaintenanceStatus = z.infer<typeof maintenanceStatusSchema>;

export type TenantPrivateProfile = {
  idNumberOrPassport: string;
  phoneNumber: string;
  whatsappNumber: string;
  email: string;
  emergencyContact: string;
  nextOfKin: string;
  employer: string;
  notes: string;
};

export type PublicUser = {
  id: string;
  email: string;
  fullName: string;
  company: string;
  phone: string;
  role: string;
  tenantId: string | null;
};

export type Property = {
  id: string;
  name: string;
  type: string;
  address: string;
  suburb: string;
  city: string;
  province: string;
  postalCode: string;
  description: string;
  createdAt: string;
};

export type Unit = {
  id: string;
  propertyId: string;
  number: string;
  type: string;
  monthlyRent: number;
  occupancyStatus: OccupancyStatus;
  tenantId: string;
};

export type Tenant = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  privateProfile: TenantPrivateProfile;
  createdAt: string;
};

export type Tenancy = {
  id: string;
  tenantId: string;
  propertyId: string;
  unitId: string;
  moveInDate: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  depositAmount: number;
  paymentDueDay: number;
  status: TenancyStatus;
  createdAt: string;
};

export type RentRecord = {
  id: string;
  unitId: string;
  tenantId: string;
  month: string;
  amount: number;
  dueDate: string;
  status: RentStatus;
  paymentMethod: string;
  paidDate: string;
};

export type MaintenanceRequest = {
  id: string;
  propertyId: string;
  unitId: string;
  tenantId: string;
  title: string;
  description: string;
  priority: Priority;
  status: MaintenanceStatus;
  createdAt: string;
};

export type Workspace = {
  user: PublicUser;
  properties: Property[];
  units: Unit[];
  tenants: Tenant[];
  tenancies: Tenancy[];
  rent: RentRecord[];
  maintenance: MaintenanceRequest[];
};

export type UnitInput = z.infer<typeof unitInputSchema>;
export type PropertyInput = z.infer<typeof propertyInputSchema>;
export type TenancyInput = z.infer<typeof tenancyInputSchema>;
export type TenantInput = z.infer<typeof tenantInputSchema>;
export type RentInput = z.infer<typeof rentInputSchema>;
export type MaintenanceInput = z.infer<typeof maintenanceInputSchema>;
export type ProfileInput = z.infer<typeof profileInputSchema>;
