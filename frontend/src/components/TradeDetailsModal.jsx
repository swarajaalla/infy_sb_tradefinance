import { useEffect, useState } from "react";
import TradeStatusBadge from "./TradeStatusBadge";
import api from "../services/api";

const safe = (v) => v ?? "—";

export default function TradeDetailsModal({ tradeId, onClose }) {
    const [trade, setTrade] = useState(null);

    useEffect(() => {
        const load = async () => {
            const res = await api.get(`/trades/${tradeId}`);
            setTrade(res.data);
        };
        load();
    }, [tradeId]);

    if (!trade) return null;

    const t = trade.trade || trade; // 🔑 backend compatibility

    return (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center">
            <div className="bg-white max-w-3xl w-full max-h-[85vh] overflow-y-auto rounded-xl p-6 relative">

                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500"
                >
                    ✕
                </button>

                <h2 className="text-xl font-semibold mb-6">
                    TRD-{safe(t.id)}
                </h2>

                {/* INFO */}
                <div className="grid grid-cols-3 gap-6 text-sm">
                    <div>
                        <p className="text-slate-500">Buyer</p>
                        <p>{safe(t.buyer?.email || t.buyer_id)}</p>
                    </div>

                    <div>
                        <p className="text-slate-500">Seller</p>
                        <p>{safe(t.seller?.email || t.seller_id)}</p>
                    </div>

                    <div>
                        <p className="text-slate-500">Amount</p>
                        <p>{safe(t.currency)} {safe(t.amount)}</p>
                    </div>
                </div>

                {/* DESCRIPTION */}
                <div className="mt-6">
                    <p className="text-slate-500 text-sm">Description</p>
                    <p>{safe(t.description)}</p>
                </div>

                {/* STATUS */}
                <div className="mt-6 flex items-center gap-3">
                    <p className="text-slate-500 text-sm">Current Status</p>
                    {trade.status === "REJECTED" && (
                        <p className="mt-2 text-sm text-red-600 font-medium">
                            This trade was rejected by the seller.
                        </p>
                    )}

                    <TradeStatusBadge status={t.status} />
                </div>

                {/* STATUS HISTORY */}
                {Array.isArray(trade.status_history) && (
                    <div className="mt-8">
                        <p className="font-medium mb-4">Status History</p>

                        <div className="relative ml-4 space-y-6">
                            <div className="absolute left-1 top-0 bottom-0 w-px bg-slate-200" />

                            {trade.status_history.map((s, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-3 h-3 bg-blue-600 rounded-full mt-1.5" />
                                    <div>
                                        <p className="font-medium">{s.status.replaceAll("_", " ")}</p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(s.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
