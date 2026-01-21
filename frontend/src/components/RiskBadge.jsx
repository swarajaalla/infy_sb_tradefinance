export default function RiskBadge({ level }) {
  const styles = {
    LOW: "bg-emerald-100 text-emerald-700",
    MEDIUM: "bg-yellow-100 text-yellow-700",
    HIGH: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`px-3 py-1 text-xs rounded-full font-medium ${
        styles[level] || "bg-slate-200 text-slate-600"
      }`}
    >
      {level || "UNKNOWN"}
    </span>
  );
}
