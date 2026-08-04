"use client";

import { useState } from "react";

export interface GradebookCellData {
  submissionId: string;
  status: string;
  total: number | null;
  feedback: string;
}

export interface GradebookRow {
  studentId: string;
  studentName: string;
  cells: Record<string, GradebookCellData>; // keyed by projectId
}

export interface GradebookColumn {
  projectId: string;
  title: string;
  maxPoints: number;
}

function Cell({ data }: { data: GradebookCellData }) {
  const [total, setTotal] = useState(data.total?.toString() ?? "");
  const [feedback, setFeedback] = useState(data.feedback);
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  async function save() {
    setState("saving");
    try {
      const response = await fetch(`/api/submissions/${data.submissionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grade: { rubricScores: {}, total: Number(total) || 0, feedback: feedback || undefined },
        }),
      });
      if (!response.ok) throw new Error();
      setState("saved");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex min-w-32 flex-col gap-1">
      <input
        type="number"
        value={total}
        onChange={(e) => setTotal(e.target.value)}
        onBlur={save}
        className="w-16 rounded border border-cinema-border bg-cinema-black/40 px-1 py-0.5 text-sm text-cinema-white"
        placeholder="—"
      />
      <input
        type="text"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        onBlur={save}
        placeholder="feedback"
        className="w-32 rounded border border-cinema-border bg-cinema-black/40 px-1 py-0.5 text-xs text-cinema-white"
      />
      <span className="text-[10px] text-cinema-muted">
        {state === "saving" ? "saving…" : state === "saved" ? "saved" : state === "error" ? "error" : data.status}
      </span>
    </div>
  );
}

export function GradebookGrid({ columns, rows }: { columns: GradebookColumn[]; rows: GradebookRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr>
            <th className="border-b border-cinema-border p-2 text-cinema-white">Student</th>
            {columns.map((col) => (
              <th key={col.projectId} className="border-b border-cinema-border p-2 text-cinema-white">
                {col.title}
                <div className="text-xs font-normal text-cinema-muted">
                  /{col.maxPoints}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.studentId}>
              <td className="border-b border-cinema-border/60 p-2 align-top text-cinema-white">{row.studentName}</td>
              {columns.map((col) => {
                const cell = row.cells[col.projectId];
                return (
                  <td key={col.projectId} className="border-b border-cinema-border/60 p-2 align-top">
                    {cell ? <Cell data={cell} /> : <span className="text-cinema-muted/50">—</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
