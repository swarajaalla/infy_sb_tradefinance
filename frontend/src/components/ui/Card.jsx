const Card = ({ children, className = "" }) => (
  <div
    className={`rounded-2xl border bg-white/80 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
  >
    {children}
  </div>
);

export default Card;
