import { useEffect, useState, useRef } from "react";
import Layout from "../components/Layout";
import {
  getRiskSummary,
  exportRiskCSV,
  getTradeRisk,
} from "../services/riskApi";
import { listTrades } from "../services/tradeApi";

/* ===== CHARTS ===== */
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

/* ===== PDF ===== */
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function RiskDashboard() {
  const [summary, setSummary] = useState(null);
  const [trades, setTrades] = useState([]);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [loadingRisk, setLoadingRisk] = useState(false);

  const pdfRef = useRef();

  useEffect(() => {
    loadSummary();
    loadTrades();
  }, []);

  const loadSummary = async () => {
    const res = await getRiskSummary();
    setSummary(res.data);
  };

  const loadTrades = async () => {
    const res = await listTrades();
    setTrades(res.data);
  };

  const handleViewRisk = async (tradeId) => {
    setLoadingRisk(true);
    const res = await getTradeRisk(tradeId);
    setSelectedRisk(res.data);
    setLoadingRisk(false);
  };

  const handleCSVExport = async () => {
    const res = await exportRiskCSV();
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "risk_report.csv");
    document.body.appendChild(link);
    link.click();
  };

  /* ================= OPTION C: PDF EXPORT ================= */
  const handlePDFExport = async () => {
    const element = pdfRef.current;

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const imgWidth = 190;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.setFontSize(18);
    pdf.text("Trade Risk Analytics Report", 10, 15);

    pdf.addImage(imgData, "PNG", 10, 25, imgWidth, imgHeight);

    pdf.save("risk_report.pdf");
  };

  if (!summary) return <Layout>Loading...</Layout>;

  const chartData = [
    { name: "Low", value: summary.low_risk },
    { name: "Medium", value: summary.medium_risk },
    { name: "High", value: summary.high_risk },
  ];

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Risk Dashboard</h1>

      {/* ===== EXPORT BUTTONS ===== */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleCSVExport}
          className="bg-indigo-600 text-white px-4 py-2 rounded"
        >
          Export CSV
        </button>

        <button
          onClick={handlePDFExport}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Export PDF
        </button>
      </div>

      {/* ===== PDF CONTENT ===== */}
      <div ref={pdfRef}>
        {/* SUMMARY */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card title="Total Trades" value={summary.total_trades} />
          <Card title="Low Risk" value={summary.low_risk} color="green" />
          <Card title="Medium Risk" value={summary.medium_risk} color="yellow" />
          <Card title="High Risk" value={summary.high_risk} color="red" />
        </div>

        {/* CHART */}
        <div className="bg-white rounded-xl shadow p-6 mb-10">
          <h2 className="text-xl font-semibold mb-4">
            Risk Distribution
          </h2>

          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ===== TRADE LIST ===== */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Trades</h2>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Trade ID</th>
              <th className="py-2 text-left">Amount</th>
              <th className="py-2 text-left">Currency</th>
              <th className="py-2 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} className="border-b">
                <td>{trade.id}</td>
                <td>{trade.amount}</td>
                <td>{trade.currency}</td>
                <td>
                  <button
                    onClick={() => handleViewRisk(trade.id)}
                    className="text-indigo-600 hover:underline"
                  >
                    View Risk
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRisk && (
        <div className="mt-6 bg-gray-50 border rounded-xl p-6">
          <h3 className="text-lg font-semibold">
            Risk Analysis — Trade #{selectedRisk.trade_id}
          </h3>
          <p>Score: {selectedRisk.risk_score}</p>
          <p>Level: {selectedRisk.risk_level}</p>
        </div>
      )}
    </Layout>
  );
}

/* ===== CARD ===== */
function Card({ title, value, color = "gray" }) {
  const colors = {
    green: "bg-green-100 text-green-700",
    yellow: "bg-yellow-100 text-yellow-700",
    red: "bg-red-100 text-red-700",
    gray: "bg-gray-100 text-gray-700",
  };

  return (
    <div className={`p-6 rounded-xl ${colors[color]}`}>
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
