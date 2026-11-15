import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AuthScreen from "@/pages/auth";
import {
  Route,
  Switch,
  Link,
  useLocation,
  Router as WouterRouter,
} from "wouter";
import {
  Building2,
  FileBarChart2,
  Home,
  LayoutDashboard,
  Settings,
  Users,
  Wallet,
  Wrench,
  User,
  HardHat,
  FileText,
} from "lucide-react";
import {
  getPortfolioSummary,
  getPrimaryTenancy,
  getTenantStatus,
  money,
  tenantDisplayName,
  type Dataset,
  type MaintenanceRequest,
  type RentRecord,
  type Unit,
} from "./domain";
import TenantWorkspace, {
  type TenantWorkspaceRow,
  type TenantWorkspaceSavePayload,
} from "./components/TenantWorkspace";
import { AppProvider, useApp, useWorkspace } from "./state/app";
import TenantHome from "./pages/tenant/TenantHome";
import TenantLease from "./pages/tenant/TenantLease";
import TenantPayments from "./pages/tenant/TenantPayments";
import TenantReportIssue from "./pages/tenant/TenantReportIssue";
import TenantMaintenance from "./pages/tenant/TenantMaintenance";
import TenantStatements from "./pages/tenant/TenantStatements";
import TechDashboard from "./pages/tech/TechDashboard";
import TechTickets from "./pages/tech/TechTickets";

