import { useEffect, useState } from "react";
import { useWorkspace } from "@/state/app";
import { api } from "@/lib/api";
import { Wrench, Clock, FileText, ChevronRight } from "lucide-react";

export default function TenantMaintenance() {
  const { data, userTenantId } = useWorkspace();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await api<any[]>("/tenant/maintenance");
        setRequests(result);
      } catch {
        // Silent
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, []);

  const openCount = requests.filter((r) => r.status !== "Resolved").length;

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
            <div className="text-[#c5a55a] text-[11px] font-bold tracking-[.2em] uppercase">My Maintenance</div>
            <h1 className="mt-1 font-display text-[28px] font-extrabold">Service Requests</h1>
            <p className="mt-1 text-white/60">Track maintenance issues and status</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c5a55a]/20 text-[15px] font-bold text-[#e4ce97]">MM</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Open Tickets" value={openCount} color="text-[#b79850]" />
        <StatCard title="Total Requests" value={requests.length} color="text-[#6f9068]" />
      </div>

      <div className="rounded-xl border border-[#e5dfd1] bg-white">
        <div className="border-b border-[#e5dfd1] bg-[#fbfaf7] px-5 py-3">
          <div className="grid grid-cols-4 gap-4 text-[12px] font-semibold text-[#77746a]">
            <div>Title</div>
            <div>Priority</div>
            <div>Status</div>
            <div>Created</div>
          </div>
        </div>
        <div className="divide-y divide-[#f0ede6]">
          {requests.length > 0 ? (
            requests.map((r: any) => (
              <div key={r.id} className="px-5 py-3 flex items-center gap-4 text-[13px]">
                <div className="min-w-0">
                  <div className="font-medium text-[#252821] truncate">{r.title}</div>
                  <div className="text-[11px] text-[#77746a]">{r.description?.slice(0, 60)}...</div>
                </div>
                <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase ${
                  r.priority === "High" ? "bg-[#fdecea] text-[#a54c42]" :
                  r.priority === "Medium" ? "bg-[#fff8e1] text-[#b79850]" :
                  "bg-[#e8f5e9] text-[#6f9068]"
                }`}>{r.priority}</span>
                <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase ${
                  r.status === "Resolved" ? "bg-[#e8f5e9] text-[#6f9068]" :
                  r.status === "In progress" ? "bg-[#fff8e1] text-[#b79850]" :
                  "bg-[#fdecea] text-[#a54c42]"
                }`}>{r.status}</span>
                <div className="text-[#77746a]">{r.createdAt}</div>
              </div>
            ))
          ) : (
            <div className="px-5 py-12 text-center text-[#99958a]">No maintenance requests yet.</div>
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