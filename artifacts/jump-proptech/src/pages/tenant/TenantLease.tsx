import { useEffect, useState } from "react";
import { useWorkspace } from "@/state/app";
import { api } from "@/lib/api";
import { money } from "@/domain";
import { FileText, Home, User, Building2 } from "lucide-react";

export default function TenantLease() {
  const { data, userTenantId } = useWorkspace();
  const [lease, setLease] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLease = async () => {
      try {
        const result = await api<any>("/tenant/lease");
        setLease(result);
      } catch {
        // Silent
      } finally {
        setLoading(false);
      }
    };
    void fetchLease();
  }, []);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f5ef]">
      <div className="h-[2px] w-32 overflow-hidden rounded-full bg-[#e5dfd1]"><span className="block h-full w-1/2 animate-pulse rounded-full bg-[#b79850]" /></div>
    </div>
  );

  if (!lease) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f5ef]">
      <div className="text-center text-[#77746a]">No active lease found.</div>
    </div>
  );

  const unit = data.units.find((u: any) => u.id === lease.unitId);
  const property = data.properties.find((p: any) => p.id === lease.propertyId);
  const tenant = data.tenants.find((t: any) => t.id === lease.tenantId);

  return (
    <div className="space-y-6">
      <div className="bg-[#262a2d] rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[#c5a55a] text-[11px] font-bold tracking-[.2em] uppercase">My Lease</div>
            <h1 className="mt-1 font-display text-[28px] font-extrabold">Lease Agreement</h1>
            <p className="mt-1 text-white/60">Your current tenancy details</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c5a55a]/20 text-[15px] font-bold text-[#e4ce97]">LT</div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard title="Property" icon={Building2} value={property?.name || "—"} />
        <InfoCard title="Unit Number" icon={Home} value={unit?.number || "—"} />
        <InfoCard title="Monthly Rent" icon={User} value={money(lease.monthlyRent)} />
        <InfoCard title="Deposit" icon={FileText} value={money(lease.depositAmount)} />
        <InfoCard title="Payment Due Day" icon={FileText} value={lease.paymentDueDay + "th"} />
        <InfoCard title="Lease Status" icon={FileText} value="Active" color="text-[#6f9068]" />
      </div>

      <div className="rounded-xl border border-[#e5dfd1] bg-white p-6">
        <h2 className="font-display text-[18px] font-bold text-[#252821] mb-4">Lease Dates</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <DateRow label="Move-in Date" value={lease.moveInDate} />
          <DateRow label="Lease Start" value={lease.leaseStart} />
          <DateRow label="Lease End" value={lease.leaseEnd} />
          <DateRow label="Created" value={lease.createdAt} />
        </div>
      </div>

      {tenant && (
        <div className="rounded-xl border border-[#e5dfd1] bg-white p-6">
          <h2 className="font-display text-[18px] font-bold text-[#252821] mb-4">Tenant Details</h2>
          <div className="space-y-3 text-[13px] text-[#77746a]">
            <div className="flex justify-between"><span>Name</span><span className="font-semibold text-[#252821]">{tenant.firstName} {tenant.lastName}</span></div>
            <div className="flex justify-between"><span>Phone</span><span className="font-semibold text-[#252821]">{tenant.privateProfile?.phoneNumber || "—"}</span></div>
            <div className="flex justify-between"><span>Email</span><span className="font-semibold text-[#252821]">{tenant.privateProfile?.email || "—"}</span></div>
            <div className="flex justify-between"><span>ID/Passport</span><span className="font-semibold text-[#252821]">{tenant.privateProfile?.idNumberOrPassport || "—"}</span></div>
            <div className="flex justify-between"><span>Employer</span><span className="font-semibold text-[#252821]">{tenant.privateProfile?.employer || "—"}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ title, icon: Icon, value, color }: any) {
  return (
    <div className="rounded-xl border border-[#e5dfd1] bg-white p-4 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color || "bg-[#b79850]/10 text-[#6f5b2c]"}`}><Icon size={18} strokeWidth={2} /></div>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[.16em] text-[#99958a]">{title}</div>
        <div className="mt-1 font-display text-[18px] font-bold text-[#252821]">{value}</div>
      </div>
    </div>
  );
}

function DateRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-[#f0ede6] last:border-0">
      <span className="text-[#77746a]">{label}</span>
      <span className="font-semibold text-[#252821]">{value}</span>
    </div>
  );
}