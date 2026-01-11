const Input = ({ className = "", ...props }) => (
  <input
    {...props}
    className={`w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${className}`}
  />
);

export default Input;
