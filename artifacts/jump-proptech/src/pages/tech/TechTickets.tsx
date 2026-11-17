import { useEffect, useState } from "react";
import { useWorkspace } from "@/state/app";
import { api } from "@/lib/api";
import { HardHat, Clock } from "lucide-react";

export default function TechTickets() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const result = await api<any[]>("/tech/tickets");
        setTickets(result);
      } catch {
        // Silent
      } finally {
        setLoading(false);
      }
    };
    void fetch();
  }, []);

  const openCount = tickets.filter((t) => t.status !== "Resolved").length;

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f5ef]">
      <div className="h-[2px] w-32 overflow-hidden rounded-full bg-[#e5dfd1]"><span className="block h-full w-full animate-pulse rounded-full bg-[#b79850]" /></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-[#262a2d] rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[#c5a55a] text-[11px] font-bold tracking-[.2em] uppercase">Maintenance Queue</div>
            <h1 className="mt-1 font-display text-[28px] font-extrabold">All Tickets</h1>
            <p className="mt-1 opacity-60 text-white">Manage and resolve maintenance requests</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c5a55a] text-[15px] font-bold text-[#e4ce97]">TQ</div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard title="Open Tickets" value={openCount} color="text-[#b79850]" />
        <StatCard title="Total Tickets" value={tickets.length} color="text-[#6f9068]" />
      </div>

      <div className="rounded-xl border border-[#e5dfd1] bg-white">
        <div className="border-b border-[#e5dfd1] bg-[#fbfaf7] px-5 py-3">
          <div className="grid grid-cols-5 gap-4 text-[12px] font-semibold text-[#77746a]">
            <div>Title</div>
            <div>Priority</div>
            <div>Status</div>
            <div>Created</div>
            <div>&nbsp;</div>
          </div>
        </div>
        <div className="divide-y divide-[#f0ede6]">
          {tickets.length > 0 ? (
            tickets.map((t: any) => (
              <div key={t.id} className="px-5 py-3 flex items-center gap-4 text-[13px] cursor-pointer hover:bg-[#faf9f5] transition" onClick={() => setSelected(t.id)}>
                <div className="min-w-0">
                  <div className="font-medium text-[#252821] truncate">{t.title}</div>
                  <div className="text-[11px] text-[#77746a]">{t.description?.slice(0, 60)}...</div>
                </div>
                <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase ${t.priority === "High" ? "bg-[#fdecea] text-[#a54c42]" : t.priority === "Medium" ? "bg-[#fff8e1] text-[#b79850]" : "bg-[#e8f5e9] text-[#6f9068]"}`}>{t.priority}</span>
                <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase ${t.status === "Resolved" ? "bg-[#e8f5e9] text-[#6f9068]" : t.status === "In progress" ? "bg-[#fff8e1] text-[#b79850]" : "bg-[#fdecea] text-[#a54c42]"}`}>{t.status}</span>
                <div className="text-[#77746a]">{t.createdAt}</div>
                <div className="ml-auto text-[#c5a55a] font-semibold">View</div>
              </div>
            ))
          ) : (
            <div className="px-5 py-12 text-center text-[#99958a]">No maintenance tickets yet.</div>
          )}
        </div>
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 bg-[#12151b] backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-96 bg-white border-l border-[#e5dfd1] p-6 max-h-full overflow-y-auto flex flex-col gap-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[18px] font-bold text-[#252821]">Ticket Details</h2>
              <button onClick={() => setSelected(null)} className="text-[#77746a] hover:text-[#252821]">&times;</button>
            </div>
            {tickets.find((t) => t.id === selected) && (
              <div className="space-y-4">
                <div>
                  <div className="text-[11px] font-bold uppercase text-[#99958a]">Title</div>
                  <div className="font-medium text-[#252821]">{tickets.find((t) => t.id === selected)!.title}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase text-[#99958a]">Description</div>
                  <div className="text-[#77746a]">{tickets.find((t) => t.id === selected)!.description}</div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-[11px] font-bold uppercase text-[#99958a]">Priority</div>
                    <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase ${tickets.find((t) => t.id === selected)!.priority === "High" ? "bg-[#fdecea] text-[#a54c42]" : tickets.find((t) => t.id === selected)!.priority === "Medium" ? "bg-[#fff8e1] text-[#b79850]" : "bg-[#e8f5e9] text-[#6f9068]"}`}>
                      {tickets.find((t) => t.id === selected)!.priority}
                    </span>
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase text-[#99958a]">Status</div>
                    <select className="w-full rounded-lg border border-[#e5dfd1] bg-[#faf9f5] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#b79850]" defaultValue={tickets.find((t) => t.id === selected)!.status} onChange={(e: any) => {
                      // Status update would go here - needs PATCH tech/tickets/:id
                    }}>
                      <option value="Open">Open</option>
                      <option value="In progress">In progress</option>
                      <option value="Resolved">Resolved</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )
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