const DashboardStats = ({ stats }) => {
  const cards = [
    {
      label: "Total Trades",
      value: stats.totalTrades,
      color: "bg-indigo-50 text-indigo-700",
    },
    {
      label: "Active Trades",
      value: stats.activeTrades,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Completed Trades",
      value: stats.completedTrades,
      color: "bg-green-50 text-green-700",
    },
    {
      label: "Documents Uploaded",
      value: stats.documents,
      color: "bg-purple-50 text-purple-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`rounded-xl border p-5 shadow-sm ${card.color}`}
        >
          <p className="text-sm font-medium">{card.label}</p>
          <p className="text-3xl font-bold mt-2">{card.value}</p>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;
