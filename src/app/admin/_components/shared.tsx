"use client";

export const EASE = [0.16, 1, 0.3, 1] as const;

export const glassStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.09)",
};

export function Glass({ className, children, style, ...rest }: { className?: string; children: React.ReactNode; style?: React.CSSProperties } & React.CSSProperties) {
  return (
    <div className={className} style={{ ...glassStyle, ...style, ...rest }}>
      {children}
    </div>
  );
}

export const tableHeaderCls = "text-[10px] font-bold text-white/25 uppercase tracking-[0.18em]";

export const inputCls =
  "w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3.5 text-white text-[14px] font-medium placeholder:text-white/20 focus:outline-none focus:border-indigo-400/40 focus:bg-white/[0.05] focus:ring-2 focus:ring-indigo-500/20 transition-all";

export const labelCls = "block text-[10px] font-bold text-white/30 uppercase tracking-[0.15em] mb-2";

export function LoadingSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-white/[0.03]">
          {Array.from({ length: cols }).map((_, c) => (
            <td key={c} className="px-8 py-5">
              <div
                className="h-5 rounded-lg animate-pulse"
                style={{ background: "rgba(255,255,255,0.04)", width: c === 0 ? "70%" : c === 2 ? "30%" : "50%" }}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export function StatusBadge({ status, glow = false }: { status: string; glow?: boolean }) {
  const config: Record<string, { bg: string; text: string; border: string; label: string }> = {
    active:  { bg: "bg-emerald-500/[0.08]", text: "text-emerald-400/70", border: "border-emerald-500/[0.1]", label: "Active" },
    paid:    { bg: "bg-emerald-500/[0.08]", text: "text-emerald-400/70", border: "border-emerald-500/[0.1]", label: "Paid" },
    pending: { bg: "bg-amber-500/[0.08]",   text: "text-amber-400/70",   border: "border-amber-500/[0.1]",   label: "Pending" },
    failed:  { bg: "bg-red-500/[0.08]",      text: "text-red-400/70",     border: "border-red-500/[0.1]",     label: "Failed" },
  };
  const c = config[status] || { bg: "bg-white/[0.04]", text: "text-white/40", border: "border-white/[0.06]", label: status };
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full border ${c.bg} ${c.text} ${c.border}`}>
      {glow && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" style={{ boxShadow: "0 0 4px currentColor" }} />
      )}
      {c.label}
    </span>
  );
}
