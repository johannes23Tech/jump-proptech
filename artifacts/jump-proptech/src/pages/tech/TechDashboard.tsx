import { useEffect, useState } from "react";
import { useWorkspace } from "@/state/app";
import { api } from "@/lib/api";
import { LayoutDashboard, HardHat, Users, Building2, Wallet } from "lucide-react";

export default function TechDashboard() {
  const { data } = useWorkspace();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await api<any>("/tech/stats");
        setStats(result);
      } catch {
        // Silent
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, []);

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f5ef]">
      <div className="h-[2px] w-32 overflow-hidden rounded-full bg-[#e5dfd1]"><span className="block h-full w-1/2 animate-pulse rounded-full bg-[#b79850]" /></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-[#262a2d] rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[#c5a55a] text-[11px] font-bold tracking-[.2em] uppercase">Super Admin</div>
            <h1 className="mt-1 font-display text-[28px] font-extrabold">Tech Dashboard</h1>
            <p className="mt-1 text-white/60">Platform overview and maintenance queue</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c5a55a]/20 text-[15px] font-bold text-[#e4ce97]">SA</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats && [
          { label: "Properties", value: stats.propertyCount, icon: Building2 },
          { label: "Units", value: stats.unitCount, icon: HardHat },
          { label: "Tenants", value: stats.tenantCount, icon: Users },
          { label: "Rent Records", value: stats.rentCount, icon: Wallet },
          { label: "Maintenance", value: stats.maintenanceCount, icon: LayoutDashboard },
        ].map((item) => (
          <StatCard key={item.label} title={item.label} value={item.value} icon={item.icon} />
        ))}
      </div>

      <div className="rounded-xl border border-[#e5dfd1] bg-white p-6">
        <h2 className="font-display text-[18px] font-bold text-[#252821] mb-4">Platform Overview</h2>
        <div className="text-[#77746a] text-[13px]">
          Super admin has full access to all maintenance tickets and platform statistics.
          Use the navigation to manage tickets and view all records.
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon }: any) {
  return (
    <div className="rounded-xl border border-[#e5dfd1] bg-white p-4 flex items-center gap-4">
      <div className="h-10 w-10 rounded-lg bg-[#faf9f5] flex items-center justify-center text-[#b79850]"><Icon size={18} strokeWidth={2} /></div>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[.16em] text-[#99958a]">{title}</div>
        <div className="mt-1 font-display text-[18px] font-bold text-[#252821]">{value}</div>
      </div>
    </div>
  );
}