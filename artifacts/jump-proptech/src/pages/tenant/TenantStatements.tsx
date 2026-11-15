import { useState } from "react";
import { useWorkspace } from "@/state/app";
import { api } from "@/lib/api";
import { money } from "@/domain";
import { jsPDF } from "jspdf";
import { FileText, Download, Clock } from "lucide-react";

type Period = "1month" | "3months" | "6months" | "12months";

const PERIODS: Record<Period, { label: string; months: number }> = {
  "1month": { label: "1 Month", months: 1 },
  "3months": { label: "3 Months", months: 3 },
  "6months": { label: "6 Months", months: 6 },
  "12months": { label: "12 Months", months: 12 },
};

export default function TenantStatements() {
  const { data } = useWorkspace();
  const [period, setPeriod] = useState<Period>("12months");
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadStatement = async () => {
    setLoading(true);
    try {
      const result = await api<any>(`/tenant/statement/${period}`);
      setStatement(result);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!statement) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.setTextColor(50, 50, 50);
    doc.text("Jump PropTech - Rent Statement", 20, 20);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Tenant: ${statement.tenant.name}`, 20, 35);
    doc.text(`Email: ${statement.tenant.email}`, 20, 45);
    doc.text(`Period: ${PERIODS[period].label}`, 20, 55);
    doc.text(`Generated: ${new Date(statement.generatedAt).toLocaleDateString()}`, 20, 65);

    let y = 80;
    doc.setFontSize(11);
    doc.text("Month", 20, y);
    doc.text("Amount (ZAR)", 80, y);
    doc.text("Due Date", 130, y);
    doc.text("Status", 170, y);
    y += 10;

    for (const record of statement.records) {
      doc.text(record.month, 20, y);
      doc.text(`R ${record.amount}`, 80, y);
      doc.text(record.dueDate, 130, y);
      doc.text(record.status, 170, y);
      y += 8;
    }

    y += 10;
    doc.setFontSize(12);
    doc.text(`Total Due: R ${statement.summary.totalDue}`, 20, y);
    doc.text(`Total Paid: R ${statement.summary.totalPaid}`, 20, y + 8);
    doc.text(`Outstanding: R ${statement.summary.outstanding}`, 20, y + 16);

    doc.save(`rent-statement-${period}.pdf`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-[#262a2d] rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[#c5a55a] text-[11px] font-bold tracking-[.2em] uppercase">Statements</div>
            <h1 className="mt-1 font-display text-[28px] font-extrabold">Rent Statements</h1>
            <p className="mt-1 text-white/60">Download rent statements as PDF</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c5a55a]/20 text-[15px] font-bold text-[#e4ce97]">RS</div>
        </div>
      </div>
      <div className="rounded-xl border border-[#e5dfd1] bg-white p-5">
        <div className="flex items-center gap-4 mb-5">
          <span className="text-[12px] font-semibold text-[#77746a]">Statement period</span>
          <div className="flex gap-2">
            {Object.entries(PERIODS).map(([key, info]) => (
              <button
                key={key}
                onClick={() => { setPeriod(key as Period); void loadStatement(); }}
                className={`px-3 py-1.5 rounded text-[11px] font-bold uppercase transition ${period === key ? "bg-[#b79850] text-white" : "bg-[#faf9f5] border border-[#e5dfd1] text-[#77746a] hover:bg-[#f0ede6]"}`}
              >
                {info.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={loadStatement}
          disabled={loading}
          className="w-full rounded-lg border border-[#e5dfd1] bg-[#faf9f5] px-4 py-3 text-left text-[13px] font-semibold text-[#252821] hover:bg-[#f0ede6] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <FileText size={16} strokeWidth={2} />
          {loading ? "Loading…" : "Generate Statement"}
        </button>
      </div>

      {statement && (
        <div className="rounded-xl border border-[#e5dfd1] bg-white p-5">
          <div className="grid grid-cols-3 gap-4 mb-5 text-[12px]">
            <div className="p-3 rounded bg-[#faf9f5] border border-[#e5dfd1]">
              <div className="text-[11px] font-bold uppercase text-[#99958a]">Total Due</div>
              <div className="font-display text-[16px] font-bold text-[#252821]">R {statement.summary.totalDue}</div>
            </div>
            <div className="p-3 rounded bg-[#faf9f5] border border-[#e5dfd1]">
              <div className="text-[11px] font-bold uppercase text-[#99958a]">Total Paid</div>
              <div className="font-display text-[16px] font-bold text-[#252821]">R {statement.summary.totalPaid}</div>
            </div>
            <div className="p-3 rounded bg-[#faf9f5] border border-[#e5dfd1]">
              <div className="text-[11px] font-bold uppercase text-[#99958a]">Outstanding</div>
              <div className={`font-display text-[16px] font-bold ${statement.summary.outstanding > 0 ? "text-[#a54c42]" : "text-[#6f9068]"}`}>
                R {statement.summary.outstanding}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#e5dfd1] bg-[#fbfaf7]">
                  <th className="px-4 py-3 font-semibold text-[#77746a]">Month</th>
                  <th className="px-4 py-3 font-semibold text-[#77746a]">Amount</th>
                  <th className="px-4 py-3 font-semibold text-[#77746a]">Due Date</th>
                  <th className="px-4 py-3 font-semibold text-[#77746a]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0ede6]">
                {statement.records.map((r: any) => (
                  <tr key={r.id} className="hover:bg-[#faf9f5]">
                    <td className="px-4 py-3 text-[#252821]">{r.month}</td>
                    <td className="px-4 py-3 font-mono">{money(r.amount)}</td>
                    <td className="px-4 py-3 text-[#77746a]">{r.dueDate}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-[11px] font-bold uppercase ${r.status === "Paid" ? "bg-[#e8f5e9] text-[#6f9068]" : r.status === "Overdue" ? "bg-[#fdecea] text-[#a54c42]" : "bg-[#fff8e1] text-[#b79850]"}`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              onClick={downloadPDF}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-[#b79850] px-5 py-3 text-white font-semibold hover:bg-[#9c7b4a] disabled:opacity-50"
            >
              <Download size={18} strokeWidth={2} />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}