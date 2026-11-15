import { useEffect, useState } from "react";
import { useWorkspace } from "@/state/app";
import { api } from "@/lib/api";
import { money } from "@/domain";
import { Wallet, FileText, HardHat, Clock } from "lucide-react";

export default function TenantHome() {
  const { data, userTenantId } = useWorkspace();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [lease, rent, maintenance] = await Promise.all([
          api<any>("/tenant/lease"),
          api<any[]>("/tenant/rent"),
          api<any[]>("/tenant/maintenance"),
        ]);
        const currentMonth = new Date().toISOString().slice(0, 7);
        const thisMonthRent = rent.filter((r) => r.month === currentMonth);
        const paidThisMonth = thisMonthRent.reduce(
          (sum: number, r: any) => (r.status === "Paid" ? sum + r.amount : sum),
          0,
        );
        const outstanding = rent.reduce(
          (sum: number, r: any) => (r.status !== "Paid" ? sum + r.amount : sum),
          0,
        );
        setStats({
          monthlyRent: lease.monthlyRent,
          outstanding,
          paidThisMonth,
          openTickets: maintenance.filter((t: any) => t.status !== "Resolved")
            .length,
        });
      } catch {
        // Silent
      } finally {
        setLoading(false);
      }
    };
    void fetchStats();
  }, []);

  const tenancy = data.tenancies.find(
    (t: any) => t.tenantId === userTenantId && t.status === "Active",
  );
  const unit = data.units.find((u: any) => u.id === tenancy?.unitId);
  const property = data.properties.find((p: any) => p.id === tenancy?.propertyId);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f5ef]">
        <div className="h-[2px] w-32 overflow-hidden rounded-full bg-[#e5dfd1]">
          <span className="block h-full w-1/2 animate-pulse rounded-full bg-[#b79850]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-[#262a2d] rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[#c5a55a] text-[11px] font-bold tracking-[.2em] uppercase">
              Welcome back
            </div>
            <h1 className="mt-1 font-display text-[28px] font-extrabold">
              {data.user.fullName}
            </h1>
            <p className="mt-1 text-white/60">
              {unit ? `Unit ${unit.number} · ${property?.name}` : "No active unit"}
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c5a55a]/20 text-[15px] font-bold text-[#e4ce97]">
            {data.user.fullName?.split(" ").map((n: string) => n[0]).join("") || "JL"}
          </div>
        </div>
      </div>
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Monthly Rent" value={money(stats.monthlyRent)} icon={Wallet} color="text-[#b79850]" />
          <StatCard title="Outstanding Balance" value={money(stats.outstanding)} icon={Clock} color={stats.outstanding > 0 ? "text-[#a54c42]" : "text-[#6f9068]"} />
          <StatCard title="Paid This Month" value={money(stats.paidThisMonth)} icon={FileText} color="text-[#6f9068]" />
          <StatCard title="Open Tickets" value={stats.openTickets} icon={HardHat} color="text-[#c5a55a]" />
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <QuickAction href="/tenant/payments" icon={Wallet} label="Pay Rent" copy="Settle your monthly rent" color="bg-[#b79850]/10 text-[#6f5b2c]" />
        <QuickAction href="/tenant/report-issue" icon={HardHat} label="Report Issue" copy="Request maintenance or repairs" color="bg-[#a54c42]/10 text-[#8a3b33]" />
        <QuickAction href="/tenant/statements" icon={FileText} label="Download Statement" copy="1, 3, 6 or 12 month PDF" color="bg-[#6f9068]/10 text-[#4a6b4f]" />
      </div>
      <div className="rounded-xl border border-[#e5dfd1] bg-white p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-[18px] font-bold text-[#252821]">Quick Summary</h2>
        </div>
        {tenancy && (
          <div className="space-y-3 text-[13px] text-[#77746a]">
            <div className="flex justify-between"><span>Lease status</span><span className="font-semibold text-[#252821]">Active</span></div>
            <div className="flex justify-between"><span>Monthly rent</span><span className="font-semibold text-[#252821]">{money(tenancy.monthlyRent)}</span></div>
            <div className="flex justify-between"><span>Payment due day</span><span className="font-semibold text-[#252821]">{tenancy.paymentDueDay}th of each month</span></div>
            <div className="flex justify-between"><span>Lease ends</span><span className="font-semibold text-[#252821]">{tenancy.leaseEnd}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="rounded-xl border border-[#e5dfd1] bg-white p-4 flex items-center gap-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}><Icon size={18} strokeWidth={2} /></div>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[.16em] text-[#99958a]">{title}</div>
        <div className="mt-1 font-display text-[18px] font-bold text-[#252821]">{value}</div>
      </div>
    </div>
  );
}

function QuickAction({ href, icon: Icon, label, copy, color }: any) {
  return (
    <a href={href} className="block rounded-xl border border-[#e5dfd1] p-5 hover:bg-[#f7f5ef] transition flex items-center gap-4">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${color}`}><Icon size={18} strokeWidth={2} /></div>
      <div>
        <div className="text-[13px] font-semibold text-[#252821]">{label}</div>
        <div className="mt-0.5 text-[11px] text-[#99958a]">{copy}</div>
      </div>
    </a>
  );
}