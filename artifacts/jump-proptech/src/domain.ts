export type Property = { id:string; name:string; type:string; address:string; suburb:string; city:string; province:string; postalCode:string; description:string; createdAt:string; demo?:boolean };
export type Unit = { id:string; propertyId:string; number:string; type:string; monthlyRent:number; occupancyStatus:'Vacant'|'Occupied'|'Maintenance'; tenantId:string; demo?:boolean };
export type TenantStatus = 'Active'|'Pending'|'Former';
export type TenancyStatus = 'Application'|'Active'|'Notice given'|'Ended';
export type TenantPrivateProfile = {
 idNumberOrPassport:string;
 phoneNumber:string;
 whatsappNumber:string;
 email:string;
 emergencyContact:string;
 nextOfKin:string;
 employer:string;
 notes:string;
 classification:'sensitive-personal-information';
 processingPurpose:'tenancy-management';
};
export type Tenant = { id:string; firstName:string; lastName:string; fullName?:string; privateProfile:TenantPrivateProfile; demo?:boolean };
export type Tenancy = {
 id:string;
 tenantId:string;
 propertyId:string;
 unitId:string;
 moveInDate:string;
 leaseStart:string;
 leaseEnd:string;
 monthlyRent:number;
 depositAmount:number;
 paymentDueDay:number;
 status:TenancyStatus;
 createdAt:string;
 demo?:boolean;
};
export type RentRecord = { id:string; unitId:string; tenantId:string; month:string; amount:number; dueDate:string; status:'Paid'|'Pending'|'Overdue'; paymentMethod:string; paidDate:string; demo?:boolean };
export type MaintenanceRequest = { id:string; propertyId:string; unitId:string; tenantId:string; title:string; description:string; priority:'Low'|'Medium'|'High'; status:'Open'|'In progress'|'Resolved'; createdAt:string; demo?:boolean };
export type Profile = { name:string; email:string; phone:string; company:string };
export type Dataset = { properties:Property[]; units:Unit[]; tenants:Tenant[]; tenancies:Tenancy[]; rent:RentRecord[]; maintenance:MaintenanceRequest[]; profile:Profile };
export const STORAGE_KEY='jump-proptech-data-v1';
const sampleRentMonth=new Date().toISOString().slice(0,7);
const privateProfile=(values:Partial<Omit<TenantPrivateProfile,'classification'|'processingPurpose'>>={}):TenantPrivateProfile=>({
 idNumberOrPassport:values.idNumberOrPassport??'',
 phoneNumber:values.phoneNumber??'',
 whatsappNumber:values.whatsappNumber??'',
 email:values.email??'',
 emergencyContact:values.emergencyContact??'',
 nextOfKin:values.nextOfKin??'',
 employer:values.employer??'',
 notes:values.notes??'',
 classification:'sensitive-personal-information',
 processingPurpose:'tenancy-management',
});
export const demoData:Dataset={
 properties:[
  {id:'p1',name:'The Morningside House',type:'Residential property',address:'18 Rivonia Road',suburb:'Morningside',city:'Johannesburg',province:'Gauteng',postalCode:'2196',description:'A well-kept family home with two private rental suites.',createdAt:'2024-02-12',demo:true},
  {id:'p2',name:'Parkview Garden Cottages',type:'Apartments',address:'7 Tyrone Avenue',suburb:'Parkview',city:'Johannesburg',province:'Gauteng',postalCode:'2193',description:'Quiet garden cottages close to the village.',createdAt:'2024-03-03',demo:true},
  {id:'p3',name:'Salt River Lofts',type:'Rooms',address:'42 Durham Avenue',suburb:'Salt River',city:'Cape Town',province:'Western Cape',postalCode:'7925',description:'Compact, bright rooms with shared courtyard.',createdAt:'2024-04-10',demo:true},
 ],
 units:[
  {id:'u1',propertyId:'p1',number:'Garden suite',type:'Backroom',monthlyRent:6800,occupancyStatus:'Occupied',tenantId:'t1',demo:true},
   {id:'u2',propertyId:'p1',number:'Upstairs room',type:'Single Room',monthlyRent:5400,occupancyStatus:'Occupied',tenantId:'t2',demo:true},
  {id:'u3',propertyId:'p2',number:'Cottage 01',type:'Apartment',monthlyRent:9200,occupancyStatus:'Occupied',tenantId:'t3',demo:true},
  {id:'u4',propertyId:'p2',number:'Cottage 02',type:'Apartment',monthlyRent:8900,occupancyStatus:'Vacant',tenantId:'',demo:true},
   {id:'u5',propertyId:'p3',number:'Room 4',type:'Single Room',monthlyRent:4900,occupancyStatus:'Occupied',tenantId:'t4',demo:true},
 ],
 tenants:[
     {id:'t1',firstName:'Lerato',lastName:'Mokoena',fullName:'Lerato Mokoena',privateProfile:privateProfile({email:'lerato.m@example.co.za',phoneNumber:'082 541 9086',whatsappNumber:'082 541 9086'}),demo:true},
     {id:'t2',firstName:'Thabo',lastName:'Nkosi',fullName:'Thabo Nkosi',privateProfile:privateProfile({email:'thabo.n@example.co.za',phoneNumber:'076 230 1174',whatsappNumber:'076 230 1174'}),demo:true},
     {id:'t3',firstName:'Amara',lastName:'Jacobs',fullName:'Amara Jacobs',privateProfile:privateProfile({email:'amara.j@example.co.za',phoneNumber:'083 419 2257',whatsappNumber:'083 419 2257'}),demo:true},
     {id:'t4',firstName:'Sipho',lastName:'Dlamini',fullName:'Sipho Dlamini',privateProfile:privateProfile({email:'sipho.d@example.co.za',phoneNumber:'071 906 4382',whatsappNumber:'071 906 4382'}),demo:true},
  ],
  tenancies:[
    {id:'tn1',tenantId:'t1',propertyId:'p1',unitId:'u1',moveInDate:'2026-01-01',leaseStart:'2026-01-01',leaseEnd:'2026-12-31',monthlyRent:6800,depositAmount:6800,paymentDueDay:1,status:'Active',createdAt:'2026-01-01',demo:true},
    {id:'tn2',tenantId:'t2',propertyId:'p1',unitId:'u2',moveInDate:'2026-02-01',leaseStart:'2026-02-01',leaseEnd:'2027-01-31',monthlyRent:5400,depositAmount:5400,paymentDueDay:1,status:'Active',createdAt:'2026-02-01',demo:true},
    {id:'tn3',tenantId:'t3',propertyId:'p2',unitId:'u3',moveInDate:'2026-03-01',leaseStart:'2026-03-01',leaseEnd:'2027-02-28',monthlyRent:9200,depositAmount:9200,paymentDueDay:1,status:'Active',createdAt:'2026-03-01',demo:true},
    {id:'tn4',tenantId:'t4',propertyId:'p3',unitId:'u5',moveInDate:'2026-04-01',leaseStart:'2026-04-01',leaseEnd:'2027-03-31',monthlyRent:4900,depositAmount:4900,paymentDueDay:1,status:'Active',createdAt:'2026-04-01',demo:true},
 ],
 rent:[
  {id:'r1',unitId:'u1',tenantId:'t1',month:sampleRentMonth,amount:6800,dueDate:`${sampleRentMonth}-01`,status:'Paid',paymentMethod:'EFT',paidDate:`${sampleRentMonth}-02`,demo:true},
  {id:'r2',unitId:'u2',tenantId:'t2',month:sampleRentMonth,amount:5400,dueDate:`${sampleRentMonth}-01`,status:'Paid',paymentMethod:'Cash',paidDate:`${sampleRentMonth}-01`,demo:true},
  {id:'r3',unitId:'u3',tenantId:'t3',month:sampleRentMonth,amount:9200,dueDate:`${sampleRentMonth}-01`,status:'Pending',paymentMethod:'',paidDate:'',demo:true},
  {id:'r4',unitId:'u5',tenantId:'t4',month:sampleRentMonth,amount:4900,dueDate:`${sampleRentMonth}-01`,status:'Overdue',paymentMethod:'',paidDate:'',demo:true},
 ],
 maintenance:[
   {id:'m1',propertyId:'p1',unitId:'u1',tenantId:'t1',title:'Kitchen tap leaking',description:'Slow leak under the sink, appears to be coming from the cold-water connection.',priority:'Medium',status:'In progress',createdAt:'2026-09-08',demo:true},
   {id:'m2',propertyId:'p2',unitId:'u3',tenantId:'t3',title:'Gate remote not working',description:'The front gate remote has stopped responding.',priority:'Low',status:'Open',createdAt:'2026-09-12',demo:true},
 ],
 profile:{name:'Nomsa Khumalo',email:'nomsa@jumpliving.co.za',phone:'082 555 0147',company:'Jump Living'}
};
export const emptyDataset:Dataset={properties:[],units:[],tenants:[],tenancies:[],rent:[],maintenance:[],profile:{name:'',email:'',phone:'',company:''}};
export function tenantDisplayName(tenant:Tenant){return `${tenant.firstName} ${tenant.lastName}`.trim()}
export function tenantDisplayNameById(data:Pick<Dataset,'tenants'>,tenantId:string){const tenant=data.tenants.find(item=>item.id===tenantId);return tenant?tenantDisplayName(tenant):''}
const currentTenancyStatuses:TenancyStatus[]=['Active','Notice given'];
export function getPrimaryTenancy(data:Pick<Dataset,'tenancies'>,tenantId:string):Tenancy|undefined{
 const tenantTenancies=data.tenancies.filter(tenancy=>tenancy.tenantId===tenantId);
 const priority=(status:TenancyStatus)=>currentTenancyStatuses.includes(status)?0:status==='Application'?1:2;
 return tenantTenancies.sort((a,b)=>priority(a.status)-priority(b.status)||b.leaseStart.localeCompare(a.leaseStart)||b.createdAt.localeCompare(a.createdAt))[0];
}
export function getTenantStatus(data:Pick<Dataset,'tenancies'>,tenantId:string):TenantStatus{
 const tenancy=getPrimaryTenancy(data,tenantId);
 if(tenancy&&currentTenancyStatuses.includes(tenancy.status))return 'Active';
 if(tenancy?.status==='Application')return 'Pending';
 return 'Former';
}
export function getTenantDashboardSummary(data:Pick<Dataset,'tenants'|'tenancies'>){
 const activeTenancies=data.tenancies.filter(tenancy=>currentTenancyStatuses.includes(tenancy.status));
 return {
  totalTenants:data.tenants.length,
  activeTenants:data.tenants.filter(tenant=>getTenantStatus(data,tenant.id)==='Active').length,
  monthlyContractedRent:activeTenancies.reduce((sum,tenancy)=>sum+tenancy.monthlyRent,0),
 };
}
export function reconcileUnitOccupancy(units:Unit[],tenancies:Tenancy[]):Unit[]{
 const activeByUnit=new Map<string,Tenancy>();
 tenancies.filter(tenancy=>currentTenancyStatuses.includes(tenancy.status)).forEach(tenancy=>{
  if(!activeByUnit.has(tenancy.unitId))activeByUnit.set(tenancy.unitId,tenancy);
 });
 return units.map(unit=>{
  const activeTenancy=activeByUnit.get(unit.id);
  if(activeTenancy)return {...unit,occupancyStatus:'Occupied',tenantId:activeTenancy.tenantId};
  if(unit.tenantId)return {...unit,occupancyStatus:unit.occupancyStatus==='Maintenance'?'Maintenance':'Vacant',tenantId:''};
  return unit;
 });
}
export function getPortfolioSummary(data:Pick<Dataset,'properties'|'units'>){
 const occupiedUnits=data.units.filter(unit=>unit.occupancyStatus==='Occupied').length;
 const vacantUnits=data.units.filter(unit=>unit.occupancyStatus==='Vacant').length;
 const maintenanceUnits=data.units.filter(unit=>unit.occupancyStatus==='Maintenance').length;
 return {
  propertyCount:data.properties.length,
  totalUnits:data.units.length,
  occupiedUnits,
  vacantUnits,
  maintenanceUnits,
  occupancyPercentage:data.units.length?Math.round(occupiedUnits/data.units.length*100):0,
 };
}
export type TenantDraft={
 firstName:string;
 lastName:string;
 privateProfile:TenantPrivateProfile;
 propertyId:string;
 unitId:string;
 moveInDate:string;
 leaseStart:string;
 leaseEnd:string;
 monthlyRent:number;
 depositAmount:number;
 paymentDueDay:number;
 status:TenancyStatus;
};
export function validateTenantDraft(data:Dataset,draft:TenantDraft,currentTenantId?:string,currentTenancyId?:string):string|null{
 if(!draft.firstName.trim())return 'First name is required.';
 if(!draft.lastName.trim())return 'Last name is required.';
 if(!draft.privateProfile.phoneNumber.trim())return 'Phone number is required.';
 if(draft.privateProfile.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.privateProfile.email.trim()))return 'Enter a valid email address.';
 if(!draft.propertyId||!data.properties.some(property=>property.id===draft.propertyId))return 'Select a property.';
 const unit=data.units.find(item=>item.id===draft.unitId);
 if(!unit)return 'Select a unit.';
 if(unit.propertyId!==draft.propertyId)return 'Select a unit from the chosen property.';
 if(!draft.moveInDate)return 'Move-in date is required.';
 if(!draft.leaseStart)return 'Lease start date is required.';
 if(!draft.leaseEnd)return 'Lease end date is required.';
 if(draft.leaseStart>draft.leaseEnd)return 'Lease end date must be on or after the lease start date.';
 if(draft.moveInDate>draft.leaseEnd)return 'Move-in date cannot be after the lease end date.';
 if(!Number.isFinite(draft.monthlyRent)||draft.monthlyRent<0)return 'Monthly rent must be a non-negative number.';
 if(!Number.isFinite(draft.depositAmount)||draft.depositAmount<0)return 'Deposit must be a non-negative number.';
 if(!Number.isInteger(draft.paymentDueDay)||draft.paymentDueDay<1||draft.paymentDueDay>31)return 'Payment due day must be a whole number from 1 to 31.';
 const normalize=(value:string)=>value.trim().toLocaleLowerCase();
 const normalizePhone=(value:string)=>value.replace(/\D/g,'');
 const idNumber=normalize(draft.privateProfile.idNumberOrPassport);
 const email=normalize(draft.privateProfile.email);
 const phone=normalizePhone(draft.privateProfile.phoneNumber);
 const duplicate=data.tenants.some(tenant=>{
  if(tenant.id===currentTenantId)return false;
  const profile=tenant.privateProfile;
  return !!(
   (idNumber&&normalize(profile.idNumberOrPassport)===idNumber)||
   (email&&normalize(profile.email)===email)||
   (phone&&normalizePhone(profile.phoneNumber)===phone)
  );
 });
 if(duplicate)return 'A tenant with the same ID/passport number, email, or phone number already exists.';
 if(currentTenancyStatuses.includes(draft.status)){
  if(unit.occupancyStatus==='Maintenance')return 'This unit is marked for maintenance and cannot be assigned an active tenancy.';
  const conflictingTenancy=data.tenancies.find(tenancy=>tenancy.id!==currentTenancyId&&tenancy.unitId===unit.id&&currentTenancyStatuses.includes(tenancy.status));
  if(conflictingTenancy)return 'This unit already has an active tenancy.';
  if(unit.occupancyStatus==='Occupied'&&unit.tenantId!==currentTenantId)return 'This unit is already marked occupied.';
 }
 return null;
}
export function validateUnitDraft(
 data:Dataset,
 draft:Pick<Unit,'propertyId'|'number'|'monthlyRent'|'type'|'occupancyStatus'>,
 currentUnitId?:string,
):string|null{
 const number=draft.number.trim();
 if(!draft.propertyId||!data.properties.some(property=>property.id===draft.propertyId))return 'Select a property before adding this unit.';
 if(!number)return 'Enter a unit number.';
 if(!draft.type.trim())return 'Select a unit type.';
 if(!Number.isFinite(draft.monthlyRent)||draft.monthlyRent<0)return 'Monthly rent must be a non-negative number.';
 const duplicate=data.units.some(unit=>unit.id!==currentUnitId&&unit.propertyId===draft.propertyId&&unit.number.trim().toLocaleLowerCase()===number.toLocaleLowerCase());
 if(duplicate)return `Unit number “${number}” already exists for this property.`;
 return null;
}
function normalizeTenant(record:Record<string,unknown>):Tenant{
 const fullName=String(record.fullName??'').trim().split(/\s+/);
 const firstName=String(record.firstName??fullName.shift()??'');
 const lastName=String(record.lastName??fullName.join(' '));
 const oldProfile=(record.privateProfile&&typeof record.privateProfile==='object'?record.privateProfile:{}) as Record<string,unknown>;
 const isDemo=Boolean(record.demo);
 return {
  id:String(record.id??newId('t')),
  firstName,
  lastName,
   fullName:`${firstName} ${lastName}`.trim(),
  privateProfile:privateProfile({
   idNumberOrPassport:isDemo?'':String(oldProfile.idNumberOrPassport??record.idNumber??''),
   phoneNumber:String(oldProfile.phoneNumber??record.phone??''),
   whatsappNumber:String(oldProfile.whatsappNumber??oldProfile.phoneNumber??record.phone??''),
   email:String(oldProfile.email??record.email??''),
   emergencyContact:String(oldProfile.emergencyContact??''),
   nextOfKin:String(oldProfile.nextOfKin??''),
   employer:String(oldProfile.employer??''),
   notes:String(oldProfile.notes??''),
  }),
  demo:isDemo,
 };
}
function migrateLegacyTenancies(tenants:Tenant[],rawTenants:Record<string,unknown>[],units:Unit[]):Tenancy[]{
 return tenants.flatMap(tenant=>{
  const legacy=rawTenants.find(record=>String(record.id??'')===tenant.id);
  if(!legacy)return [];
  const unitId=String(legacy.unitId??units.find(unit=>unit.tenantId===tenant.id)?.id??'');
  const unit=units.find(item=>item.id===unitId);
  if(!unit)return [];
  const propertyId=unit.propertyId;
  return [{
   id:newId('tn'),
   tenantId:tenant.id,
   propertyId,
   unitId,
   moveInDate:String(legacy.leaseStart??''),
   leaseStart:String(legacy.leaseStart??''),
   leaseEnd:String(legacy.leaseEnd??''),
   monthlyRent:unit.monthlyRent,
   depositAmount:Number(legacy.deposit??0),
   paymentDueDay:1,
   status:unit.occupancyStatus==='Occupied'?'Active':'Application',
   createdAt:String(legacy.leaseStart??new Date().toISOString().slice(0,10)),
   demo:tenant.demo,
  }];
 });
}
export function loadDataset():Dataset {
 try {
  const stored=localStorage.getItem(STORAGE_KEY);
  if(stored){
   const parsed=JSON.parse(stored) as Partial<Dataset>&{tenants?:Record<string,unknown>[]};
   const units=Array.isArray(parsed.units)?parsed.units:demoData.units;
   const rawTenants=Array.isArray(parsed.tenants)?parsed.tenants:demoData.tenants as unknown as Record<string,unknown>[];
   const tenants=rawTenants.map(record=>normalizeTenant(record));
   const tenancies=Array.isArray(parsed.tenancies)?parsed.tenancies as Tenancy[]:migrateLegacyTenancies(tenants,rawTenants,units);
   const merged={...demoData,...parsed,units,tenants,tenancies} as Dataset;
   return {...merged,units:reconcileUnitOccupancy(merged.units,merged.tenancies)};
  }
 } catch { /* use sample records when browser storage is unavailable */ }
 return {...demoData,units:reconcileUnitOccupancy(demoData.units,demoData.tenancies)};
}
export function saveDataset(data:Dataset):boolean{ try { localStorage.setItem(STORAGE_KEY,JSON.stringify(data));return true; } catch { return false; } }
export function newId(prefix:string){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`}
export function money(value:number){return new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(value)}