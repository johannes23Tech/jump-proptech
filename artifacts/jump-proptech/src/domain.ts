import type {
  MaintenanceRequest,
  Property,
  RentRecord,
  Tenancy,
  TenancyStatus,
  Tenant,
  TenantStatus,
  Unit,
  Workspace,
} from "@workspace/contracts";

export type {
  MaintenanceRequest,
  Property,
  RentRecord,
  Tenancy,
  TenancyStatus,
  Tenant,
  TenantStatus,
  Unit,
};

export type Dataset = Pick<
  Workspace,
  "properties" | "units" | "tenants" | "tenancies" | "rent" | "maintenance"
>;

export function tenantDisplayName(tenant: Pick<Tenant, "firstName" | "lastName">): string {
  return `${tenant.firstName} ${tenant.lastName}`.trim();
}

const currentTenancyStatuses: TenancyStatus[] = ["Active", "Notice given"];

export function getPrimaryTenancy(
  data: Pick<Dataset, "tenancies">,
  tenantId: string,
): Tenancy | undefined {
  const tenantTenancies = data.tenancies.filter(
    (tenancy) => tenancy.tenantId === tenantId,
  );

  const priority = (status: TenancyStatus) =>
    currentTenancyStatuses.includes(status) ? 0 : status === "Application" ? 1 : 2;

  return tenantTenancies.sort(
    (a, b) =>
      priority(a.status) - priority(b.status) ||
      b.leaseStart.localeCompare(a.leaseStart) ||
      b.createdAt.localeCompare(a.createdAt),
  )[0];
}

export function getTenantStatus(
  data: Pick<Dataset, "tenancies">,
  tenantId: string,
): TenantStatus {
  const tenancy = getPrimaryTenancy(data, tenantId);
  if (tenancy && currentTenancyStatuses.includes(tenancy.status)) return "Active";
  if (tenancy?.status === "Application") return "Pending";
  return "Former";
}

export function getPortfolioSummary(data: Pick<Dataset, "properties" | "units">) {
  const occupiedUnits = data.units.filter((unit) => unit.occupancyStatus === "Occupied").length;
  const vacantUnits = data.units.filter((unit) => unit.occupancyStatus === "Vacant").length;
  const maintenanceUnits = data.units.filter(
    (unit) => unit.occupancyStatus === "Maintenance",
  ).length;

  return {
    propertyCount: data.properties.length,
    totalUnits: data.units.length,
    occupiedUnits,
    vacantUnits,
    maintenanceUnits,
    occupancyPercentage: data.units.length
      ? Math.round((occupiedUnits / data.units.length) * 100)
      : 0,
  };
}

export function money(value: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(value);
}
