import { useEffect, useState } from "react";
import { useWorkspace } from "@/state/app";
import { api } from "@/lib/api";
import { money } from "@/domain";
import { Wallet, Clock, FileText, ChevronRight } from "lucide-react";

export default function TenantPayments() {
  const { data, userTenantId } = useWorkspace();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRent = async () => {
      try {
        const result = await api<any[]>("/tenant/rent");
        setRecords(result);
      } catch {
        // Silent
      } finally {
        setLoading(false);
      }
    };
    void fetchRent();
  }, []);

  const totalPaid = records.filter((r) => r.status === "Paid").reduce((sum, r) => sum + r.amount, 0);
  const totalDue = records.reduce((sum, r) => sum + r.amount, 0);
  const outstanding = totalDue - totalPaid;

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
            <div className="text-[#c5a55a] text-[11px] font-bold tracking-[.2em] uppercase">My Payments</div>
            <h1 className="mt-1 font-display text-[28px] font-extrabold">Rent Ledger</h1>
            <p className="mt-1 text-white/60">Track rent payments and balance</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c5a55a]/20 text-[15px] font-bold text-[#e4ce97]">RL</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Total Due" value={money(totalDue)} color="text-[#b79850]" />
        <StatCard title="Total Paid" value={money(totalPaid)} color="text-[#6f9068]" />
        <StatCard title="Outstanding" value={money(outstanding)} color={outstanding > 0 ? "text-[#a54c42]" : "text-[#6f9068]"} />
      </div>

      <div className="rounded-xl border border-[#e5dfd1] bg-white">
        <div className="border-b border-[#e5dfd1] bg-[#fbfaf7] px-5 py-3">
          <div className="grid grid-cols-4 gap-4 text-[12px] font-semibold text-[#77746a]">
            <div>Month</div>
            <div>Amount</div>
            <div>Due Date</div>
            <div>Status</div>
          </div>
        </div>
        <div className="divide-y divide-[#f0ede6]">
          {records.length > 0 ? (
            records.map((r: any) => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-4 text-[13px]">
                <div className="text-[#252821] font-medium">{r.month}</div>
                <div className="font-mono text-[#252821]">{money(r.amount)}</div>
                <div className="text-[#77746a]">{r.dueDate}</div>
                <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase ${
                  r.status === "Paid" ? "bg-[#e8f5e9] text-[#6f9068]" :
                  r.status === "Overdue" ? "bg-[#fdecea] text-[#a54c42]" :
                  "bg-[#fff8e1] text-[#b79850]"
                }`}>{r.status}</span>
              </div>
            ))
          ) : (
            <div className="px-5 py-12 text-center text-[#99958a]">No rent records yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: any) {
  return (
    <div className="rounded-xl border border-[#e5dfd1] bg-white p-4">
      <div className="text-[11px] font-bold uppercase tracking-[.16em] text-[#99958a]">{title}</div>
      <div className="mt-1 font-display text-[18px] font-bold text-[#252821] {color}">{value}</div>
    </div>
  );
}