export type Property = { id:string; name:string; type:string; address:string; suburb:string; city:string; province:string; postalCode:string; description:string; createdAt:string; demo?:boolean };
export type Unit = { id:string; propertyId:string; number:string; type:string; monthlyRent:number; occupancyStatus:'Occupied'|'Vacant'; tenantId:string; demo?:boolean };
export type Tenant = { id:string; fullName:string; email:string; phone:string; idNumber:string; unitId:string; leaseStart:string; leaseEnd:string; deposit:number; demo?:boolean };
export type RentRecord = { id:string; unitId:string; tenantId:string; month:string; amount:number; dueDate:string; status:'Paid'|'Pending'|'Overdue'; paymentMethod:string; paidDate:string; demo?:boolean };
export type MaintenanceRequest = { id:string; propertyId:string; unitId:string; tenantId:string; title:string; description:string; priority:'Low'|'Medium'|'High'; status:'Open'|'In progress'|'Resolved'; createdAt:string; demo?:boolean };
export type Profile = { name:string; email:string; phone:string; company:string };
export type Dataset = { properties:Property[]; units:Unit[]; tenants:Tenant[]; rent:RentRecord[]; maintenance:MaintenanceRequest[]; profile:Profile };
export const STORAGE_KEY='jump-proptech-data-v1';
const sampleRentMonth=new Date().toISOString().slice(0,7);
export const demoData:Dataset={
 properties:[
  {id:'p1',name:'The Morningside House',type:'Residential property',address:'18 Rivonia Road',suburb:'Morningside',city:'Johannesburg',province:'Gauteng',postalCode:'2196',description:'A well-kept family home with two private rental suites.',createdAt:'2024-02-12',demo:true},
  {id:'p2',name:'Parkview Garden Cottages',type:'Apartments',address:'7 Tyrone Avenue',suburb:'Parkview',city:'Johannesburg',province:'Gauteng',postalCode:'2193',description:'Quiet garden cottages close to the village.',createdAt:'2024-03-03',demo:true},
  {id:'p3',name:'Salt River Lofts',type:'Rooms',address:'42 Durham Avenue',suburb:'Salt River',city:'Cape Town',province:'Western Cape',postalCode:'7925',description:'Compact, bright rooms with shared courtyard.',createdAt:'2024-04-10',demo:true},
 ],
 units:[
  {id:'u1',propertyId:'p1',number:'Garden suite',type:'Backroom',monthlyRent:6800,occupancyStatus:'Occupied',tenantId:'t1',demo:true},
  {id:'u2',propertyId:'p1',number:'Upstairs room',type:'Room',monthlyRent:5400,occupancyStatus:'Occupied',tenantId:'t2',demo:true},
  {id:'u3',propertyId:'p2',number:'Cottage 01',type:'Apartment',monthlyRent:9200,occupancyStatus:'Occupied',tenantId:'t3',demo:true},
  {id:'u4',propertyId:'p2',number:'Cottage 02',type:'Apartment',monthlyRent:8900,occupancyStatus:'Vacant',tenantId:'',demo:true},
  {id:'u5',propertyId:'p3',number:'Room 4',type:'Room',monthlyRent:4900,occupancyStatus:'Occupied',tenantId:'t4',demo:true},
 ],
 tenants:[
   {id:'t1',fullName:'Lerato Mokoena',email:'lerato.m@example.co.za',phone:'082 541 9086',idNumber:'910614 0382 086',unitId:'u1',leaseStart:'2026-01-01',leaseEnd:'2026-12-31',deposit:6800,demo:true},
   {id:'t2',fullName:'Thabo Nkosi',email:'thabo.n@example.co.za',phone:'076 230 1174',idNumber:'880903 5211 082',unitId:'u2',leaseStart:'2026-02-01',leaseEnd:'2027-01-31',deposit:5400,demo:true},
   {id:'t3',fullName:'Amara Jacobs',email:'amara.j@example.co.za',phone:'083 419 2257',idNumber:'950122 0187 081',unitId:'u3',leaseStart:'2026-03-01',leaseEnd:'2027-02-28',deposit:9200,demo:true},
   {id:'t4',fullName:'Sipho Dlamini',email:'sipho.d@example.co.za',phone:'071 906 4382',idNumber:'900417 5628 084',unitId:'u5',leaseStart:'2026-04-01',leaseEnd:'2027-03-31',deposit:4900,demo:true},
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
export const emptyDataset:Dataset={properties:[],units:[],tenants:[],rent:[],maintenance:[],profile:{name:'',email:'',phone:'',company:''}};
export function loadDataset():Dataset {
 try { const stored=localStorage.getItem(STORAGE_KEY); if(stored) return {...demoData,...JSON.parse(stored)} as Dataset; } catch { /* use sample records when browser storage is unavailable */ }
 return demoData;
}
export function saveDataset(data:Dataset){ try { localStorage.setItem(STORAGE_KEY,JSON.stringify(data)); } catch { /* storage may be unavailable; the current session still works */ } }
export function newId(prefix:string){return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`}
export function money(value:number){return new Intl.NumberFormat('en-ZA',{style:'currency',currency:'ZAR',maximumFractionDigits:0}).format(value)}