const styles = {
  primary:
    "bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md hover:shadow-lg hover:brightness-110",
  outline:
    "border border-slate-300 text-slate-700 hover:bg-slate-100 hover:shadow",
  danger:
    "bg-gradient-to-r from-rose-600 to-red-600 text-white shadow-md hover:shadow-lg",
  success:
    "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md hover:shadow-lg",
};

const Button = ({ children, variant = "primary", className = "", ...props }) => (
  <button
    {...props}
    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${styles[variant]} ${className}`}
  >
    {children}
  </button>
);

export default Button;
