export default function TradeStatusBadge({ status }) {
  if (!status || typeof status !== "string") {
    return (
      <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-600">
        UNKNOWN
      </span>
    );
  }

  const colors = {
    INITIATED: "bg-gray-200 text-gray-800",
    SELLER_CONFIRMED: "bg-blue-200 text-blue-800",
    DOCUMENTS_UPLOADED: "bg-indigo-200 text-indigo-800",
    BANK_REVIEWING: "bg-yellow-200 text-yellow-800",
    BANK_APPROVED: "bg-green-200 text-green-800",
    PAYMENT_RELEASED: "bg-emerald-200 text-emerald-800",
    COMPLETED: "bg-green-600 text-white",
    CANCELLED: "bg-red-200 text-red-800",
     DISPUTED: "bg-red-100 text-red-800",
     REJECTED: "bg-red-600 text-white",
  };

  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${
        colors[status] || "bg-gray-100 text-gray-700"
      }`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
