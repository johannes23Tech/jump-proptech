import { useMemo, useState, type FormEvent, type ReactNode } from "react";

export type TenantWorkspaceProfile = {
  idNumberOrPassport: string;
  phoneNumber: string;
  whatsappNumber: string;
  email: string;
  emergencyContact: string;
  nextOfKin: string;
  employer: string;
  notes: string;
};

export type TenantWorkspaceTenancy = {
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
  status: "Application" | "Active" | "Notice given" | "Ended";
};

export type TenantWorkspaceProperty = {
  id: string;
  name: string;
  address?: string;
  suburb?: string;
  city?: string;
};

export type TenantWorkspaceUnit = {
  id: string;
  propertyId: string;
  number: string;
  type?: string;
  monthlyRent?: number;
};

export type TenantWorkspaceRow = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  propertyLabel: string;
  unitLabel: string;
  status: "Active" | "Pending" | "Former";
  currentTenancyStatus?: TenantWorkspaceTenancy["status"] | null;
  monthlyRent?: number;
  profile: TenantWorkspaceProfile;
  tenancy?: TenantWorkspaceTenancy | null;
};

export type TenantWorkspaceSavePayload = {
  tenantId?: string;
  tenancyId?: string;
  profile: {
    firstName: string;
    lastName: string;
    privateProfile: TenantWorkspaceProfile;
  };
  tenancy: Omit<TenantWorkspaceTenancy, "id" | "tenantId"> & {
    id?: string;
    tenantId?: string;
  };
};

export type TenantWorkspaceProps = {
  rows: TenantWorkspaceRow[];
  properties: TenantWorkspaceProperty[];
  units: TenantWorkspaceUnit[];
  currentTenancies: TenantWorkspaceTenancy[];
  onSave: (payload: TenantWorkspaceSavePayload) => Promise<string | null>;
  onEndTenancy: (tenantId: string) => void;
  message?: string;
  messageType?: "saved" | "error";
};

type FilterStatus = "All" | TenantWorkspaceRow["status"];
type PanelState = { mode: "view" | "edit" | "add"; row?: TenantWorkspaceRow };

const emptyProfile: TenantWorkspaceProfile = {
  idNumberOrPassport: "",
  phoneNumber: "",
  whatsappNumber: "",
  email: "",
  emergencyContact: "",
  nextOfKin: "",
  employer: "",
  notes: "",
};

const money = (amount?: number) =>
  typeof amount === "number"
    ? new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
        maximumFractionDigits: 0,
      }).format(amount)
    : "—";

const dateLabel = (value?: string) => {
  if (!value) return "Not set";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-ZA", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
};

const inputClass =
  "mt-1.5 block min-h-11 w-full rounded-lg border border-[#ded9cd] bg-white px-3 py-2.5 text-[16px] font-normal text-[#34352f] placeholder:text-[#aaa69b] focus:border-[#b89a55] focus:outline-none focus:ring-2 focus:ring-[#d7c591]/40";
const labelClass = "block text-[14px] font-semibold text-[#57574f]";

function Field({
  label,
  children,
  wide = false,
  hint,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
  hint?: string;
}) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className={labelClass}>{label}</span>
      {children}
      {hint && (
        <span className="mt-1 block text-[13px] leading-relaxed text-[#8b887e]">
          {hint}
        </span>
      )}
    </label>
  );
}

