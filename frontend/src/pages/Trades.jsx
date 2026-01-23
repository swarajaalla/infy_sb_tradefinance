import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../auth/AuthContext";
import { useToast } from "../context/ToastContext";

import PageSection from "../components/ui/PageSection";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const STATUS_COLORS = {
  INITIATED: "bg-slate-100 text-slate-700 border border-slate-300",
  SELLER_CONFIRMED: "bg-blue-50 text-blue-700 border border-blue-300",
  DOCUMENTS_UPLOADED: "bg-indigo-50 text-indigo-700 border border-indigo-300",
  BANK_ASSIGNED: "bg-purple-50 text-purple-700 border border-purple-300",
  SHIPPED: "bg-cyan-50 text-cyan-700 border border-cyan-300",
  BANK_REVIEWING: "bg-yellow-50 text-yellow-700 border border-yellow-300",
  BANK_APPROVED: "bg-green-50 text-green-700 border border-green-300",
  PAYMENT_RELEASED: "bg-emerald-50 text-emerald-700 border border-emerald-300",
  COMPLETED: "bg-green-100 text-green-800 border border-green-400",
  CANCELLED: "bg-red-50 text-red-700 border border-red-300",
  DISPUTED: "bg-orange-50 text-orange-700 border border-orange-300",
};

const STATUS_REMARKS = {
  SELLER_CONFIRMED: "Seller confirmed the trade",
  DOCUMENTS_UPLOADED: "Documents uploaded by seller",
  BANK_ASSIGNED: "Bank assigned",
  SHIPPED: "Goods shipped",
  BANK_REVIEWING: "Bank started review",
  BANK_APPROVED: "Bank approved trade",
  PAYMENT_RELEASED: "Payment released",
  COMPLETED: "Trade completed",
  CANCELLED: "Trade cancelled",
  DISPUTED: "Trade disputed",
};