const landlordNavItems = [
  { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { path: "/properties", label: "Properties", icon: Building2 },
  { path: "/units", label: "Units", icon: Home },
  { path: "/tenants", label: "Tenants & leases", icon: Users },
  { path: "/rent", label: "Rent records", icon: Wallet },
  { path: "/maintenance", label: "Maintenance", icon: Wrench },
  { path: "/reports", label: "Reports", icon: FileBarChart2 },
  { path: "/settings", label: "Settings", icon: Settings },
];

const tenantNavItems = [
  { path: "/tenant/home", label: "Home", icon: Home },
  { path: "/tenant/lease", label: "My Lease", icon: FileText },
  { path: "/tenant/payments", label: "My Payments", icon: Wallet },
  { path: "/tenant/report-issue", label: "Report Issue", icon: HardHat },
  { path: "/tenant/maintenance", label: "My Maintenance", icon: Wrench },
  { path: "/tenant/statements", label: "Statements", icon: FileBarChart2 },
  { path: "/settings", label: "Settings", icon: Settings },
];

const techNavItems = [
  { path: "/tech/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/tech/tickets", label: "Tickets", icon: HardHat },
  { path: "/settings", label: "Settings", icon: Settings },
];

function getNavItems(role: string | null) {
  if (role === "tenant") return tenantNavItems;
  if (role === "tech") return techNavItems;
  return landlordNavItems;
}
const pageInfo: Record<
  string,
  { title: string; kicker: string; description: string }
> = {
  "/dashboard": {
    title: "Overview",
    kicker: "YOUR PORTFOLIO",
    description: "A clear view of what’s happening across your rentals.",
  },
  "/properties": {
    title: "Properties",
    kicker: "YOUR PORTFOLIO",
    description: "Keep every address and property detail in one place.",
  },
  "/units": {
    title: "Units",
    kicker: "RENTAL INVENTORY",
    description: "Rooms, backrooms and apartments — all accounted for.",
  },
  "/tenants": {
    title: "Tenants & leases",
    kicker: "PEOPLE & AGREEMENTS",
    description: "Know who is living where, and when their lease is up.",
  },
  "/rent": {
    title: "Rent records",
    kicker: "MONTHLY RENTAL LEDGER",
    description: "Track monthly rent records and payment status.",
  },
  "/maintenance": {
    title: "Maintenance",
    kicker: "PROPERTY CARE",
    description: "Keep requests moving, from first report to resolution.",
  },
  "/reports": {
    title: "Reports",
    kicker: "PORTFOLIO INSIGHTS",
    description: "Financial and occupancy summaries from your records.",
  },
  "/settings": {
    title: "Settings",
    kicker: "YOUR WORKSPACE",
    description: "Manage your profile, account and workspace data.",
  },
  "/tenant/home": {
    title: "My Home",
    kicker: "TENANT PORTAL",
    description: "Your lease, payments, and maintenance in one place.",
  },
  "/tenant/lease": {
    title: "My Lease",
    kicker: "LEASE AGREEMENT",
    description: "View your current tenancy details and lease terms.",
  },
  "/tenant/payments": {
    title: "My Payments",
    kicker: "RENT LEDGER",
    description: "Track rent payments and outstanding balance.",
  },
  "/tenant/report-issue": {
    title: "Report Issue",
    kicker: "MAINTENANCE REQUEST",
    description: "Submit a maintenance issue for your unit.",
  },
  "/tenant/maintenance": {
    title: "My Maintenance",
    kicker: "SERVICE REQUESTS",
    description: "Track the status of your maintenance tickets.",
  },
  "/tenant/statements": {
    title: "Statements",
    kicker: "RENT STATEMENTS",
    description: "Download rent statements for 1, 3, 6, or 12 months.",
  },
  "/tech/dashboard": {
    title: "Tech Dashboard",
    kicker: "SUPER ADMIN",
    description: "Platform overview and maintenance ticket management.",
  },
  "/tech/tickets": {
    title: "All Tickets",
    kicker: "MAINTENANCE QUEUE",
    description: "Manage and resolve maintenance requests.",
  },
};
function Workspace() {
  const { data, signOut, pending, userRole, userTenantId } = useWorkspace();
  const [location, setLocation] = useLocation();
  const [mobileNav, setMobileNav] = useState(false);
  useEffect(() => {
    if (location === "/") {
      // Redirect based on role
      if (userRole === "tenant") setLocation("/tenant/home");
      else if (userRole === "tech") setLocation("/tech/dashboard");
      else setLocation("/dashboard");
    }
  }, [location, setLocation, userRole]);
  const active = pageInfo[location] ? location : "/dashboard";
  const navItems = getNavItems(userRole);
  const profile = {
    name: data.user.fullName,
    email: data.user.email,
    phone: data.user.phone,
    company: data.user.company,
    role: data.user.role,
  };
  const profileInitials = (
    profile.name ||
    profile.company ||
    profile.email ||
    "JL"
  )
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div className="app-shell flex">
      <aside
        className={`side-nav fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${mobileNav ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-[82px] items-center border-b border-white/10 px-6">
          <div>
            <div className="font-display text-[24px] font-extrabold tracking-[-.04em]">
              jump<span className="text-[#c5a55a]">.</span>
            </div>
            <div className="mt-1 text-[11px] font-semibold tracking-[.18em] text-white/45">
              PROPERTY WORKSPACE
            </div>
          </div>
          <button
            className="ml-auto rounded-lg px-2 py-1.5 text-[13px] font-semibold text-white/60 hover:bg-white/10 lg:hidden"
            onClick={() => setMobileNav(false)}
          >
            Close
          </button>
        </div>
        <div className="px-5 pb-2 pt-6 text-[13px] font-bold tracking-[.16em] text-white/35">
          MANAGE
        </div>
        <nav className="nav-scroll flex-1 space-y-1 overflow-y-auto px-3">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              href={path}
              onClick={() => setMobileNav(false)}
              data-testid={`link-nav-${path.slice(1)}`}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-[16px] font-medium transition-colors ${active === path ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/[.06] hover:text-white"}`}
            >
              <Icon
                size={18}
                strokeWidth={1.8}
                className={
                  active === path
                    ? "shrink-0 text-[#d2b66f]"
                    : "shrink-0 text-white/40"
                }
              />
              <span className="flex-1">{label}</span>
              {active === path && (
                <span className="h-1.5 w-1.5 rounded-full bg-[#d2b66f]" />
              )}
            </Link>
          ))}
        </nav>
        <div className="mx-4 mb-4 rounded-xl border border-white/10 bg-white/[.04] p-4">
          <div className="text-[11px] font-bold uppercase tracking-[.16em] text-[#d2b66f]">
            Secure workspace
          </div>
          <p className="mb-0 mt-2 text-[13px] leading-relaxed text-white/45">
            Your records are stored in your account on this server.
          </p>
        </div>
        <div className="border-t border-white/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c5a55a]/20 text-[15px] font-bold text-[#e4ce97]">
              {profileInitials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[15px] font-semibold">
                {profile.name || profile.email}
              </div>
              <div className="truncate text-[13px] text-white/45">
                {profile.company || "Landlord workspace"}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="mt-3 w-full rounded-lg border border-white/15 px-3 py-2 text-[13px] font-semibold text-white/65 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
          >
            Sign out
          </button>
        </div>
      </aside>
      {mobileNav && (
        <button
          aria-label="Close navigation overlay"
          className="fixed inset-0 z-30 bg-[#12151b]/55 lg:hidden"
          onClick={() => setMobileNav(false)}
        />
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-[#e8e2d5] bg-[#f7f5ef]/95 px-4 backdrop-blur-md sm:px-7 lg:px-9">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNav(true)}
              className="rounded-lg px-2 py-1.5 text-[14px] font-semibold text-[#56564f] hover:bg-black/5 lg:hidden"
            >
              Menu
            </button>
            <div className="hidden text-[14px] font-medium text-[#8c897f] sm:block">
              Jump Living <span className="mx-1.5 text-[#c8b77f]">/</span>{" "}
              <span className="text-[#33342f]">{pageInfo[active]?.title}</span>
            </div>
            <div className="sm:hidden font-display text-[18px] font-bold">
              {pageInfo[active]?.title}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-[#e5dfd1] bg-white/70 px-3 py-1.5 text-[13px] text-[#716e64] md:flex">
              <span
                className={`h-1.5 w-1.5 rounded-full ${pending ? "animate-pulse bg-[#c5a55a]" : "bg-[#6f9068]"}`}
              />
              {pending ? "SAVING…" : "SESSION ACTIVE"}
            </div>
            <div className="hidden h-8 w-px bg-[#e2dccf] sm:block" />
            <div className="hidden text-right sm:block">
              <div className="text-[14px] font-semibold">
                {profile.name || profile.email}
              </div>
              <div className="text-[13px] text-[#99958a]">
                {profile.company || "Landlord workspace"}
              </div>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#252a30] text-[13px] font-bold text-[#e1ca8d]">
              {profileInitials}
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 pb-24 pt-7 sm:px-7 sm:pt-9 lg:px-10 lg:pb-12">
          <Switch>
            <Route path="/dashboard">
              <PageFrame page="/dashboard">
                <Dashboard />
              </PageFrame>
            </Route>
            <Route path="/properties">
              <PageFrame page="/properties">
                <Properties />
              </PageFrame>
            </Route>
            <Route path="/units">
              <PageFrame page="/units">
                <Units />
              </PageFrame>
            </Route>
            <Route path="/tenants">
              <PageFrame page="/tenants">
                <Tenants />
              </PageFrame>
            </Route>
            <Route path="/rent">
              <PageFrame page="/rent">
                <Rent />
              </PageFrame>
            </Route>
            <Route path="/maintenance">
              <PageFrame page="/maintenance">
                <Maintenance />
              </PageFrame>
            </Route>
            <Route path="/reports">
              <PageFrame page="/reports">
                <Reports />
              </PageFrame>
            </Route>
            <Route path="/settings">
              <PageFrame page="/settings">
                <SettingsPage />
              </PageFrame>
            </Route>
            {/* Tenant routes */}
            <Route path="/tenant/home">
              <PageFrame page="/tenant/home">
                <TenantHome />
              </PageFrame>
            </Route>
            <Route path="/tenant/lease">
              <PageFrame page="/tenant/lease">
                <TenantLease />
              </PageFrame>
            </Route>
            <Route path="/tenant/payments">
              <PageFrame page="/tenant/payments">
                <TenantPayments />
              </PageFrame>
            </Route>
            <Route path="/tenant/report-issue">
              <PageFrame page="/tenant/report-issue">
                <TenantReportIssue />
              </PageFrame>
            </Route>
            <Route path="/tenant/maintenance">
              <PageFrame page="/tenant/maintenance">
                <TenantMaintenance />
              </PageFrame>
            </Route>
            <Route path="/tenant/statements">
              <PageFrame page="/tenant/statements">
                <TenantStatements />
              </PageFrame>
            </Route>
            {/* Tech routes */}
            <Route path="/tech/dashboard">
              <PageFrame page="/tech/dashboard">
                <TechDashboard />
              </PageFrame>
            </Route>
            <Route path="/tech/tickets">
              <PageFrame page="/tech/tickets">
                <TechTickets />
              </PageFrame>
            </Route>
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-[#e5dfd2] bg-[#fbfaf6] px-1 pb-[env(safe-area-inset-bottom)] lg:hidden">
        {[navItems[0], navItems[1], navItems[2], navItems[4], navItems[7]].map(
          ({ path, label, icon: Icon }) => (
            <Link
              key={path}
              href={path}
              data-testid={`mobile-nav-${path.slice(1)}`}
              className={`flex flex-col items-center justify-center gap-1 border-t-2 py-2.5 text-[11px] font-bold uppercase tracking-[.06em] ${active === path ? "border-[#b79850] text-[#6f5b2c]" : "border-transparent text-[#858277]"}`}
            >
              <Icon
                size={19}
                strokeWidth={1.8}
                className={
                  active === path ? "text-[#a9873f]" : "text-[#9b988c]"
                }
              />
              {label === "Overview"
                ? "Home"
                : label === "Rent records"
                  ? "Rent"
                  : label === "Settings"
                    ? "Settings"
                    : label}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}
function PageFrame({ page, children }: { page: string; children: ReactNode }) {
  const meta = pageInfo[page];
  return (
    <div className="enter">
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 text-[11px] font-bold tracking-[.2em] text-[#a18a50]">
            {meta.kicker}
          </div>
          <h1 className="font-display text-[34px] font-extrabold tracking-[-.045em] text-[#252821] sm:text-[43px]">
            {meta.title}
          </h1>
          <p className="mt-1.5 max-w-lg text-[16px] leading-relaxed text-[#77756c]">
            {meta.description}
          </p>
        </div>
        {page === "/dashboard" && (
          <div className="inline-flex items-center gap-2 self-start rounded-lg border border-[#e5dfd3] bg-white px-3 py-2 text-[14px] text-[#77756c] sm:self-auto">
            Portfolio snapshot{" "}
            <span className="font-semibold text-[#34352f]">This month</span>
          </div>
        )}
      </div>
      {children}
    </div>
  );
}
type Entity = "property" | "unit" | "rent" | "maintenance";
type Field = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  span?: boolean;
};
function entityFields(entity: Entity, data: Dataset): Field[] {
  const properties = [
      { value: "", label: "Select a property" },
      ...data.properties.map((x) => ({ value: x.id, label: x.name })),
    ],
    units = data.units.map((x) => ({ value: x.id, label: x.number })),
    tenants = data.tenants.map((x) => ({
      value: x.id,
      label: tenantDisplayName(x),
    }));
  if (entity === "property")
    return [
      { name: "name", label: "Property Name", required: true },
      { name: "address", label: "Address", required: true },
      {
        name: "city",
        label: "City",
        required: true,
        placeholder: "e.g. Rustenburg",
      },
      {
        name: "province",
        label: "Province",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select a province" },
          ...[
            "Gauteng",
            "Western Cape",
            "KwaZulu-Natal",
            "Eastern Cape",
            "Free State",
            "Limpopo",
            "Mpumalanga",
            "North West",
            "Northern Cape",
          ].map((x) => ({ value: x, label: x })),
        ],
      },
      {
        name: "type",
        label: "Property Type",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select a property type" },
          ...[
            "Residential property",
            "Backroom",
            "Rooms",
            "Apartments",
            "House",
          ].map((x) => ({ value: x, label: x })),
        ],
      },
      { name: "suburb", label: "Suburb" },
      { name: "postalCode", label: "Postal code" },
      {
        name: "description",
        label: "Description",
        type: "textarea",
        span: true,
      },
    ];
  if (entity === "unit")
    return [
      { name: "number", label: "Unit Number", required: true },
      {
        name: "propertyId",
        label: "Property",
        type: "select",
        required: true,
        options: properties,
      },
      {
        name: "type",
        label: "Unit Type",
        type: "select",
        required: true,
        options: [
          { value: "", label: "Select a unit type" },
          ...[
            "Backroom",
            "Single Room",
            "Shared Room",
            "Flat",
            "Apartment",
            "House",
          ].map((x) => ({ value: x, label: x })),
        ],
      },
      {
        name: "monthlyRent",
        label: "Monthly Rent (ZAR)",
        type: "number",
        required: true,
      },
      {
        name: "occupancyStatus",
        label: "Occupancy Status",
        type: "select",
        options: ["Vacant", "Maintenance", "Occupied"].map((x) => ({
          value: x,
          label: x,
        })),
      },
      {
        name: "tenantId",
        label: "Tenant (optional)",
        type: "select",
        options: [{ value: "", label: "No tenant assigned" }, ...tenants],
      },
    ];
  if (entity === "rent")
    return [
      {
        name: "unitId",
        label: "Unit",
        type: "select",
        required: true,
        options: units,
      },
      {
        name: "tenantId",
        label: "Tenant",
        type: "select",
        required: true,
        options: tenants,
      },
      { name: "month", label: "Rental month", type: "month", required: true },
      { name: "amount", label: "Amount (R)", type: "number", required: true },
      { name: "dueDate", label: "Due date", type: "date", required: true },
      {
        name: "status",
        label: "Record status",
        type: "select",
        options: ["Pending", "Paid", "Overdue"].map((x) => ({
          value: x,
          label: x,
        })),
      },
      {
        name: "paymentMethod",
        label: "Payment method",
        type: "select",
        options: [
          { value: "", label: "Not recorded" },
          { value: "EFT", label: "EFT" },
          { value: "Cash", label: "Cash" },
          {
            value: "Other electronic payment",
            label: "Other electronic payment",
          },
        ],
      },
      { name: "paidDate", label: "Recorded paid date", type: "date" },
    ];
  return [
    {
      name: "propertyId",
      label: "Property",
      type: "select",
      required: true,
      options: properties,
    },
    { name: "unitId", label: "Unit", type: "select", options: units },
    { name: "tenantId", label: "Tenant", type: "select", options: tenants },
    { name: "title", label: "Request title", required: true },
    { name: "description", label: "Description", type: "textarea", span: true },
    {
      name: "priority",
      label: "Priority",
      type: "select",
      options: ["Low", "Medium", "High"].map((x) => ({ value: x, label: x })),
    },
    {
      name: "status",
      label: "Status",
      type: "select",
      options: ["Open", "In progress", "Resolved"].map((x) => ({
        value: x,
        label: x,
      })),
    },
  ];
}
const entityTitle: Record<Entity, string> = {
  property: "property",
  unit: "unit",
  rent: "rent record",
  maintenance: "maintenance request",
};
function RecordDialog({
  entity,
  initial,
  onClose,
  onSave,
}: {
  entity: Entity;
  initial?: Record<string, unknown>;
  onClose: () => void;
  onSave: (payload: Record<string, unknown>) => Promise<string | null>;
}) {
  const { data } = useWorkspace();
  const fields = entityFields(entity, data);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const fd = new FormData(event.currentTarget);
    const result: Record<string, unknown> = {};
    fields.forEach((field) => {
      const value = String(fd.get(field.name) || "");
      if (field.type === "number")
        result[field.name] =
          entity === "unit" && field.name === "monthlyRent" && !value.trim()
            ? Number.NaN
            : value
              ? Number(value)
              : 0;
      else result[field.name] = value.trim();
    });
    const missing = fields.find(
      (field) => field.required && !String(result[field.name] ?? "").trim(),
    );
    if (missing) {
      setError(`${missing.label} is required.`);
      return;
    }
    if (
      entity === "unit" &&
      (!Number.isFinite(Number(result.monthlyRent)) ||
        Number(result.monthlyRent) < 0)
    ) {
      setError("Monthly rent must be a non-negative number.");
      return;
    }
    setSaving(true);
    const message = await onSave(result);
    setSaving(false);
    if (message) setError(message);
  }
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#17191d]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-heading"
        className="max-h-[92dvh] w-full max-w-[610px] overflow-y-auto rounded-t-2xl bg-[#fbfaf6] shadow-2xl sm:rounded-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e8e2d7] bg-[#fbfaf6] px-5 py-4 sm:px-7">
          <div>
            <div className="text-[11px] font-bold tracking-[.18em] text-[#a18a50]">
              {initial ? "UPDATE RECORD" : "ADD TO YOUR WORKSPACE"}
            </div>
            <h2
              id="form-heading"
              className="mt-1 font-display text-[25px] font-extrabold capitalize"
            >
              {initial
                ? `Edit ${entityTitle[entity]}`
                : `Add ${entityTitle[entity]}`}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg px-2.5 py-1.5 text-[14px] font-semibold text-[#77756c] hover:bg-[#efede6]"
          >
            Close
          </button>
        </div>
        <form noValidate onSubmit={submit} className="p-5 sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => (
              <label
                key={field.name}
                className={`block text-[14px] font-semibold text-[#52534c] ${field.span ? "sm:col-span-2" : ""}`}
              >
                {field.label}
                {field.type === "select" ? (
                  <select
                    name={field.name}
                    defaultValue={String(
                      initial?.[field.name] ?? field.options?.[0]?.value ?? "",
                    )}
                    required={field.required}
                    className="mt-1.5 block h-11 w-full rounded-lg border border-[#ded9cd] bg-white px-3 text-[15px] text-[#34352f]"
                  >
                    {field.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    name={field.name}
                    defaultValue={String(initial?.[field.name] ?? "")}
                    placeholder="Add useful context…"
                    rows={3}
                    className="mt-1.5 block w-full resize-y rounded-lg border border-[#ded9cd] bg-white px-3 py-2.5 text-[15px] font-normal"
                  />
                ) : (
                  <input
                    name={field.name}
                    type={field.type || "text"}
                    required={field.required}
                    min={
                      entity === "unit" && field.name === "monthlyRent"
                        ? 0
                        : undefined
                    }
                    step={
                      entity === "unit" && field.name === "monthlyRent"
                        ? "0.01"
                        : undefined
                    }
                    placeholder={field.placeholder}
                    defaultValue={String(initial?.[field.name] ?? "")}
                    className="mt-1.5 block h-11 w-full rounded-lg border border-[#ded9cd] bg-white px-3 text-[15px] font-normal text-[#34352f]"
                  />
                )}
              </label>
            ))}
          </div>
          {error && (
            <p
              role="alert"
              aria-live="assertive"
              className="mt-4 rounded-lg border border-[#e7c8c2] bg-[#fbefec] px-3 py-2.5 text-[14px] font-medium text-[#9c4f46]"
            >
              {error}
            </p>
          )}
          {entity === "property" && (
            <p className="mt-4 rounded-lg bg-[#f6f4ef] px-3 py-2.5 text-[13px] leading-relaxed text-[#766f5f]">
              Property location is recorded in South Africa. Use City
              “Rustenburg” and Province “North West” for Rustenburg properties.
            </p>
          )}
          {entity === "unit" && (
            <p className="mt-4 rounded-lg bg-[#f6f4ef] px-3 py-2.5 text-[13px] leading-relaxed text-[#766f5f]">
              Occupancy is set automatically by active tenancies. Use this form
              only to flag a vacant unit as being under maintenance.
            </p>
          )}
          {entity === "rent" && (
            <p className="mt-4 rounded-lg bg-[#f1eddf] px-3 py-2.5 text-[13px] leading-relaxed text-[#76663d]">
              This is a manual record. Saving does not process or confirm a
              payment.
            </p>
          )}
          <div className="mt-7 flex justify-end gap-2 border-t border-[#ebe6dc] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2.5 text-[15px] font-semibold text-[#6d6a61] hover:bg-[#efede6]"
            >
              Cancel
            </button>
            <button
              data-testid="button-save-record"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[#262a2d] px-5 py-2.5 text-[15px] font-bold text-[#f7f3e6] transition hover:bg-[#414344] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? "Saving…" : initial ? "Save changes" : "Save record"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
function ActionButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#262a2d] px-4 py-2.5 text-[14px] font-semibold text-[#faf7ee] shadow-sm transition hover:-translate-y-px hover:bg-[#414344] active:translate-y-0"
    >
      {children}
    </button>
  );
}
function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`surface rounded-2xl ${className}`}>{children}</section>
  );
}
function SectionHead({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5 sm:px-6">
      <div>
        <h2 className="font-display text-[18px] font-extrabold tracking-[-.02em]">
          {title}
        </h2>
        {detail && <p className="mt-1 text-[13px] text-[#8a877d]">{detail}</p>}
      </div>
      {action}
    </div>
  );
}
function formatMonth(value: string) {
  if (!value) return "—";
  const d = new Date(`${value}-01T12:00:00`);
  return d.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
}
function StatusPill({ children }: { children: string }) {
  const kind = /paid|occupied|resolved/i.test(children)
    ? "good"
    : /overdue|high/i.test(children)
      ? "bad"
      : /vacant|open|pending|maintenance/i.test(children)
        ? "warm"
        : "neutral";
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold ${kind === "good" ? "bg-[#e6f0e9] text-[#477451]" : kind === "bad" ? "bg-[#f8e6e4] text-[#a64a42]" : kind === "warm" ? "bg-[#f4eddc] text-[#8d7131]" : "bg-[#eeede9] text-[#6e6d65]"}`}
    >
      {children}
    </span>
  );
}
function MiniStat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: string;
}) {
  return (
    <Card className="relative overflow-hidden p-5">
      <div>
        <div className="text-[13px] font-bold tracking-[.12em] text-[#89867d]">
          {label}
        </div>
        <div className="mt-3 font-display text-[33px] font-extrabold tracking-[-.04em] text-[#282a25]">
          {value}
        </div>
        <div className="mt-1 text-[13px] text-[#918e84]">{sub}</div>
      </div>
      <div className="gold-rule absolute bottom-0 left-0 h-[2px] w-1/3" />
    </Card>
  );
}
function Dashboard() {
  const { data } = useWorkspace();
  const portfolio = getPortfolioSummary(data);
  const occupied = portfolio.occupiedUnits;
  const currentMonth = new Date().toISOString().slice(0, 7);
  const totalIncome = data.rent
    .filter((r) => r.month === currentMonth && r.status === "Paid")
    .reduce((a, r) => a + r.amount, 0);
  const outstanding = data.rent
    .filter((r) => r.status !== "Paid")
    .reduce((a, r) => a + r.amount, 0);
  const open = data.maintenance.filter((m) => m.status !== "Resolved");
  const monthLabel = formatMonth(currentMonth);
  const recentRent = [...data.rent]
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate))
    .slice(0, 5);
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MiniStat
          label="MONTHLY RENT COLLECTED"
          value={money(totalIncome)}
          sub={`${monthLabel} · recorded as paid`}
        />
        <MiniStat
          label="OCCUPANCY"
          value={`${portfolio.occupiedUnits} / ${portfolio.totalUnits}`}
          sub={`${portfolio.occupancyPercentage}% occupied · ${portfolio.vacantUnits} vacant · ${portfolio.maintenanceUnits} in maintenance`}
        />
        <MiniStat
          label="OUTSTANDING RENT"
          value={money(outstanding)}
          sub={`${data.rent.filter((r) => r.status !== "Paid").length} records need attention`}
        />
        <MiniStat
          label="OPEN MAINTENANCE"
          value={`${open.length}`}
          sub="Requests not yet resolved"
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
        <Card className="overflow-hidden">
          <SectionHead
            title="Rent collection"
            detail={`${monthLabel} · from saved rent records`}
            action={
              <Link
                href="/rent"
                className="flex items-center gap-1 text-[13px] font-semibold text-[#987b3e] hover:text-[#574520]"
              >
                View ledger
              </Link>
            }
          />
          <div className="mx-5 border-t border-[#eee9df] sm:mx-6" />
          <div className="flex items-end justify-between px-5 pb-5 pt-5 sm:px-6">
            <div>
              <div className="font-display text-[38px] font-bold tracking-[-.05em]">
                {money(totalIncome)}
              </div>
              <div className="mt-1 text-[13px] text-[#8b887e]">
                Collected to date · this amount is a record, not a bank
                confirmation
              </div>
            </div>
            <div className="rounded-lg bg-[#edf3ec] px-2.5 py-1.5 text-[13px] font-semibold text-[#547453]">
              {data.rent.filter((r) => r.status === "Paid").length} paid
            </div>
          </div>
          <div className="space-y-3 px-5 pb-6 sm:px-6">
            <div className="flex h-2 overflow-hidden rounded-full bg-[#f0eee8]">
              <span
                style={{
                  width: `${data.rent.length ? (data.rent.filter((r) => r.status === "Paid").length / data.rent.length) * 100 : 0}%`,
                }}
                className="rounded-full bg-[#b69a5b] transition-all"
              />
            </div>
            <div className="flex justify-between text-[13px] text-[#8b887e]">
              <span>Recorded paid</span>
              <span>
                {data.rent.length
                  ? Math.round(
                      (data.rent.filter((r) => r.status === "Paid").length /
                        data.rent.length) *
                        100,
                    )
                  : 0}
                % of monthly records
              </span>
            </div>
          </div>
        </Card>
        <Card>
          <SectionHead
            title="Portfolio at a glance"
            detail="Properties and rental inventory"
          />
          <div className="mx-5 border-t border-[#eee9df] sm:mx-6" />
          <div className="grid grid-cols-2 gap-y-5 p-5 sm:grid-cols-3 sm:px-6">
            <div>
              <div className="font-display text-[30px] font-bold">
                {portfolio.propertyCount.toString().padStart(2, "0")}
              </div>
              <div className="mt-1 text-[13px] text-[#89867d]">Properties</div>
            </div>
            <div>
              <div className="font-display text-[30px] font-bold">
                {portfolio.totalUnits.toString().padStart(2, "0")}
              </div>
              <div className="mt-1 text-[13px] text-[#89867d]">
                Rental units
              </div>
            </div>
            <div>
              <div className="font-display text-[30px] font-bold">
                {portfolio.occupiedUnits.toString().padStart(2, "0")}
              </div>
              <div className="mt-1 text-[13px] text-[#89867d]">
                Occupied units
              </div>
            </div>
            <div>
              <div className="font-display text-[30px] font-bold">
                {portfolio.vacantUnits.toString().padStart(2, "0")}
              </div>
              <div className="mt-1 text-[13px] text-[#89867d]">
                Vacant units
              </div>
            </div>
            <div>
              <div className="font-display text-[30px] font-bold">
                {portfolio.maintenanceUnits.toString().padStart(2, "0")}
              </div>
              <div className="mt-1 text-[13px] text-[#89867d]">
                Units in maintenance
              </div>
            </div>
            <div>
              <div className="font-display text-[30px] font-bold text-[#a07e39]">
                {portfolio.occupancyPercentage}%
              </div>
              <div className="mt-1 text-[13px] text-[#89867d]">
                Occupancy rate
              </div>
            </div>
          </div>
          <div className="mx-5 mb-5 rounded-lg bg-[#f6f4ef] p-3 text-[13px] leading-relaxed text-[#77746a] sm:mx-6">
            <span className="font-bold text-[#5b574d]">Portfolio snapshot</span>
            <br />
            Totals are calculated from the records saved in your account.
          </div>
        </Card>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.35fr_.85fr]">
        <Card className="overflow-hidden">
          <SectionHead
            title="Recent rent records"
            detail="Latest updates in your ledger"
            action={
              <Link
                href="/rent"
                className="text-[13px] font-semibold text-[#987b3e]"
              >
                Open rent ledger
              </Link>
            }
          />
          {recentRent.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[550px] text-left">
                <thead>
                  <tr className="border-y border-[#eee9df] bg-[#fbfaf7] text-[11px] font-bold tracking-[.08em] text-[#929087]">
                    <th className="px-6 py-3">TENANT / UNIT</th>
                    <th className="px-4 py-3">MONTH</th>
                    <th className="px-4 py-3">AMOUNT</th>
                    <th className="px-6 py-3">STATUS</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRent.map((r) => (
                    <tr
                      key={r.id}
                      className="border-b border-[#f0ede6] last:border-0"
                    >
                      <td className="px-6 py-3">
                        <div className="text-[14px] font-semibold">
                          {data.tenants.find((t) => t.id === r.tenantId)
                            ?.fullName || "Unassigned tenant"}
                        </div>
                        <div className="mt-1 text-[11px] text-[#89867d]">
                          {data.units.find((u) => u.id === r.unitId)?.number ||
                            "Unit removed"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[#716f66]">
                        {formatMonth(r.month)}
                      </td>
                      <td className="px-4 py-3 text-[14px] font-semibold">
                        {money(r.amount)}
                      </td>
                      <td className="px-6 py-3">
                        <StatusPill>{r.status}</StatusPill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No rent records yet"
              text="Add a rent record to start your monthly ledger."
            />
          )}
        </Card>
        <Card>
          <SectionHead
            title="Needs attention"
            detail="A short list of what is still open"
          />
          {open.length ? (
            <div className="divide-y divide-[#f0ede6]">
              {open.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-start gap-3 px-5 py-4">
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.priority === "High" ? "bg-[#a54c42]" : "bg-[#b79850]"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold">
                      {item.title}
                    </div>
                    <div className="mt-1 truncate text-[11px] text-[#8a877d]">
                      {data.properties.find((p) => p.id === item.propertyId)
                        ?.name || "Property"}{" "}
                      · {item.createdAt}
                    </div>
                  </div>
                  <StatusPill>{item.status}</StatusPill>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="All caught up"
              text="There are no unresolved maintenance requests."
            />
          )}
          <div className="border-t border-[#eee9df] px-5 py-3">
            <Link
              href="/maintenance"
              className="text-[13px] font-semibold text-[#987b3e]"
            >
              View maintenance requests →
            </Link>
          </div>
        </Card>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <QuickLink
          href="/properties"
          title="Add a property"
          copy="Record a new address"
        />
        <QuickLink
          href="/units"
          title="Add a unit"
          copy="Set rent and occupancy"
        />
        <QuickLink
          href="/rent"
          title="Add rent record"
          copy="Update the monthly ledger"
        />
      </div>
    </div>
  );
}
function QuickLink({
  href,
  title,
  copy,
}: {
  href: string;
  title: string;
  copy: string;
}) {
  return (
    <Link
      href={href}
      className="surface group flex items-center gap-3 rounded-xl p-4 transition hover:-translate-y-0.5 hover:border-[#c8b67f]"
    >
      <span className="flex-1">
        <span className="block text-[14px] font-bold">{title}</span>
        <span className="mt-1 block text-[11px] text-[#8a877d]">{copy}</span>
      </span>
      <span
        aria-hidden="true"
        className="text-[14px] text-[#aaa69a] transition group-hover:text-[#92743b]"
      >
        →
      </span>
    </Link>
  );
}
function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      <div className="font-display text-[18px] font-bold">{title}</div>
      <p className="mt-1 max-w-xs text-[14px] leading-relaxed text-[#89867d]">
        {text}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
const entityEndpoint: Record<Entity, string> = {
  property: "/properties",
  unit: "/units",
  rent: "/rent",
  maintenance: "/maintenance",
};
function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
function useEntityActions(entity: Entity) {
  const { data, run } = useWorkspace();
  const [dialog, setDialog] = useState<{
    initial?: Record<string, unknown>;
  } | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const endpoint = entityEndpoint[entity];
  async function save(
    payload: Record<string, unknown>,
  ): Promise<string | null> {
    const isEdit = Boolean(dialog?.initial?.id);
    const id = String(dialog?.initial?.id ?? "");
    const error = await run(
      isEdit ? `${endpoint}/${id}` : endpoint,
      isEdit ? "PATCH" : "POST",
      payload,
    );
    if (error) return error;
    setDialog(null);
    setSuccessMessage(
      `${capitalize(entityTitle[entity])} ${isEdit ? "updated" : "added"}.`,
    );
    return null;
  }
  async function remove(id: string) {
    if (
      !window.confirm(
        `Delete this ${entityTitle[entity]}? This cannot be undone.`,
      )
    )
      return;
    const error = await run(`${endpoint}/${id}`, "DELETE");
    if (error) {
      window.alert(error);
      return;
    }
    setSuccessMessage(`${capitalize(entityTitle[entity])} deleted.`);
  }
  return { data, dialog, setDialog, save, remove, successMessage, run };
}
function SuccessNotice({ message }: { message: string }) {
  return message ? (
    <div
      role="status"
      aria-live="polite"
      className="mb-4 rounded-xl border border-[#d1dfd1] bg-[#edf4ed] px-4 py-3 text-[14px] font-medium text-[#48654b]"
    >
      {message}
    </div>
  ) : null;
}
function SearchFilter({
  search,
  setSearch,
  filter,
  setFilter,
  options,
}: {
  search: string;
  setSearch: (x: string) => void;
  filter: string;
  setFilter: (x: string) => void;
  options?: string[];
}) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row">
      <label className="min-w-0 flex-1">
        <input
          data-testid="input-search-records"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search records…"
          className="h-10 w-full rounded-lg border border-[#e3ded3] bg-white px-3 text-[14px] outline-none focus:border-[#bba365]"
        />
      </label>
      {options && (
        <label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-10 min-w-[145px] appearance-none rounded-lg border border-[#e3ded3] bg-white px-3 pr-8 text-[14px] text-[#66645c]"
          >
            {options.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
function TableShell({
  children,
  title,
  detail,
  action,
}: {
  children: ReactNode;
  title: string;
  detail: string;
  action: ReactNode;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:px-6">
        <div>
          <h2 className="font-display text-[18px] font-extrabold">{title}</h2>
          <p className="mt-1 text-[13px] text-[#89867d]">{detail}</p>
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}
function Properties() {
  const { data, dialog, setDialog, save, remove, successMessage } =
    useEntityActions("property");
  const [search, setSearch] = useState("");
  const items = data.properties.filter((p) =>
    `${p.name} ${p.address} ${p.suburb} ${p.city} ${p.province}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <SuccessNotice message={successMessage} />
      <TableShell
        title={`${data.properties.length} ${data.properties.length === 1 ? "property" : "properties"}`}
        detail="Property records in your portfolio"
        action={
          <>
            <SearchFilter
              search={search}
              setSearch={setSearch}
              filter=""
              setFilter={() => {}}
            />
            <ActionButton onClick={() => setDialog({})}>
              Add Property
            </ActionButton>
          </>
        }
      >
        {items.length ? (
          <div className="grid gap-3 border-t border-[#eee9df] p-4 sm:grid-cols-2 xl:grid-cols-3 sm:p-5">
            {items.map((p) => (
              <article
                key={p.id}
                className="rounded-xl border border-[#ebe6dc] bg-[#fffefa] p-4 transition hover:border-[#cdbb87]"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-bold uppercase tracking-[.14em] text-[#a18a50]">
                    Property
                  </span>
                  <RowMenu
                    onEdit={() => setDialog({ initial: { ...p } })}
                    onDelete={() => remove(p.id)}
                  />
                </div>
                <h3 className="mt-3 font-display text-[18px] font-extrabold">
                  {p.name}
                </h3>
                <p className="mt-1 text-[13px] text-[#807d73]">{p.type}</p>
                <div className="mt-3 border-t border-[#efebe2] pt-3 text-[13px] leading-relaxed text-[#6f6c63]">
                  {p.address}
                  <br />
                  {[p.suburb, p.city, p.province, "South Africa", p.postalCode]
                    .filter(Boolean)
                    .join(", ")}
                </div>
                {p.description && (
                  <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#89867d]">
                    {p.description}
                  </p>
                )}
                <div className="mt-3 flex items-center justify-between text-[11px] text-[#99958a]">
                  <span>
                    {data.units.filter((u) => u.propertyId === p.id).length}{" "}
                    units
                  </span>
                  <span>{p.province}</span>
                </div>
              </article>
            ))}
          </div>
        ) : data.properties.length === 0 ? (
          <EmptyState
            title="Your portfolio starts here"
            text="Add your first property and keep its address and details together."
            action={
              <ActionButton onClick={() => setDialog({})}>
                Add Property
              </ActionButton>
            }
          />
        ) : (
          <EmptyState
            title="No matching properties"
            text="Try a different search term."
          />
        )}
      </TableShell>
      {dialog && (
        <RecordDialog
          entity="property"
          initial={dialog.initial}
          onClose={() => setDialog(null)}
          onSave={save}
        />
      )}
    </>
  );
}
function Units() {
  const { data, dialog, setDialog, save, remove, successMessage, run } =
    useEntityActions("unit");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const items = data.units.filter(
    (u) =>
      (filter === "All statuses" || u.occupancyStatus === filter) &&
      `${u.number} ${u.type} ${data.properties.find((p) => p.id === u.propertyId)?.name}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  async function quickStatus(unit: Unit) {
    const next =
      unit.occupancyStatus === "Maintenance" ? "Vacant" : "Maintenance";
    const error = await run(`/units/${unit.id}`, "PATCH", {
      occupancyStatus: next,
    });
    if (error) window.alert(error);
  }
  return (
    <>
      <SuccessNotice message={successMessage} />
      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="font-display text-[18px] font-extrabold">
              {data.units.length} rental units
            </h2>
            <p className="mt-1 text-[13px] text-[#89867d]">
              Monthly rent, property association and occupancy
            </p>
            {!data.properties.length && (
              <p className="mt-2 text-[13px] font-medium text-[#9b594e]">
                Add a property before creating a unit.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchFilter
              search={search}
              setSearch={setSearch}
              filter={filter}
              setFilter={setFilter}
              options={["All statuses", "Vacant", "Occupied", "Maintenance"]}
            />
            <ActionButton onClick={() => setDialog({})}>Add Unit</ActionButton>
          </div>
        </div>
        {items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-y border-[#eee9df] bg-[#fbfaf7] text-[11px] font-bold tracking-[.08em] text-[#929087]">
                  <th className="px-6 py-3">UNIT</th>
                  <th className="px-4 py-3">PROPERTY</th>
                  <th className="px-4 py-3">TYPE</th>
                  <th className="px-4 py-3">MONTHLY RENT</th>
                  <th className="px-4 py-3">OCCUPANCY</th>
                  <th className="px-6 py-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {items.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-[#f0ede6] last:border-0 hover:bg-[#fcfbf8]"
                  >
                    <td className="px-6 py-4">
                      <div className="text-[14px] font-semibold">
                        {u.number}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-[#969287]">
                        {data.tenants.find((t) => t.id === u.tenantId)
                          ?.fullName || "No tenant assigned"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[13px] text-[#625f57]">
                      {data.properties.find((p) => p.id === u.propertyId)
                        ?.name || "Unlinked property"}
                    </td>
                    <td className="px-4 py-4 text-[13px] text-[#77746b]">
                      {u.type}
                    </td>
                    <td className="px-4 py-4 text-[14px] font-semibold">
                      {money(u.monthlyRent)}
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill>{u.occupancyStatus}</StatusPill>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {u.occupancyStatus !== "Occupied" && (
                          <button
                            onClick={() => void quickStatus(u)}
                            className="text-[11px] font-semibold text-[#92733b] hover:underline"
                          >
                            {u.occupancyStatus === "Maintenance"
                              ? "Mark vacant"
                              : "Mark maintenance"}
                          </button>
                        )}
                        <RowMenu
                          onEdit={() =>
                            setDialog({
                              initial: {
                                ...u,
                                monthlyRent: String(u.monthlyRent),
                              },
                            })
                          }
                          onDelete={() => remove(u.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No units to show"
            text={
              data.properties.length
                ? "Add a rental unit and connect it to a property."
                : "Add a property first, then connect rental units to it."
            }
          />
        )}
      </Card>
      {dialog && (
        <RecordDialog
          entity="unit"
          initial={dialog.initial}
          onClose={() => setDialog(null)}
          onSave={save}
        />
      )}
    </>
  );
}
function Tenants() {
  const { data, run } = useWorkspace();
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"saved" | "error">("saved");
  const currentTenancies = data.tenancies;
  const rows: TenantWorkspaceRow[] = data.tenants.map((tenant) => {
    const tenancy = getPrimaryTenancy(data, tenant.id) ?? null;
    const unit = tenancy
      ? data.units.find((item) => item.id === tenancy.unitId)
      : undefined;
    const property = tenancy
      ? data.properties.find((item) => item.id === tenancy.propertyId)
      : undefined;
    return {
      id: tenant.id,
      firstName: tenant.firstName,
      lastName: tenant.lastName,
      phone: tenant.privateProfile.phoneNumber,
      propertyLabel: property?.name ?? "",
      unitLabel: unit?.number ?? "",
      status: getTenantStatus(data, tenant.id),
      currentTenancyStatus: tenancy?.status ?? null,
      monthlyRent: tenancy?.monthlyRent,
      profile: tenant.privateProfile,
      tenancy,
    };
  });
  async function saveTenant(
    payload: TenantWorkspaceSavePayload,
  ): Promise<string | null> {
    const isEdit = Boolean(payload.tenantId);
    const body = {
      firstName: payload.profile.firstName,
      lastName: payload.profile.lastName,
      privateProfile: payload.profile.privateProfile,
      tenancy: {
        propertyId: payload.tenancy.propertyId,
        unitId: payload.tenancy.unitId,
        moveInDate: payload.tenancy.moveInDate,
        leaseStart: payload.tenancy.leaseStart,
        leaseEnd: payload.tenancy.leaseEnd,
        monthlyRent: payload.tenancy.monthlyRent,
        depositAmount: payload.tenancy.depositAmount,
        paymentDueDay: payload.tenancy.paymentDueDay,
        status: payload.tenancy.status,
      },
      ...(payload.tenancyId ? { tenancyId: payload.tenancyId } : {}),
    };
    const error = await run(
      isEdit ? `/tenants/${payload.tenantId}` : "/tenants",
      isEdit ? "PATCH" : "POST",
      body,
    );
    setMessageType(error ? "error" : "saved");
    setMessage(error ?? `Tenant ${isEdit ? "updated" : "added"}.`);
    return error;
  }
  async function endTenancy(tenantId: string) {
    const current = getPrimaryTenancy(data, tenantId);
    if (!current) return;
    const error = await run(`/tenancies/${current.id}/end`, "POST");
    setMessageType(error ? "error" : "saved");
    setMessage(error ?? "Tenancy ended and its unit was freed.");
  }
  return (
    <TenantWorkspace
      rows={rows}
      properties={data.properties}
      units={data.units}
      currentTenancies={currentTenancies}
      onSave={saveTenant}
      onEndTenancy={endTenancy}
      message={message}
      messageType={messageType}
    />
  );
}
function Rent() {
  const { data, dialog, setDialog, save, remove, run } =
    useEntityActions("rent");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const items = data.rent.filter(
    (r) =>
      (filter === "All statuses" || r.status === filter) &&
      `${data.tenants.find((t) => t.id === r.tenantId)?.fullName} ${data.units.find((u) => u.id === r.unitId)?.number} ${r.month}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const paid = items
    .filter((r) => r.status === "Paid")
    .reduce((a, r) => a + r.amount, 0);
  async function markPaid(r: RentRecord) {
    const error = await run(`/rent/${r.id}`, "PATCH", {
      status: "Paid",
      paidDate: new Date().toISOString().slice(0, 10),
    });
    if (error) window.alert(error);
  }
  return (
    <>
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <MiniStat
          label="RECORDED AS PAID"
          value={money(paid)}
          sub="Filtered records · not bank verified"
        />
        <MiniStat
          label="PENDING"
          value={money(
            items
              .filter((r) => r.status === "Pending")
              .reduce((a, r) => a + r.amount, 0),
          )}
          sub={`${items.filter((r) => r.status === "Pending").length} rent records`}
        />
        <MiniStat
          label="OVERDUE"
          value={money(
            items
              .filter((r) => r.status === "Overdue")
              .reduce((a, r) => a + r.amount, 0),
          )}
          sub={`${items.filter((r) => r.status === "Overdue").length} rent records`}
        />
      </div>
      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="font-display text-[18px] font-extrabold">
              Rental ledger
            </h2>
            <p className="mt-1 text-[13px] text-[#89867d]">
              Manual records only · no payments are processed here
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchFilter
              search={search}
              setSearch={setSearch}
              filter={filter}
              setFilter={setFilter}
              options={["All statuses", "Paid", "Pending", "Overdue"]}
            />
            <ActionButton onClick={() => setDialog({})}>
              Add rent record
            </ActionButton>
          </div>
        </div>
        {items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left">
              <thead>
                <tr className="border-y border-[#eee9df] bg-[#fbfaf7] text-[11px] font-bold tracking-[.08em] text-[#929087]">
                  <th className="px-6 py-3">TENANT / UNIT</th>
                  <th className="px-4 py-3">RENTAL MONTH</th>
                  <th className="px-4 py-3">DUE DATE</th>
                  <th className="px-4 py-3">AMOUNT</th>
                  <th className="px-4 py-3">METHOD</th>
                  <th className="px-4 py-3">STATUS</th>
                  <th className="px-6 py-3">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-[#f0ede6] last:border-0"
                  >
                    <td className="px-6 py-4">
                      <div className="text-[14px] font-semibold">
                        {data.tenants.find((t) => t.id === r.tenantId)
                          ?.fullName || "Unassigned tenant"}
                      </div>
                      <div className="mt-1 text-[11px] text-[#89867d]">
                        {data.units.find((u) => u.id === r.unitId)?.number ||
                          "Unassigned unit"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[13px]">
                      {formatMonth(r.month)}
                    </td>
                    <td className="px-4 py-4 text-[13px] text-[#77746b]">
                      {r.dueDate || "—"}
                    </td>
                    <td className="px-4 py-4 text-[14px] font-semibold">
                      {money(r.amount)}
                    </td>
                    <td className="px-4 py-4 text-[13px] text-[#77746b]">
                      {r.paymentMethod || "—"}
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill>{r.status}</StatusPill>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        {r.status !== "Paid" && (
                          <button
                            onClick={() => markPaid(r)}
                            title="Record as paid (local note only)"
                            className="text-[11px] font-semibold text-[#8b7137] hover:underline"
                          >
                            Record paid
                          </button>
                        )}
                        <RowMenu
                          onEdit={() =>
                            setDialog({
                              initial: { ...r, amount: String(r.amount) },
                            })
                          }
                          onDelete={() => remove(r.id)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No rent records found"
            text="Add a monthly rent record to start tracking payment status."
          />
        )}
        <div className="border-t border-[#eee9df] bg-[#fbfaf7] px-5 py-3 text-[11px] text-[#8c7950] sm:px-6">
          Payment status reflects a landlord-entered record only. Jump PropTech
          does not move or confirm money.
        </div>
      </Card>
      {dialog && (
        <RecordDialog
          entity="rent"
          initial={dialog.initial}
          onClose={() => setDialog(null)}
          onSave={save}
        />
      )}
    </>
  );
}
function Maintenance() {
  const { data, dialog, setDialog, save, remove, run } =
    useEntityActions("maintenance");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All statuses");
  const items = data.maintenance.filter(
    (m) =>
      (filter === "All statuses" || m.status === filter) &&
      `${m.title} ${data.properties.find((p) => p.id === m.propertyId)?.name} ${m.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  async function stepStatus(m: MaintenanceRequest) {
    const next =
      m.status === "Open"
        ? "In progress"
        : m.status === "In progress"
          ? "Resolved"
          : "Open";
    const error = await run(`/maintenance/${m.id}`, "PATCH", {
      status: next,
    });
    if (error) window.alert(error);
  }
  return (
    <>
      <Card className="overflow-hidden">
        <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:px-6">
          <div>
            <h2 className="font-display text-[18px] font-extrabold">
              Maintenance requests
            </h2>
            <p className="mt-1 text-[13px] text-[#89867d]">
              Track a request through its current status
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SearchFilter
              search={search}
              setSearch={setSearch}
              filter={filter}
              setFilter={setFilter}
              options={["All statuses", "Open", "In progress", "Resolved"]}
            />
            <ActionButton onClick={() => setDialog({})}>
              Add request
            </ActionButton>
          </div>
        </div>
        {items.length ? (
          <div className="divide-y divide-[#eee9df] border-t border-[#eee9df]">
            {items.map((m) => (
              <article
                key={m.id}
                className="flex flex-col gap-4 p-5 transition hover:bg-[#fdfcf9] sm:flex-row sm:items-start sm:px-6"
              >
                <span
                  className={`mt-1 h-12 w-1 shrink-0 rounded-full ${m.priority === "High" ? "bg-[#aa574c]" : m.priority === "Medium" ? "bg-[#b79850]" : "bg-[#7d9276]"}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-[16px] font-extrabold">
                      {m.title}
                    </h3>
                    <StatusPill>{m.priority}</StatusPill>
                    <StatusPill>{m.status}</StatusPill>
                  </div>
                  <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-[#76736a]">
                    {m.description || "No description provided."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[#969287]">
                    <span>
                      {data.properties.find((p) => p.id === m.propertyId)
                        ?.name || "Property not assigned"}
                    </span>
                    <span>
                      {data.units.find((u) => u.id === m.unitId)?.number ||
                        "Unit not assigned"}
                    </span>
                    <span>{m.createdAt}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:pt-1">
                  <button
                    onClick={() => stepStatus(m)}
                    className="text-[13px] font-semibold text-[#91743b] hover:underline"
                  >
                    {m.status === "Open"
                      ? "Start work"
                      : m.status === "In progress"
                        ? "Mark resolved"
                        : "Reopen"}
                  </button>
                  <RowMenu
                    onEdit={() => setDialog({ initial: { ...m } })}
                    onDelete={() => remove(m.id)}
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No maintenance requests"
            text="Capture a repair or upkeep request when something needs attention."
            action={
              <ActionButton onClick={() => setDialog({})}>
                Add request
              </ActionButton>
            }
          />
        )}
      </Card>
      {dialog && (
        <RecordDialog
          entity="maintenance"
          initial={dialog.initial}
          onClose={() => setDialog(null)}
          onSave={save}
        />
      )}
    </>
  );
}
function Reports() {
  const { data } = useWorkspace();
  const portfolio = getPortfolioSummary(data);
  const paid = data.rent
      .filter((r) => r.status === "Paid")
      .reduce((sum, r) => sum + r.amount, 0),
    outstanding = data.rent
      .filter((r) => r.status !== "Paid")
      .reduce((sum, r) => sum + r.amount, 0),
    expected = data.units.reduce((sum, u) => sum + u.monthlyRent, 0);
  const months = Array.from({ length: 6 }, (_, i) => {
    const dt = new Date();
    dt.setMonth(dt.getMonth() - 5 + i);
    const key = dt.toISOString().slice(0, 7);
    return {
      key,
      label: dt.toLocaleDateString("en-ZA", { month: "short" }),
      amount: data.rent
        .filter((r) => r.month === key && r.status === "Paid")
        .reduce((sum, r) => sum + r.amount, 0),
    };
  });
  const max = Math.max(...months.map((month) => month.amount), 1),
    occupiedShare = data.units.length
      ? (portfolio.occupiedUnits / data.units.length) * 100
      : 0,
    maintenanceShare = data.units.length
      ? (portfolio.maintenanceUnits / data.units.length) * 100
      : 0;
  const byProperty = data.properties.map((property) => {
    const units = data.units.filter((unit) => unit.propertyId === property.id);
    return {
      property,
      units,
      occupied: units.filter((unit) => unit.occupancyStatus === "Occupied")
        .length,
      rent: units.reduce((sum, unit) => sum + unit.monthlyRent, 0),
    };
  });
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-[#23272a] p-5 text-[#f5f0e3] sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <div className="text-[11px] font-bold tracking-[.18em] text-[#c9ad67]">
              CURRENT RENTAL SNAPSHOT
            </div>
            <h2 className="mt-2 font-display text-[30px] font-extrabold tracking-[-.04em]">
              Numbers that keep you grounded.
            </h2>
            <p className="mt-1 text-[13px] text-white/55">
              Calculated from your current local records · no bank data
              connected
            </p>
          </div>
          <div className="text-left sm:text-right">
            <div className="font-display text-[38px] font-bold text-[#e3cc91]">
              {money(expected)}
            </div>
            <div className="mt-1 text-[11px] text-white/55">
              Potential monthly rent across all units
            </div>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 sm:grid-cols-4">
          <div>
            <div className="text-[11px] tracking-[.1em] text-white/45">
              RECORDED PAID
            </div>
            <div className="mt-1 text-[21px] font-bold">{money(paid)}</div>
          </div>
          <div>
            <div className="text-[11px] tracking-[.1em] text-white/45">
              OUTSTANDING
            </div>
            <div className="mt-1 text-[21px] font-bold">
              {money(outstanding)}
            </div>
          </div>
          <div>
            <div className="text-[11px] tracking-[.1em] text-white/45">
              OCCUPANCY
            </div>
            <div className="mt-1 text-[21px] font-bold">
              {portfolio.occupancyPercentage}%
            </div>
          </div>
          <div>
            <div className="text-[11px] tracking-[.1em] text-white/45">
              OPEN REQUESTS
            </div>
            <div className="mt-1 text-[21px] font-bold">
              {
                data.maintenance.filter(
                  (request) => request.status !== "Resolved",
                ).length
              }
            </div>
          </div>
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <Card>
          <SectionHead
            title="Recorded rent · last 6 months"
            detail="Paid rent records, grouped by rental month"
          />
          <div className="flex h-[210px] items-end gap-3 px-5 pb-5 pt-6 sm:gap-5 sm:px-7">
            {months.map((month) => (
              <div
                key={month.key}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <div className="text-[12px] text-[#8b887e]">
                  {month.amount ? money(month.amount) : "—"}
                </div>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className={`w-full rounded-t-md transition-all ${month.amount ? "bg-[#bda461]" : "bg-[#efede7]"}`}
                    style={{
                      height: `${month.amount ? Math.max(10, (month.amount / max) * 100) : 4}%`,
                    }}
                  />
                </div>
                <div className="text-[11px] font-semibold text-[#79766e]">
                  {month.label}
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <SectionHead
            title="Occupancy mix"
            detail="Occupied, vacant and maintenance statuses"
          />
          <div className="px-5 pb-6 sm:px-6">
            <div className="my-4 flex items-center gap-4">
              <div
                className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
                style={{
                  background: `conic-gradient(#bda461 0 ${occupiedShare}%, #cfc4a8 ${occupiedShare}% ${occupiedShare + maintenanceShare}%, #ece9e0 ${occupiedShare + maintenanceShare}% 100%)`,
                }}
              >
                <div className="flex h-[82px] w-[82px] flex-col items-center justify-center rounded-full bg-white">
                  <span className="font-display text-[25px] font-bold">
                    {portfolio.occupancyPercentage}%
                  </span>
                  <span className="text-[11px] text-[#89867d]">occupied</span>
                </div>
              </div>
              <div className="min-w-0 flex-1 space-y-3">
                <div className="flex items-center gap-2 text-[13px]">
                  <i className="h-2 w-2 rounded-full bg-[#bda461]" />
                  <span>Occupied</span>
                  <strong className="ml-auto">{portfolio.occupiedUnits}</strong>
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  <i className="h-2 w-2 rounded-full bg-[#ece9e0]" />
                  <span>Vacant</span>
                  <strong className="ml-auto">{portfolio.vacantUnits}</strong>
                </div>
                <div className="flex items-center gap-2 text-[13px]">
                  <i className="h-2 w-2 rounded-full bg-[#cfc4a8]" />
                  <span>Maintenance</span>
                  <strong className="ml-auto">
                    {portfolio.maintenanceUnits}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
      <Card className="overflow-hidden">
        <SectionHead
          title="Property performance"
          detail="Rental capacity and occupied units by property"
        />
        {byProperty.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left">
              <thead>
                <tr className="border-y border-[#eee9df] bg-[#fbfaf7] text-[11px] font-bold tracking-[.08em] text-[#929087]">
                  <th className="px-6 py-3">PROPERTY</th>
                  <th className="px-4 py-3">UNITS</th>
                  <th className="px-4 py-3">OCCUPANCY</th>
                  <th className="px-6 py-3">MONTHLY RENT POTENTIAL</th>
                </tr>
              </thead>
              <tbody>
                {byProperty.map(({ property, units, occupied, rent }) => (
                  <tr
                    key={property.id}
                    className="border-b border-[#f0ede6] last:border-0"
                  >
                    <td className="px-6 py-4 text-[14px] font-semibold">
                      {property.name}
                    </td>
                    <td className="px-4 py-4 text-[13px]">{units.length}</td>
                    <td className="px-4 py-4 text-[13px]">
                      {occupied} of {units.length}
                    </td>
                    <td className="px-6 py-4 text-[14px] font-semibold">
                      {money(rent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="No properties to report on"
            text="Add properties and units to see portfolio summaries."
          />
        )}
      </Card>
      <p className="text-[11px] leading-relaxed text-[#939086]">
        Reports are derived from the records saved in your account and are not
        accounting, payment settlement, or bank statements.
      </p>
    </div>
  );
}
function SettingsPage() {
  const { data, run, signOut, pending } = useWorkspace();
  const [saved, setSaved] = useState("");
  const [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved("");
    setError("");
    const fd = new FormData(e.currentTarget);
    const message = await run("/profile", "PATCH", {
      name: String(fd.get("name") || ""),
      email: String(fd.get("email") || ""),
      phone: String(fd.get("phone") || ""),
      company: String(fd.get("company") || ""),
    });
    if (message) {
      setError(message);
      return;
    }
    setSaved("Profile saved to your account.");
  }
  async function clearAll() {
    if (
      !window.confirm(
        "Delete every property, unit, tenant, tenancy, rent record and maintenance request in this account? This cannot be undone.",
      )
    )
      return;
    setError("");
    setSaved("");
    const message = await run("/workspace", "DELETE");
    if (message) setError(message);
    else setSaved("All portfolio records deleted.");
  }
  const counts = [
    data.properties.length,
    data.units.length,
    data.tenants.length,
    data.rent.length,
    data.maintenance.length,
  ];
  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
      <Card className="p-5 sm:p-7">
        <div className="mb-5">
          <div className="text-[11px] font-bold tracking-[.18em] text-[#a18a50]">
            PROFILE
          </div>
          <h2 className="mt-1 font-display text-[23px] font-extrabold">
            Your workspace details
          </h2>
          <p className="mt-1 text-[13px] text-[#89867d]">
            Profile information is saved to your account on this server.
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {[
            {
              name: "name",
              label: "Full name",
              value: data.user.fullName,
              type: "text",
            },
            {
              name: "email",
              label: "Email address",
              value: data.user.email,
              type: "email",
            },
            {
              name: "phone",
              label: "Phone number",
              value: data.user.phone,
              type: "tel",
            },
            {
              name: "company",
              label: "Business / workspace name",
              value: data.user.company,
              type: "text",
            },
          ].map((f) => (
            <label
              key={f.name}
              className="block text-[14px] font-semibold text-[#52534c]"
            >
              {f.label}
              <input
                name={f.name}
                type={f.type}
                defaultValue={f.value}
                className="mt-1.5 h-11 w-full rounded-lg border border-[#ded9cd] bg-white px-3 text-[15px] font-normal"
              />
            </label>
          ))}
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-[#e7c8c2] bg-[#fbefec] px-3 py-2.5 text-[13px] font-medium text-[#9c4f46]"
            >
              {error}
            </p>
          )}
          <div className="flex items-center justify-between border-t border-[#eee9df] pt-4">
            <span className="text-[13px] text-[#658061]">{saved}</span>
            <button
              disabled={pending}
              className="inline-flex items-center gap-2 rounded-lg bg-[#262a2d] px-5 py-2.5 text-[14px] font-bold text-[#f7f3e6] hover:bg-[#414344] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save profile"}
            </button>
          </div>
        </form>
      </Card>
      <div className="space-y-5">
        <Card className="p-5 sm:p-6">
          <div className="text-[11px] font-bold tracking-[.18em] text-[#a18a50]">
            YOUR ACCOUNT
          </div>
          <h2 className="mt-1 font-display text-[23px] font-extrabold">
            Records in this workspace
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[#89867d]">
            Signed in as {data.user.email}. Your records are stored in the
            PostgreSQL database behind this server.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            {[
              "Properties",
              "Units",
              "Tenants",
              "Rent records",
              "Maintenance",
            ].map((name, i) => (
              <div
                key={name}
                className="flex justify-between rounded-lg bg-[#f6f4ef] px-3 py-2.5 text-[13px]"
              >
                <span className="text-[#716e65]">{name}</span>
                <strong>{counts[i]}</strong>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-[#e5dfd1] bg-[#fbfaf7] p-3 text-[11px] leading-relaxed text-[#77746a]">
            New accounts start empty. Nothing is seeded and no sample portfolio
            is loaded.
          </div>
          <button
            onClick={() => void signOut()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#ded9cd] px-3 py-2.5 text-[13px] font-semibold text-[#5f5c54] hover:bg-[#f4f1e9]"
          >
            Sign out
          </button>
        </Card>
        <Card className="p-5 sm:p-6">
          <div className="text-[11px] font-bold tracking-[.18em] text-[#a18a50]">
            DATA CONTROLS
          </div>
          <h2 className="mt-1 font-display text-[23px] font-extrabold">
            Reset your workspace
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-[#89867d]">
            Delete every portfolio record in this account. Your login stays
            active.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => void clearAll()}
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[#e3d5d0] px-3 py-2.5 text-[13px] font-semibold text-[#9e554e] hover:bg-[#faf0ed] disabled:cursor-not-allowed disabled:opacity-60"
            >
              Delete all records
            </button>
          </div>
        </Card>
        <Card className="p-5">
          <div className="text-[11px] font-bold uppercase tracking-[.16em] text-[#a18a50]">
            About
          </div>
          <div className="mt-2 text-[14px] font-bold">Jump PropTech</div>
          <p className="mt-1 text-[13px] leading-relaxed text-[#89867d]">
            Smarter Property Management. Stronger Communities. Records are kept
            per account and protected by email and password sign-in.
          </p>
        </Card>
      </div>
    </div>
  );
}
function RowMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={onEdit}
        className="rounded-md px-2 py-1 text-[11px] font-semibold text-[#827044] hover:bg-[#f4efdf]"
      >
        Edit
      </button>
      <button
        onClick={onDelete}
        aria-label="Delete record"
        className="rounded-md px-2 py-1 text-[11px] font-semibold text-[#a35f56] hover:bg-[#faefec]"
      >
        Delete
      </button>
    </div>
  );
}
function BootScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f5ef]">
      <div className="flex flex-col items-center gap-4">
        <div className="font-display text-[32px] font-extrabold tracking-[-.04em] text-[#252821]">
          jump<span className="text-[#b79850]">.</span>
        </div>
        <div className="text-[14px] font-medium text-[#77746b]">
          Connecting to your workspace…
        </div>
        <div className="h-[2px] w-32 overflow-hidden rounded-full bg-[#e5dfd1]">
          <span className="block h-full w-1/2 animate-pulse rounded-full bg-[#b79850]" />
        </div>
      </div>
    </div>
  );
}
function BootError({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => Promise<void>;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f5ef] px-5">
      <div className="w-full max-w-md rounded-2xl border border-[#e5dfd1] bg-white p-7 text-center shadow-sm">
        <h1 className="font-display text-[23px] font-extrabold text-[#252821]">
          Cannot reach the API server
        </h1>
        <p className="mt-2 text-[14px] leading-relaxed text-[#77746b]">
          {message ?? "The workspace could not be loaded."}
        </p>
        <button
          onClick={() => void onRetry()}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[#262a2d] px-5 py-2.5 text-[14px] font-bold text-[#f7f3e6] hover:bg-[#414344]"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
function AppGate() {
  const { status, startupError, reload } = useApp();
  if (status === "loading") return <BootScreen />;
  if (status === "error")
    return <BootError message={startupError} onRetry={reload} />;
  if (status === "anonymous") return <AuthScreen />;
  return <Workspace />;
}
function App() {
  return (
    <TooltipProvider>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
        <ErrorBoundary>
          <AppProvider>
            <AppGate />
          </AppProvider>
        </ErrorBoundary>
      </WouterRouter>
      <Toaster />
    </TooltipProvider>
  );
}
export default App;