function StatusPill({ status }: { status: TenantWorkspaceRow["status"] }) {
  const style =
    status === "Active"
      ? "bg-[#e8f0e8] text-[#4d6d50]"
      : status === "Pending"
        ? "bg-[#f5efdc] text-[#856d32]"
        : "bg-[#eeece7] text-[#77746a]";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[13px] font-bold ${style}`}
    >
      {status}
    </span>
  );
}

export default function TenantWorkspace({
  rows,
  properties,
  units,
  currentTenancies,
  onSave,
  onEndTenancy,
  message,
  messageType = "saved",
}: TenantWorkspaceProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterStatus>("All");
  const [panel, setPanel] = useState<PanelState | null>(null);
  const [revealedId, setRevealedId] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [endPrompt, setEndPrompt] = useState(false);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const tenancyByTenant = useMemo(() => {
    const result = new Map<string, TenantWorkspaceTenancy>();
    currentTenancies.forEach((tenancy) =>
      result.set(tenancy.tenantId, tenancy),
    );
    return result;
  }, [currentTenancies]);

  const visibleRows = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return rows.filter((row) => {
      if (filter !== "All" && row.status !== filter) return false;
      if (!needle) return true;
      return [
        row.firstName,
        row.lastName,
        row.phone,
        row.propertyLabel,
        row.unitLabel,
      ].some((value) => value.toLocaleLowerCase().includes(needle));
    });
  }, [rows, query, filter]);

  const counts = useMemo(
    () => ({
      All: rows.length,
      Active: rows.filter((row) => row.status === "Active").length,
      Pending: rows.filter((row) => row.status === "Pending").length,
      Former: rows.filter((row) => row.status === "Former").length,
    }),
    [rows],
  );

  function openPanel(next: PanelState) {
    const tenancy = next.row
      ? (next.row.tenancy ?? tenancyByTenant.get(next.row.id))
      : undefined;
    setPanel(next);
    setRevealedId(false);
    setEndPrompt(false);
    setFormError("");
    setSelectedProperty(tenancy?.propertyId ?? "");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const formData = new FormData(event.currentTarget);
    const text = (name: string) => String(formData.get(name) ?? "").trim();
    const number = (name: string) => Number(formData.get(name) ?? 0);
    const tenancySource = panel?.row
      ? (panel.row.tenancy ?? tenancyByTenant.get(panel.row.id))
      : undefined;
    const propertyId = text("propertyId");
    const unitId = text("unitId");
    const moveInDate = text("moveInDate");
    const leaseStart = text("leaseStart");
    const leaseEnd = text("leaseEnd");
    if (!text("firstName") || !text("lastName")) {
      setFormError("Enter the tenant’s first and last name.");
      return;
    }
    if (!text("phoneNumber")) {
      setFormError("Enter a phone number.");
      return;
    }
    if (
      !propertyId ||
      !units.some(
        (unit) => unit.id === unitId && unit.propertyId === propertyId,
      )
    ) {
      setFormError("Choose a property and a unit within that property.");
      return;
    }
    if (
      !text("monthlyRent") ||
      !Number.isFinite(number("monthlyRent")) ||
      number("monthlyRent") < 0
    ) {
      setFormError("Enter a valid monthly rent amount.");
      return;
    }
    if (
      !Number.isInteger(number("paymentDueDay")) ||
      number("paymentDueDay") < 1 ||
      number("paymentDueDay") > 31
    ) {
      setFormError("Rent due day must be between 1 and 31.");
      return;
    }
    const email = text("email");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Enter a valid email address.");
      return;
    }
    const validDate = (value: string) =>
      /^\d{4}-\d{2}-\d{2}$/.test(value) &&
      !Number.isNaN(Date.parse(`${value}T00:00:00`));
    if (
      !validDate(moveInDate) ||
      !validDate(leaseStart) ||
      !validDate(leaseEnd)
    ) {
      setFormError("Enter a valid move-in date, lease start, and lease end.");
      return;
    }
    if (leaseStart > leaseEnd) {
      setFormError("Lease end date must be on or after the lease start date.");
      return;
    }
    if (moveInDate > leaseEnd) {
      setFormError("Move-in date cannot be after the lease end date.");
      return;
    }
    const profile: TenantWorkspaceProfile = {
      idNumberOrPassport: text("idNumberOrPassport"),
      phoneNumber: text("phoneNumber"),
      whatsappNumber: text("whatsappNumber"),
      email,
      emergencyContact: text("emergencyContact"),
      nextOfKin: text("nextOfKin"),
      employer: text("employer"),
      notes: text("notes"),
    };
    const tenancy: TenantWorkspaceSavePayload["tenancy"] = {
      ...(tenancySource?.id ? { id: tenancySource.id } : {}),
      ...(panel?.row?.id ? { tenantId: panel.row.id } : {}),
      propertyId,
      unitId,
      moveInDate,
      leaseStart,
      leaseEnd,
      monthlyRent: number("monthlyRent"),
      depositAmount: number("depositAmount"),
      paymentDueDay: number("paymentDueDay"),
      status: text("tenancyStatus") as TenantWorkspaceTenancy["status"],
    };
    setSaving(true);
    const saveError = await onSave({
      ...(panel?.row?.id ? { tenantId: panel.row.id } : {}),
      ...(tenancySource?.id ? { tenancyId: tenancySource.id } : {}),
      profile: {
        firstName: text("firstName"),
        lastName: text("lastName"),
        privateProfile: profile,
      },
      tenancy,
    });
    setSaving(false);
    if (saveError) {
      setFormError(saveError);
      return;
    }
    setPanel(null);
  }

  const activePanelTenancy = panel?.row
    ? (panel.row.tenancy ?? tenancyByTenant.get(panel.row.id))
    : undefined;

  return (
    <section className="enter space-y-5" data-testid="tenant-workspace">
      <div className="flex flex-col gap-4 rounded-2xl border border-[#e8e2d5] bg-[#fbfaf6] p-4 shadow-[0_8px_28px_rgba(42,37,25,.035)] sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-4">
          <span className="mt-1 block h-10 w-[3px] shrink-0 rounded-full bg-[#b79850]" />
          <div>
            <p className="text-[15px] font-semibold text-[#34352f]">
              Tenant records, kept in one place
            </p>
            <p className="mt-1 max-w-xl text-[14px] leading-relaxed text-[#817e74]">
              Manage tenant profiles and tenancy history. ID and contact details
              stay out of the directory view.
            </p>
          </div>
        </div>
        <button
          type="button"
          data-testid="button-add-tenant"
          onClick={() => openPanel({ mode: "add" })}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-[#262a2d] px-4 text-[15px] font-bold text-[#faf7ee] transition hover:bg-[#414344]"
        >
          Add tenant
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {(["Active", "Pending", "Former"] as const).map((status, index) => (
          <button
            key={status}
            type="button"
            data-testid={`filter-summary-${status.toLowerCase()}`}
            onClick={() => setFilter(filter === status ? "All" : status)}
            className={`flex min-h-[76px] items-center justify-between rounded-xl border px-4 text-left transition ${filter === status ? "border-[#c9b477] bg-[#f5f0e2]" : "border-[#e8e2d5] bg-white/75 hover:bg-white"}`}
          >
            <span>
              <span className="block text-[13px] font-bold uppercase tracking-[.12em] text-[#8c897f]">
                {status} tenants
              </span>
              <span className="mt-1 block font-display text-[26px] font-bold tracking-[-.04em] text-[#30322d]">
                {counts[status]}
              </span>
            </span>
            <span
              className={`h-2 w-2 rounded-full ${index === 0 ? "bg-[#78927a]" : index === 1 ? "bg-[#c2a357]" : "bg-[#a6a399]"}`}
            />
          </button>
        ))}
      </div>

      {message && (
        <div
          role={messageType === "error" ? "alert" : "status"}
          data-testid={`tenant-message-${messageType}`}
          className={`flex items-start gap-2 rounded-lg border px-3.5 py-3 text-[14px] ${messageType === "error" ? "border-[#e6c9c3] bg-[#fbefec] text-[#914c43]" : "border-[#cbd9cb] bg-[#edf4ed] text-[#4f6c51]"}`}
        >
          <span
            aria-hidden="true"
            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${messageType === "error" ? "bg-[#914c43]" : "bg-[#4f6c51]"}`}
          />
          {message}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#e8e2d5] bg-white shadow-[0_8px_28px_rgba(42,37,25,.035)]">
        <div className="flex flex-col gap-3 border-b border-[#eee9df] p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h2 className="font-display text-[19px] font-extrabold tracking-[-.025em] text-[#30322d]">
              Tenant directory
            </h2>
            <p className="mt-1 text-[13px] text-[#89867d]">
              {visibleRows.length} of {rows.length} tenant
              {rows.length === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="block">
              <span className="sr-only">Search tenants</span>
              <input
                data-testid="input-tenant-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, phone, property…"
                className="min-h-11 w-full rounded-lg border border-[#e1dccf] bg-[#fcfbf8] px-3 text-[14px] outline-none transition focus:border-[#b89a55] sm:w-[280px]"
              />
            </label>
            <label className="sr-only" htmlFor="tenant-status-filter">
              Filter by tenant status
            </label>
            <select
              id="tenant-status-filter"
              data-testid="select-tenant-filter"
              value={filter}
              onChange={(event) =>
                setFilter(event.target.value as FilterStatus)
              }
              className="min-h-11 rounded-lg border border-[#e1dccf] bg-[#fcfbf8] px-3 text-[14px] font-medium text-[#58574f] outline-none focus:border-[#b89a55]"
            >
              {(["All", "Active", "Pending", "Former"] as FilterStatus[]).map(
                (item) => (
                  <option key={item} value={item}>
                    {item === "All" ? "All statuses" : item}
                  </option>
                ),
              )}
            </select>
          </div>
        </div>

        {visibleRows.length ? (
          <div className="divide-y divide-[#f0ece4]">
            {visibleRows.map((row) => (
              <button
                type="button"
                key={row.id}
                data-testid={`row-tenant-${row.id}`}
                onClick={() => openPanel({ mode: "view", row })}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-2 px-4 py-4 text-left transition hover:bg-[#fbfaf6] sm:grid-cols-[minmax(190px,1.35fr)_minmax(130px,1fr)_minmax(150px,1.25fr)_minmax(100px,.75fr)_auto] sm:px-5"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eee8d7] text-[14px] font-bold text-[#806c3b]">
                    {row.firstName.slice(0, 1)}
                    {row.lastName.slice(0, 1)}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 truncate text-[15px] font-bold text-[#34352f]">
                      {row.firstName} {row.lastName}
                    </span>
                    <span className="mt-1 block truncate text-[13px] text-[#88857b]">
                      {row.phone ||
                        row.profile.phoneNumber ||
                        "No phone number"}
                    </span>
                  </span>
                </span>
                <span className="col-start-1 min-w-0 pl-[52px] sm:col-start-auto sm:pl-0">
                  <span className="block truncate text-[14px] font-semibold text-[#55564f]">
                    {row.propertyLabel || "Property not assigned"}
                  </span>
                  <span className="mt-1 block truncate text-[13px] text-[#929087]">
                    {row.unitLabel || "Unit not assigned"}
                  </span>
                </span>
                <span className="hidden min-w-0 sm:block">
                  <span className="block truncate text-[14px] font-semibold text-[#55564f]">
                    {row.currentTenancyStatus ??
                      row.tenancy?.status ??
                      "No current tenancy"}
                  </span>
                  <span className="mt-1 block text-[13px] text-[#929087]">
                    {row.tenancy?.leaseEnd
                      ? `Lease ends ${dateLabel(row.tenancy.leaseEnd)}`
                      : "Lease dates not set"}
                  </span>
                </span>
                <span className="hidden text-right sm:block">
                  <span className="block text-[14px] font-bold text-[#34352f]">
                    {money(row.monthlyRent ?? row.tenancy?.monthlyRent)}
                  </span>
                  <span className="mt-1 block text-[11px] text-[#929087]">
                    per month
                  </span>
                </span>
                <span className="col-start-2 row-start-1 flex items-center gap-2 sm:col-start-auto sm:row-start-auto">
                  <StatusPill status={row.status} />
                  <span className="text-[12px] font-semibold uppercase tracking-[.1em] text-[#9a8653]">
                    View
                  </span>
                </span>
                <span className="col-start-1 pl-[52px] text-[13px] font-medium text-[#776d54] sm:hidden">
                  {money(row.monthlyRent ?? row.tenancy?.monthlyRent)} / month ·{" "}
                  {row.currentTenancyStatus ??
                    row.tenancy?.status ??
                    "No tenancy"}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div
            className="px-5 py-12 text-center"
            data-testid="empty-tenant-results"
          >
            <h3 className="mt-1 font-display text-[18px] font-extrabold text-[#393a34]">
              {rows.length
                ? "No tenants match this view"
                : "Your tenant list starts here"}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-[14px] leading-relaxed text-[#858278]">
              {rows.length
                ? "Try another status or a shorter search."
                : "Add a tenant and their tenancy details to keep your rental records together."}
            </p>
            {rows.length ? (
              <button
                type="button"
                data-testid="button-clear-tenant-filters"
                onClick={() => {
                  setFilter("All");
                  setQuery("");
                }}
                className="mt-4 min-h-10 rounded-lg px-4 text-[14px] font-bold text-[#776536] hover:bg-[#f5f0e2]"
              >
                Clear filters
              </button>
            ) : (
              <button
                type="button"
                data-testid="button-empty-add-tenant"
                onClick={() => openPanel({ mode: "add" })}
                className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#262a2d] px-4 text-[14px] font-bold text-[#faf7ee]"
              >
                Add tenant
              </button>
            )}
          </div>
        )}
      </div>

      <div
        className="border-l-2 border-[#c5a55a] bg-[#f4f0e4] px-3.5 py-3 text-[13px] leading-relaxed text-[#766b4f]"
        data-testid="tenant-privacy-warning"
      >
        <p>
          <strong className="font-bold">Privacy &amp; storage.</strong> Tenant
          records are saved to your account in this workspace’s PostgreSQL
          database and are visible only to signed-in users of this account. Only
          capture identity information you are authorised to process.
        </p>
      </div>

      {panel && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-[#17191d]/55 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setPanel(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="tenant-dialog-title"
            data-testid="dialog-tenant-profile"
            className="flex max-h-[96dvh] w-full max-w-[720px] flex-col overflow-hidden rounded-t-2xl bg-[#fbfaf6] shadow-2xl sm:max-h-[92dvh] sm:rounded-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-[#e8e2d7] bg-[#fbfaf6] px-4 py-3.5 sm:px-6">
              <div className="flex items-center gap-3">
                {panel.mode === "view" && (
                  <button
                    type="button"
                    data-testid="button-tenant-back"
                    aria-label="Back to tenants"
                    onClick={() => setPanel(null)}
                    className="min-h-10 rounded-lg px-3 text-[14px] font-semibold text-[#77756c] hover:bg-[#efede6] sm:hidden"
                  >
                    Back
                  </button>
                )}
                <div>
                  <div className="text-[11px] font-bold tracking-[.18em] text-[#a18a50]">
                    {panel.mode === "add"
                      ? "NEW TENANT"
                      : panel.mode === "edit"
                        ? "EDIT TENANT RECORD"
                        : "TENANT PROFILE"}
                  </div>
                  <h2
                    id="tenant-dialog-title"
                    className="mt-1 font-display text-[23px] font-extrabold tracking-[-.035em] text-[#292b27]"
                  >
                    {panel.mode === "add"
                      ? "Add a tenant"
                      : `${panel.row?.firstName} ${panel.row?.lastName}`}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                data-testid="button-close-tenant-dialog"
                aria-label="Close tenant details"
                onClick={() => setPanel(null)}
                className="min-h-10 rounded-lg px-3 text-[14px] font-semibold text-[#77756c] hover:bg-[#efede6]"
              >
                Close
              </button>
            </div>

            {panel.mode === "view" && panel.row ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="flex flex-col gap-4 border-b border-[#ece7dd] bg-[#f7f5ef] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e9e1ca] text-[16px] font-bold text-[#78653a]">
                      {panel.row.firstName.slice(0, 1)}
                      {panel.row.lastName.slice(0, 1)}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill status={panel.row.status} />
                      </div>
                      <p className="mt-1.5 text-[14px] text-[#77756c]">
                        {panel.row.propertyLabel || "No property"} ·{" "}
                        {panel.row.unitLabel || "No unit"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    data-testid="button-edit-tenant"
                    onClick={() => openPanel({ mode: "edit", row: panel.row })}
                    className="min-h-11 rounded-lg border border-[#d9d3c5] bg-white px-4 text-[14px] font-bold text-[#4c4c44] transition hover:bg-[#f5f2ea]"
                  >
                    Edit details
                  </button>
                </div>
                <div className="space-y-5 px-5 py-5 sm:px-7">
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="h-3.5 w-[2px] rounded-full bg-[#b79850]" />
                      <h3 className="text-[14px] font-extrabold uppercase tracking-[.12em] text-[#58574f]">
                        Tenant profile
                      </h3>
                    </div>
                    <div className="grid gap-x-5 gap-y-4 rounded-xl border border-[#e9e4d9] bg-white p-4 sm:grid-cols-2">
                      <Detail
                        label="Phone number"
                        value={panel.row.profile.phoneNumber || panel.row.phone}
                      />
                      <Detail
                        label="WhatsApp number"
                        value={panel.row.profile.whatsappNumber}
                      />
                      <Detail label="Email" value={panel.row.profile.email} />
                      <Detail
                        label="Employer"
                        value={panel.row.profile.employer}
                      />
                      <Detail
                        label="Emergency contact"
                        value={panel.row.profile.emergencyContact}
                      />
                      <Detail
                        label="Next of kin"
                        value={panel.row.profile.nextOfKin}
                      />
                      <div className="sm:col-span-2">
                        <div className="flex items-center justify-between gap-3">
                          <Detail
                            label="ID number or passport"
                            value={
                              revealedId
                                ? panel.row.profile.idNumberOrPassport ||
                                  "Not provided"
                                : "Hidden for privacy"
                            }
                          />
                          <button
                            type="button"
                            data-testid="button-reveal-tenant-id"
                            onClick={() => setRevealedId(!revealedId)}
                            className="inline-flex min-h-10 shrink-0 items-center rounded-lg px-3 text-[13px] font-bold text-[#786536] hover:bg-[#f5f0e2]"
                          >
                            {revealedId ? "Hide ID" : "Reveal ID"}
                          </button>
                        </div>
                      </div>
                      {panel.row.profile.notes && (
                        <Detail
                          label="Notes"
                          value={panel.row.profile.notes}
                          wide
                        />
                      )}
                    </div>
                  </section>
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="h-3.5 w-[2px] rounded-full bg-[#b79850]" />
                      <h3 className="text-[14px] font-extrabold uppercase tracking-[.12em] text-[#58574f]">
                        Tenancy
                      </h3>
                    </div>
                    <div className="grid gap-x-5 gap-y-4 rounded-xl border border-[#e9e4d9] bg-white p-4 sm:grid-cols-2">
                      <Detail
                        label="Tenancy status"
                        value={
                          panel.row.currentTenancyStatus ??
                          activePanelTenancy?.status ??
                          "No current tenancy"
                        }
                      />
                      <Detail
                        label="Monthly rent"
                        value={money(
                          panel.row.monthlyRent ??
                            activePanelTenancy?.monthlyRent,
                        )}
                      />
                      <Detail
                        label="Lease start"
                        value={dateLabel(activePanelTenancy?.leaseStart)}
                      />
                      <Detail
                        label="Lease end"
                        value={dateLabel(activePanelTenancy?.leaseEnd)}
                      />
                      <Detail
                        label="Move-in date"
                        value={dateLabel(activePanelTenancy?.moveInDate)}
                      />
                      <Detail
                        label="Deposit"
                        value={money(activePanelTenancy?.depositAmount)}
                      />
                      <Detail
                        label="Rent due day"
                        value={
                          activePanelTenancy?.paymentDueDay
                            ? `Day ${activePanelTenancy.paymentDueDay} of each month`
                            : "Not set"
                        }
                      />
                    </div>
                  </section>
                  {endPrompt && (
                    <div
                      role="alert"
                      className="rounded-xl border border-[#ead6c6] bg-[#fbf2e9] p-4"
                      data-testid="confirm-end-tenancy"
                    >
                      <p className="text-[14px] font-bold text-[#674f3a]">
                        End this tenancy?
                      </p>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#806d5b]">
                        This will mark the tenancy for ending. Confirm only when
                        the notice and move-out have been agreed.
                      </p>
                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          data-testid="button-cancel-end-tenancy"
                          onClick={() => setEndPrompt(false)}
                          className="min-h-10 rounded-lg px-3 text-[13px] font-bold text-[#6b6258] hover:bg-white"
                        >
                          Keep tenancy
                        </button>
                        <button
                          type="button"
                          data-testid="button-confirm-end-tenancy"
                          onClick={() => {
                            onEndTenancy(panel.row!.id);
                            setEndPrompt(false);
                            setPanel(null);
                          }}
                          className="min-h-10 rounded-lg bg-[#8b4f42] px-3.5 text-[13px] font-bold text-white hover:bg-[#754136]"
                        >
                          Confirm end tenancy
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                {panel.row.status !== "Former" &&
                  activePanelTenancy?.status !== "Ended" && (
                    <div className="flex justify-end border-t border-[#e9e4d9] px-5 py-3 sm:px-7">
                      <button
                        type="button"
                        data-testid="button-end-tenancy"
                        onClick={() => setEndPrompt(true)}
                        className="min-h-11 rounded-lg px-4 text-[14px] font-bold text-[#945348] transition hover:bg-[#f8eeeb]"
                      >
                        End tenancy
                      </button>
                    </div>
                  )}
              </div>
            ) : (
              <form
                key={`${panel.mode}-${panel.row?.id ?? "new"}`}
                noValidate
                onSubmit={submit}
                className="min-h-0 flex-1 overflow-y-auto"
              >
                <div className="space-y-5 px-5 py-5 sm:px-7">
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="h-3.5 w-[2px] rounded-full bg-[#b79850]" />
                      <div>
                        <h3 className="text-[14px] font-extrabold uppercase tracking-[.12em] text-[#58574f]">
                          Tenant profile
                        </h3>
                        <p className="mt-1 text-[13px] text-[#89867d]">
                          Contact and personal details for this tenant.
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3.5 rounded-xl border border-[#e9e4d9] bg-white p-4 sm:grid-cols-2">
                      <Field label="First name">
                        <input
                          name="firstName"
                          required
                          defaultValue={panel.row?.firstName ?? ""}
                          className={inputClass}
                          autoComplete="given-name"
                        />
                      </Field>
                      <Field label="Last name">
                        <input
                          name="lastName"
                          required
                          defaultValue={panel.row?.lastName ?? ""}
                          className={inputClass}
                          autoComplete="family-name"
                        />
                      </Field>
                      <Field label="Phone number">
                        <input
                          name="phoneNumber"
                          type="tel"
                          required
                          defaultValue={
                            panel.row?.profile.phoneNumber ??
                            panel.row?.phone ??
                            ""
                          }
                          className={inputClass}
                          autoComplete="tel"
                        />
                      </Field>
                      <Field label="WhatsApp number">
                        <input
                          name="whatsappNumber"
                          type="tel"
                          defaultValue={panel.row?.profile.whatsappNumber ?? ""}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Email address">
                        <input
                          name="email"
                          type="email"
                          defaultValue={panel.row?.profile.email ?? ""}
                          className={inputClass}
                          autoComplete="email"
                        />
                      </Field>
                      <Field label="Employer">
                        <input
                          name="employer"
                          defaultValue={panel.row?.profile.employer ?? ""}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Emergency contact">
                        <input
                          name="emergencyContact"
                          defaultValue={
                            panel.row?.profile.emergencyContact ?? ""
                          }
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Next of kin">
                        <input
                          name="nextOfKin"
                          defaultValue={panel.row?.profile.nextOfKin ?? ""}
                          className={inputClass}
                        />
                      </Field>
                      <Field
                        label="ID number or passport"
                        hint="Stored as private profile information. It is not verified by this workspace."
                      >
                        <input
                          name="idNumberOrPassport"
                          defaultValue={
                            panel.row?.profile.idNumberOrPassport ?? ""
                          }
                          className={inputClass}
                          autoComplete="off"
                        />
                      </Field>
                      <Field label="Profile notes" wide>
                        <textarea
                          name="notes"
                          rows={2}
                          defaultValue={panel.row?.profile.notes ?? ""}
                          className={`${inputClass} resize-y`}
                          placeholder="Optional notes relevant to the tenancy"
                        />
                      </Field>
                    </div>
                  </section>
                  <section>
                    <div className="mb-3 flex items-center gap-2">
                      <span className="h-3.5 w-[2px] rounded-full bg-[#b79850]" />
                      <div>
                        <h3 className="text-[14px] font-extrabold uppercase tracking-[.12em] text-[#58574f]">
                          Tenancy
                        </h3>
                        <p className="mt-1 text-[13px] text-[#89867d]">
                          Link the tenant to a property and one of its units.
                        </p>
                      </div>
                    </div>
                    <div className="grid gap-3.5 rounded-xl border border-[#e9e4d9] bg-white p-4 sm:grid-cols-2">
                      <Field label="Property">
                        <select
                          name="propertyId"
                          required
                          value={selectedProperty}
                          onChange={(event) =>
                            setSelectedProperty(event.target.value)
                          }
                          className={inputClass}
                        >
                          <option value="">Select a property</option>
                          {properties.map((property) => (
                            <option value={property.id} key={property.id}>
                              {property.name}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Unit">
                        <select
                          name="unitId"
                          required
                          defaultValue={activePanelTenancy?.unitId ?? ""}
                          className={inputClass}
                          disabled={!selectedProperty}
                        >
                          <option value="">
                            {selectedProperty
                              ? "Select a unit"
                              : "Choose a property first"}
                          </option>
                          {units
                            .filter(
                              (unit) => unit.propertyId === selectedProperty,
                            )
                            .map((unit) => (
                              <option value={unit.id} key={unit.id}>
                                {unit.number}
                                {unit.type ? ` · ${unit.type}` : ""}
                              </option>
                            ))}
                        </select>
                      </Field>
                      <Field label="Tenancy status">
                        <select
                          name="tenancyStatus"
                          defaultValue={
                            activePanelTenancy?.status ??
                            (panel.mode === "add" ? "Application" : "Active")
                          }
                          className={inputClass}
                        >
                          {(
                            [
                              "Application",
                              "Active",
                              "Notice given",
                              "Ended",
                            ] as const
                          ).map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Monthly rent (ZAR)">
                        <input
                          name="monthlyRent"
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          defaultValue={activePanelTenancy?.monthlyRent ?? ""}
                          className={inputClass}
                          inputMode="decimal"
                        />
                      </Field>
                      <Field label="Deposit amount (ZAR)">
                        <input
                          name="depositAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          defaultValue={activePanelTenancy?.depositAmount ?? ""}
                          className={inputClass}
                          inputMode="decimal"
                        />
                      </Field>
                      <Field label="Rent due day">
                        <input
                          name="paymentDueDay"
                          type="number"
                          min="1"
                          max="31"
                          defaultValue={activePanelTenancy?.paymentDueDay ?? 1}
                          className={inputClass}
                          inputMode="numeric"
                        />
                      </Field>
                      <Field label="Move-in date">
                        <input
                          name="moveInDate"
                          type="date"
                          required
                          defaultValue={activePanelTenancy?.moveInDate ?? ""}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Lease start">
                        <input
                          name="leaseStart"
                          type="date"
                          required
                          defaultValue={activePanelTenancy?.leaseStart ?? ""}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Lease end">
                        <input
                          name="leaseEnd"
                          type="date"
                          required
                          defaultValue={activePanelTenancy?.leaseEnd ?? ""}
                          className={inputClass}
                        />
                      </Field>
                    </div>
                    {properties.length === 0 && (
                      <p className="mt-2 text-[13px] text-[#8c7040]">
                        Add a property before assigning a tenancy.
                      </p>
                    )}
                  </section>
                  <div className="rounded-lg border border-[#e4dcc6] border-l-2 border-l-[#c5a55a] bg-[#f4f0e4] px-3 py-2.5 text-[13px] leading-relaxed text-[#766b4f]">
                    <p>
                      Privacy note: ID and contact details are sensitive. Store
                      only what is needed, and avoid shared devices.
                    </p>
                  </div>
                  {formError && (
                    <p
                      role="alert"
                      data-testid="tenant-form-error"
                      className="rounded-lg border border-[#e7c8c2] bg-[#fbefec] px-3 py-2.5 text-[14px] font-medium text-[#9c4f46]"
                    >
                      {formError}
                    </p>
                  )}
                </div>
                <div className="sticky bottom-0 flex shrink-0 justify-end gap-2 border-t border-[#e9e4d9] bg-[#fbfaf6]/95 px-5 py-3.5 backdrop-blur sm:px-7">
                  <button
                    type="button"
                    data-testid="button-cancel-tenant"
                    onClick={() => setPanel(null)}
                    className="min-h-11 rounded-lg px-4 text-[14px] font-semibold text-[#6d6a61] hover:bg-[#efede6]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    data-testid="button-save-tenant"
                    disabled={saving}
                    className="min-h-11 rounded-lg bg-[#262a2d] px-5 text-[14px] font-bold text-[#f7f3e6] transition hover:bg-[#414344] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Saving…"
                      : panel.mode === "edit"
                        ? "Save changes"
                        : "Save tenant"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </section>
  );
}

function Detail({
  label,
  value,
  wide = false,
}: {
  label: string;
  value?: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <div className="text-[11px] font-bold uppercase tracking-[.1em] text-[#969287]">
        {label}
      </div>
      <div className="mt-1 break-words text-[14px] font-medium leading-relaxed text-[#45463f]">
        {value || "Not provided"}
      </div>
    </div>
  );
}