const Trades = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const role = user.role.toLowerCase();

  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({
    seller_email: "",
    description: "",
    amount: "",
    currency: "USD",
  });

  const [assignTradeId, setAssignTradeId] = useState(null);
  const [bankEmail, setBankEmail] = useState("");

  const loadTrades = async () => {
    try {
      setLoading(true);
      const res = await api.get("/trades/");
      setTrades(res.data);
    } catch {
      toast.error("Failed to load trades");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrades();
  }, []);

  const createTrade = async (e) => {
    e.preventDefault();
    try {
      await api.post("/trades/", {
        seller_email: createForm.seller_email,
        description: createForm.description,
        amount: Number(createForm.amount),
        currency: createForm.currency,
      });
      toast.success("Trade created");
      setShowCreate(false);
      setCreateForm({
        seller_email: "",
        description: "",
        amount: "",
        currency: "USD",
      });
      loadTrades();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create trade");
    }
  };

  const updateStatus = async (tradeId, status) => {
    try {
      await api.patch(`/trades/${tradeId}/status`, {
        status,
        remarks: STATUS_REMARKS[status],
      });
      toast.success(STATUS_REMARKS[status] || "Updated");
      loadTrades();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Status update failed");
    }
  };

  const assignBank = async () => {
    if (!bankEmail) {
      toast.error("Enter bank email");
      return;
    }
    try {
      await api.post(`/trades/${assignTradeId}/assign-bank`, {
        bank_email: bankEmail,
      });
      toast.success("Bank assigned");
      setAssignTradeId(null);
      setBankEmail("");
      loadTrades();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to assign bank");
    }
  };

  if (loading) return <p className="text-slate-600">Loading trades...</p>;

  return (
    <PageSection>
      <div className="space-y-10">
        {role === "corporate" && (
          <Button className="w-fit" onClick={() => setShowCreate(!showCreate)}>
            + Create New Trade
          </Button>
        )}

        {showCreate && (
          <Card className="p-6 space-y-4 max-w-xl">
            <h2 className="font-semibold text-lg">New Trade</h2>

            <input
              className="input"
              placeholder="Seller Email"
              value={createForm.seller_email}
              onChange={(e) =>
                setCreateForm({ ...createForm, seller_email: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="Description"
              value={createForm.description}
              onChange={(e) =>
                setCreateForm({ ...createForm, description: e.target.value })
              }
            />
            <input
              type="number"
              className="input"
              placeholder="Amount"
              value={createForm.amount}
              onChange={(e) =>
                setCreateForm({ ...createForm, amount: e.target.value })
              }
            />
            <input
              className="input"
              placeholder="Currency"
              value={createForm.currency}
              onChange={(e) =>
                setCreateForm({ ...createForm, currency: e.target.value })
              }
            />

            <div className="flex gap-3">
              <Button onClick={createTrade}>Create</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {trades.map((t) => (
            <Card key={t.id} className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs uppercase text-slate-400">
                    Trade #{t.trade_number}
                  </p>
                  <p className="text-lg font-semibold">{t.description}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[t.status]}`}
                >
                  {t.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                <p><b>Buyer:</b> {t.buyer?.org_name}</p>
                <p><b>Seller:</b> {t.seller?.org_name}</p>
                <p><b>Bank:</b> {t.bank?.org_name || "—"}</p>
                <p><b>Amount:</b> {t.amount} {t.currency}</p>
              </div>

              <div className="pt-4 border-t flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/trades/${t.id}`)}
                >
                  View Details →
                </Button>

                {/* SELLER */}
                {role === "corporate" && user.id === t.seller_id && t.status === "INITIATED" && (
                  <Button onClick={() => updateStatus(t.id, "SELLER_CONFIRMED")}>
                    Confirm Trade
                  </Button>
                )}

                {role === "corporate" && user.id === t.seller_id && t.status === "SELLER_CONFIRMED" && (
                  <Button onClick={() => navigate(`/documents?trade_id=${t.id}`)}>
                    Upload Documents
                  </Button>
                )}

                {role === "corporate" && user.id === t.seller_id && t.status === "BANK_ASSIGNED" && (
                  <Button onClick={() => updateStatus(t.id, "SHIPPED")}>
                    Mark as Shipped
                  </Button>
                )}

                {/* BUYER */}
                {role === "corporate" && user.id === t.buyer_id && t.status === "DOCUMENTS_UPLOADED" && (
                  <Button onClick={() => setAssignTradeId(t.id)}>
                    Assign Bank
                  </Button>
                )}

                {role === "corporate" && user.id === t.buyer_id && t.status === "PAYMENT_RELEASED" && (
                  <Button onClick={() => updateStatus(t.id, "COMPLETED")}>
                    Confirm Completion
                  </Button>
                )}

                {/* BANK */}
              {role === "bank" && user.id === t.bank_id &&
                ["BANK_ASSIGNED", "SHIPPED"].includes(t.status) && (
                <Button onClick={() => updateStatus(t.id, "BANK_REVIEWING")}>
                  Start Review
                </Button>
              )}

                {role === "bank" && user.id === t.bank_id && t.status === "BANK_REVIEWING" && (
                  <Button onClick={() => updateStatus(t.id, "BANK_APPROVED")}>
                    Approve Trade
                  </Button>
                )}

                {role === "bank" && user.id === t.bank_id && t.status === "BANK_APPROVED" && (
                  <Button onClick={() => updateStatus(t.id, "PAYMENT_RELEASED")}>
                    Release Payment
                  </Button>
                )}

                {/* CANCEL */}
                {role === "corporate" &&
                  (user.id === t.buyer_id || user.id === t.seller_id) &&
                  ["INITIATED", "SELLER_CONFIRMED", "DOCUMENTS_UPLOADED"].includes(t.status) && (
                    <Button
                      variant="outline"
                      className="border-red-300 text-red-600"
                      onClick={() => updateStatus(t.id, "CANCELLED")}
                    >
                      Cancel Trade
                    </Button>
                  )}

                {/* DISPUTE */}
                {role === "bank" &&
                  user.id === t.bank_id &&
                  ["SHIPPED", "BANK_REVIEWING"].includes(t.status) && (
                    <Button
                      variant="outline"
                      className="border-orange-300 text-orange-600"
                      onClick={() => updateStatus(t.id, "DISPUTED")}
                    >
                      Raise Dispute
                    </Button>
                  )}

                {/* CANCEL AFTER DISPUTE */}
                {t.status === "DISPUTED" &&
                  ((role === "bank" && user.id === t.bank_id) ||
                    (role === "corporate" && user.id === t.buyer_id)) && (
                    <Button
                      className="bg-red-600 text-white"
                      onClick={() => updateStatus(t.id, "CANCELLED")}
                    >
                      Cancel After Dispute
                    </Button>
                  )}
              </div>
            </Card>
          ))}
        </div>

        {assignTradeId && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <Card className="p-6 w-full max-w-md">
              <h2 className="text-lg font-semibold">Assign Bank</h2>
              <input
                className="input mt-4"
                placeholder="bank@example.com"
                value={bankEmail}
                onChange={(e) => setBankEmail(e.target.value)}
              />
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={() => setAssignTradeId(null)}>
                  Cancel
                </Button>
                <Button onClick={assignBank}>Assign Bank</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </PageSection>
  );
};

export default Trades;
