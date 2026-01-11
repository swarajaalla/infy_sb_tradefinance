const variants = {
  default: "bg-slate-100 text-slate-700 border border-slate-300",
  success: "bg-green-100 text-green-800 border border-green-300",
  warning: "bg-yellow-100 text-yellow-800 border border-yellow-300",
  danger: "bg-red-100 text-red-800 border border-red-300",
  info: "bg-indigo-100 text-indigo-800 border border-indigo-300",
};

const Badge = ({ children, variant = "default", className = "" }) => (
  <span
    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}
  >
    {children}
  </span>
);

export default Badge;
