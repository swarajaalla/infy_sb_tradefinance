import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";


export default function TradeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [trade, setTrade] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const tradeRes = await api.get(`/trades/${id}`);
        const timelineRes = await api.get(`/trades/${id}/timeline`);
        const userRes = await api.get("/auth/me");
        setTrade(tradeRes.data);
        setTimeline(timelineRes.data);

        setCurrentUser(userRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  if (loading) return <p className="p-6">Loading...</p>;
  if (!trade) return <p className="p-6 text-red-600">Trade not found</p>;
 console.log("===== DEBUG CONFIRM BUTTON =====");
console.log("currentUser:", currentUser);
console.log("currentUser.id:", currentUser?.id);
console.log("trade.seller_id:", trade?.seller_id);
console.log("trade.status:", trade?.status);
console.log(
  "ID MATCH:",
  currentUser && trade && currentUser.id === trade.seller_id
);


  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* HEADER */}
      <div className="bg-white p-6 rounded shadow mb-6">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Trade #{trade.id}</h2>
          <button onClick={() => navigate(-1)} className="border px-3 py-1 rounded">
            ← Back
          </button>
        </div>

        <p><b>Buyer:</b> {trade.buyer_id}</p>
        <p><b>Seller:</b> {trade.seller_id}</p>
        <p><b>Amount:</b> {trade.amount} {trade.currency}</p>
        <p><b>Status:</b> {trade.status}</p>
      </div>
      {/* SELLER ACTIONS */}
{trade.status === "INITIATED" &&
  currentUser &&
  Number(currentUser.id) === Number(trade.seller_id) && (
    <button
      onClick={async () => {
        try {
          await api.post(`/trades/${id}/confirm`);
          const tradeRes = await api.get(`/trades/${id}`);
          const timelineRes = await api.get(`/trades/${id}/timeline`);
          setTrade(tradeRes.data);
          setTimeline(timelineRes.data);
        } catch (err) {
          console.error(err);
        }
      }}
      className="btn-primary mb-6"
    >
      Confirm Trade
    </button>
)}


      {/* TIMELINE ONLY */}
      <div className="bg-white p-6 rounded shadow">
        <h3 className="text-xl font-semibold mb-4">Trade Timeline</h3>

        <div className="border-l-4 border-indigo-500 pl-4 space-y-4">
          {timeline.length === 0 ? (
            <p className="text-gray-500">No timeline events yet</p>
          ) : (
            timeline.map((item, index) => (
              <div key={index}>
                <p className="font-semibold">{item.action}</p>
                <p className="text-sm text-gray-500">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
