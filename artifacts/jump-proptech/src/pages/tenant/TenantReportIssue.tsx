import { useState } from "react";
import { useWorkspace } from "@/state/app";
import { api } from "@/lib/api";
import { HardHat } from "lucide-react";

export default function TenantReportIssue() {
  const { data, run } = useWorkspace();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [propertyId, setPropertyId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const properties = data.properties;
  const units = data.units.filter((u: any) => !propertyId || u.propertyId === propertyId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const result = await run("/tenant/maintenance", "POST", {
        propertyId, unitId, title, description, priority,
      });
      if (result === null) {
        setMessage({ type: "success", text: "Maintenance issue reported successfully!" });
        setTitle(""); setDescription(""); setPriority("Medium"); setPropertyId(""); setUnitId("");
      } else {
        setMessage({ type: "error", text: result });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to report issue." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-[#262a2d] rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[#c5a55a] text-[11px] font-bold tracking-[.2em] uppercase">Report Issue</div>
            <h1 className="mt-1 font-display text-[28px] font-extrabold">Maintenance Request</h1>
            <p className="mt-1 text-white/60">Report a maintenance issue for your unit</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c5a55a]/20 text-[15px] font-bold text-[#e4ce97]">HH</div>
        </div>
      </div>

      {message && (
        <div className={`rounded-xl p-4 text-sm ${message.type === "success" ? "bg-[#e8f5e9] border border-[#81c784] text-[#2e7d32]" : "bg-[#fdecea] border border-[#e57373] text-[#c62828]"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-xl border border-[#e5dfd1] bg-white p-6 space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-[12px] font-semibold text-[#77746a]">Property</label>
            <select value={propertyId} onChange={(e) => setPropertyId(e.target.value)} className="w-full rounded-lg border border-[#e5dfd1] bg-[#faf9f5] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#b79850]">
              <option value="">Select a property</option>
              {properties.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[12px] font-semibold text-[#77746a]">Unit</label>
            <select value={unitId} onChange={(e) => setUnitId(e.target.value)} className="w-full rounded-lg border border-[#e5dfd1] bg-[#faf9f5] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#b79850]" disabled={!propertyId}>
              <option value="">Select a unit</option>
              {units.map((u: any) => <option key={u.id} value={u.id}>{u.number}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-semibold text-[#77746a]">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Leaking kitchen tap" className="w-full rounded-lg border border-[#e5dfd1] bg-[#faf9f5] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#b79850]" />
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-semibold text-[#77746a]">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue in detail..." rows={4} className="w-full rounded-lg border border-[#e5dfd1] bg-[#faf9f5] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#b79850]" />
        </div>

        <div className="space-y-2">
          <label className="text-[12px] font-semibold text-[#77746a]">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full rounded-lg border border-[#e5dfd1] bg-[#faf9f5] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#b79850]">
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={submitting || !title || !description || !propertyId || !unitId}
          className="w-full rounded-lg bg-[#b79850] px-5 py-3 text-white font-semibold hover:bg-[#9c7b4a] disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {submitting ? "Submitting…" : "Report Issue"}
        </button>
      </form>

      <div className="rounded-xl border border-[#e5dfd1] bg-[#faf9f5] p-5">
        <div className="flex items-start gap-3">
          <HardHat className="text-[#b79850] mt-0.5" size={20} />
          <div>
            <h3 className="font-semibold text-[#252821]">How it works</h3>
            <p className="mt-1 text-sm text-[#77746a]">
              Submit your maintenance request and our tech team will review it.
              You can track the status in "My Maintenance".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}