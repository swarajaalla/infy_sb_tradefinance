// frontend/src/pages/Trades.jsx
import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api/axios";

// JWT decode function
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode JWT:", error);
    return null;
  }
}

const STATUS_COLORS = {
  INITIATED: "bg-gray-100 text-gray-800",
  SELLER_CONFIRMED: "bg-blue-100 text-blue-800",
  DOCUMENTS_UPLOADED: "bg-purple-100 text-purple-800",
  BANK_REVIEWING: "bg-yellow-100 text-yellow-800",
  BANK_APPROVED: "bg-indigo-100 text-indigo-800",
  PAYMENT_RELEASED: "bg-green-100 text-green-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  CANCELLED: "bg-red-100 text-red-800",
  DISPUTED: "bg-orange-100 text-orange-800",
};

export default function Trades() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userEmail, setUserEmail] = useState("");

  // Create form - UPDATED: Added trade_name field
  const [createForm, setCreateForm] = useState({
    seller_email: "",
    amount: "",
    currency: "USD",
    trade_name: "", // NEW FIELD: Trade Name
    product_details: "",
    payment_terms: "",
  });

  // Assign bank form
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [assignTradeId, setAssignTradeId] = useState("");
  const [bankEmail, setBankEmail] = useState("");

  // Get current user info
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        let role = localStorage.getItem("role") || "";
        let email = localStorage.getItem("email") || "";
        
        // If no email in localStorage, try to get from JWT token
        if (!email) {
          const token = localStorage.getItem("access_token");
          if (token) {
            const decoded = decodeJWT(token);
            if (decoded && decoded.email) {
              email = decoded.email;
              localStorage.setItem("email", email);
            } else if (decoded && decoded.user_id) {
              try {
                const userRes = await api.get("/users/me");
                if (userRes.data && userRes.data.email) {
                  email = userRes.data.email;
                  localStorage.setItem("email", email);
                }
              } catch (apiErr) {
                console.log("Could not fetch user from API:", apiErr);
              }
            }
          }
        }
        
        setUserRole(role);
        setUserEmail(email);
        
        // REMOVED: No more email prompt
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    };
    
    fetchUserInfo();
    fetchTrades();
  }, []);

  // Fetch trades
  const fetchTrades = async () => {
    try {
      const res = await api.get("/trades");
      setTrades(res.data);
    } catch (err) {
      console.error("Failed to load trades:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch trade history
  const fetchTradeHistory = async (tradeId) => {
    try {
      const res = await api.get(`/ledger/trades/${tradeId}/entries`);
      setTradeHistory(res.data);
      const trade = trades.find(t => t.id === tradeId);
      setSelectedTrade(trade);
      setShowHistory(true);
    } catch (err) {
      console.error("Failed to load trade history:", err);
      alert("Failed to load trade history");
    }
  };

  // Create trade - UPDATED: Include trade_name as description
  const handleCreate = async (e) => {
    e.preventDefault();
    
    const tradeData = {
      seller_email: createForm.seller_email,
      amount: parseFloat(createForm.amount),
      currency: createForm.currency,
      description: createForm.trade_name || null, // Use trade_name as description
      product_details: createForm.product_details ? JSON.parse(createForm.product_details) : null,
      payment_terms: createForm.payment_terms || null,
    };

    try {
      await api.post("/trades", tradeData);
      alert("✓ Trade created successfully");
      setCreateForm({ 
        seller_email: "", 
        amount: "", 
        currency: "USD", 
        trade_name: "", 
        product_details: "", 
        payment_terms: "" 
      });
      setShowCreateForm(false);
      fetchTrades();
    } catch (err) {
      console.error("Create trade error:", err);
      alert(err.response?.data?.detail || "Failed to create trade");
    }
  };

  // Assign bank
  const handleAssignBank = async (e) => {
    e.preventDefault();
    if (!bankEmail) {
      alert("Please enter bank email");
      return;
    }
    
    try {
      await api.post("/trades/assign-bank", {
        trade_id: parseInt(assignTradeId),
        bank_email: bankEmail,
      });
      alert("✓ Bank assigned successfully. Trade status updated to BANK_REVIEWING");
      setShowAssignForm(false);
      setAssignTradeId("");
      setBankEmail("");
      fetchTrades();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to assign bank");
    }
  };

  // Handle seller accepting trade
  const handleSellerAcceptTrade = async (tradeId) => {
    if (window.confirm("Are you sure you want to accept this trade?")) {
      try {
        await api.patch(`/trades/${tradeId}/status`, {
          action: "SELLER_CONFIRMED",
          notes: "Trade accepted by seller",
        });
        
        alert("✓ Trade accepted successfully! You can now upload documents.");
        fetchTrades();
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to accept trade");
      }
    }
  };

  // Handle seller uploading documents
  const handleUploadDocuments = async (tradeId) => {
    if (window.confirm("Mark documents as uploaded? This will update trade status to DOCUMENTS_UPLOADED.")) {
      try {
        await api.patch(`/trades/${tradeId}/status`, {
          action: "DOCUMENTS_UPLOADED",
          notes: "Documents uploaded by seller",
        });
        
        alert("✓ Documents marked as uploaded! Buyer can now assign a bank.");
        fetchTrades();
      } catch (err) {
        alert(err.response?.data?.detail || "Failed to update documents status");
      }
    }
  };

  // Quick status update functions
  const handleQuickStatusUpdate = async (tradeId, action, notes = "") => {
    try {
      await api.patch(`/trades/${tradeId}/status`, {
        action: action,
        notes: notes,
      });
      
      alert(`✓ Status updated to ${action.replace(/_/g, ' ')}`);
      fetchTrades();
      
      // Refresh history if viewing
      if (showHistory && selectedTrade?.id === tradeId) {
        fetchTradeHistory(tradeId);
      }
    } catch (err) {
      alert(err.response?.data?.detail || "Status update failed");
    }
  };

  // Check user permissions - UPDATED FOR AUDITOR
  const isBuyer = (trade) => {
    if (isAuditor() || isAdmin()) return false; // Auditor/Admin don't act as buyer
    const currentEmail = userEmail.trim().toLowerCase();
    const tradeBuyerEmail = (trade.buyer_email || "").trim().toLowerCase();
    return currentEmail === tradeBuyerEmail;
  };
  
  const isSeller = (trade) => {
    if (isAuditor() || isAdmin()) return false; // Auditor/Admin don't act as seller
    const currentEmail = userEmail.trim().toLowerCase();
    const tradeSellerEmail = (trade.seller_email || "").trim().toLowerCase();
    return currentEmail === tradeSellerEmail;
  };
  
  const isBankUser = () => userRole === "bank";
  const isAdmin = () => userRole === "admin";
  const isAuditor = () => userRole === "auditor";
  const isCorporate = () => userRole === "corporate";

  // Get allowed actions for a trade - UPDATED FOR AUDITOR (similar to admin)
  const getAllowedActions = (trade) => {
    const actions = [];
    const currentStatus = trade.status;
    
    // Buyer actions
    if (isBuyer(trade)) {
      // Buyer can assign bank ONLY when documents are uploaded AND no bank assigned yet
      if (currentStatus === "DOCUMENTS_UPLOADED" && !trade.issuing_bank_id) {
        actions.push({ 
          label: "Assign Bank", 
          action: "assign", 
          color: "bg-green-600" 
        });
      }
      
      // Buyer can complete trade after payment released
      if (currentStatus === "PAYMENT_RELEASED") {
        actions.push({ 
          label: "Complete Trade", 
          action: "COMPLETED", 
          color: "bg-emerald-600" 
        });
      }
      
      // Buyer can cancel trade except completed/cancelled
      if (currentStatus !== "CANCELLED" && currentStatus !== "COMPLETED") {
        actions.push({ 
          label: "Cancel Trade", 
          action: "CANCELLED", 
          color: "bg-red-600" 
        });
      }
    }
    
    // Seller actions
    if (isSeller(trade)) {
      // Seller can accept INITIATED trade
      if (currentStatus === "INITIATED") {
        actions.push({ 
          label: "Accept Trade", 
          action: "accept", 
          color: "bg-blue-600" 
        });
      }
      
      // Seller can mark documents uploaded after accepting
      if (currentStatus === "SELLER_CONFIRMED") {
        actions.push({ 
          label: "Mark Documents Uploaded", 
          action: "upload_docs", 
          color: "bg-purple-600" 
        });
      }
      
      // Seller can complete trade after payment released
      if (currentStatus === "PAYMENT_RELEASED") {
        actions.push({ 
          label: "Complete Trade", 
          action: "COMPLETED", 
          color: "bg-emerald-600" 
        });
      }
      
      // Seller can cancel trade except completed/cancelled
      if (currentStatus !== "CANCELLED" && currentStatus !== "COMPLETED") {
        actions.push({ 
          label: "Cancel Trade", 
          action: "CANCELLED", 
          color: "bg-red-600" 
        });
      }
    }
    
    // Bank actions
    if (isBankUser() && trade.issuing_bank_id) {
      // Bank can start review when documents are uploaded
      if (currentStatus === "DOCUMENTS_UPLOADED") {
        actions.push({ 
          label: "Start Review", 
          action: "BANK_REVIEWING", 
          color: "bg-yellow-600" 
        });
      }
      
      // Bank can approve or dispute when reviewing
      if (currentStatus === "BANK_REVIEWING") {
        actions.push({ 
          label: "Approve Trade", 
          action: "BANK_APPROVED", 
          color: "bg-indigo-600" 
        });
        actions.push({ 
          label: "Mark as Disputed", 
          action: "DISPUTED", 
          color: "bg-orange-600" 
        });
      }
      
      // Bank can release payment after approval
      if (currentStatus === "BANK_APPROVED") {
        actions.push({ 
          label: "Release Payment", 
          action: "PAYMENT_RELEASED", 
          color: "bg-green-600" 
        });
      }
      
      // Bank can cancel trade except completed/cancelled
      if (currentStatus !== "CANCELLED" && currentStatus !== "COMPLETED") {
        actions.push({ 
          label: "Cancel Trade", 
          action: "CANCELLED", 
          color: "bg-red-600" 
        });
      }
    }
    
    // Auditor/Admin actions: Can view history
    if (isAuditor() || isAdmin()) {
      actions.push({ 
        label: "View History", 
        action: "view_history", 
        color: "bg-gray-600" 
      });
    }
    
    return actions;
  };

  // Format currency
  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status display name
  const getStatusDisplay = (status) => {
    return status.replace(/_/g, ' ');
  };

  // Render action buttons - UPDATED FOR AUDITOR
  const renderActionButtons = (trade) => {
    const actions = getAllowedActions(trade);
    
    if (actions.length === 0) {
      return null;
    }
    
    return (
      <div className="flex gap-2 mt-3">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              if (action.action === "assign") {
                setAssignTradeId(trade.id);
                setShowAssignForm(true);
              } else if (action.action === "accept") {
                handleSellerAcceptTrade(trade.id);
              } else if (action.action === "upload_docs") {
                handleUploadDocuments(trade.id);
              } else if (action.action === "view_history") {
                // Auditor/Admin clicks "View History"
                fetchTradeHistory(trade.id);
              } else {
                const message = `Are you sure you want to ${action.label.toLowerCase()}?`;
                if (window.confirm(message)) {
                  handleQuickStatusUpdate(trade.id, action.action);
                }
              }
            }}
            className={`px-3 py-1.5 text-white text-sm rounded-lg ${action.color} hover:opacity-90`}
          >
            {action.label}
          </button>
        ))}
      </div>
    );
  };

  // Calculate trade statistics - UPDATED FOR AUDITOR
  const getTradeStats = () => {
    const totalTrades = trades.length;
    const activeTrades = trades.filter(t => !["COMPLETED", "CANCELLED"].includes(t.status)).length;
    const initiatedTrades = trades.filter(t => t.status === "INITIATED").length;
    const sellerConfirmedTrades = trades.filter(t => t.status === "SELLER_CONFIRMED").length;
    const docsUploadedTrades = trades.filter(t => t.status === "DOCUMENTS_UPLOADED").length;
    const inReviewTrades = trades.filter(t => t.status === "BANK_REVIEWING").length;
    const completedTrades = trades.filter(t => t.status === "COMPLETED").length;
    const cancelledTrades = trades.filter(t => t.status === "CANCELLED").length;
    
    // For current user (excluding auditor/admin for personal actions)
    const pendingSellerAction = !isAuditor() && !isAdmin() ? trades.filter(t => 
      isSeller(t) && t.status === "INITIATED"
    ).length : 0;
    
    const pendingBuyerAction = !isAuditor() && !isAdmin() ? trades.filter(t => 
      isBuyer(t) && t.status === "DOCUMENTS_UPLOADED" && !t.issuing_bank_id
    ).length : 0;
    
    // Auditor/Admin specific stats
    const disputedTrades = trades.filter(t => t.status === "DISPUTED").length;
    const highValueTrades = trades.filter(t => t.amount > 100000).length;
    
    return {
      totalTrades,
      activeTrades,
      initiatedTrades,
      sellerConfirmedTrades,
      docsUploadedTrades,
      inReviewTrades,
      completedTrades,
      cancelledTrades,
      pendingSellerAction,
      pendingBuyerAction,
      disputedTrades,
      highValueTrades
    };
  };

  // Get page title based on role
  const getPageTitle = () => {
    if (isCorporate()) return "Your Trades";
    if (isBankUser()) return "Bank Trades";
    if (isAdmin()) return "All Trades";
    if (isAuditor()) return "All Trades (Audit View)";
    return "Trades";
  };

  const stats = getTradeStats();

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Trade Finance</h1>
          <p className="text-gray-600 text-sm">
            Logged in as: <span className="font-semibold">{userEmail}</span> ({userRole})
            {isAuditor() && <span className="ml-2 text-blue-600">👁️ Audit Mode</span>}
            {isAdmin() && <span className="ml-2 text-purple-600">⚙️ Admin Mode</span>}
          </p>
        </div>
        <div className="flex gap-3">
          {isCorporate() && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
            >
              <span>+</span> New Trade
            </button>
          )}
          <button
            onClick={() => {
              setSelectedTrade(null);
              setShowHistory(false);
              setShowCreateForm(false);
              setShowAssignForm(false);
              fetchTrades();
            }}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Create Trade Modal - UPDATED: Added Trade Name field */}
      {showCreateForm && isCorporate() && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Create New Trade</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seller Email *
                    </label>
                    <input
                      type="email"
                      value={createForm.seller_email}
                      onChange={e => setCreateForm({...createForm, seller_email: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="seller@company.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={createForm.amount}
                      onChange={e => setCreateForm({...createForm, amount: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="10000.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency
                    </label>
                    <select
                      value={createForm.currency}
                      onChange={e => setCreateForm({...createForm, currency: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="INR">INR</option>
                    </select>
                  </div>
                  {/* NEW: Trade Name Field */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Trade Name *
                    </label>
                    <input
                      type="text"
                      value={createForm.trade_name}
                      onChange={e => setCreateForm({...createForm, trade_name: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Electronics Import - Q4 2024"
                      required
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Details (Optional JSON)
                    </label>
                    <textarea
                      value={createForm.product_details}
                      onChange={e => setCreateForm({...createForm, product_details: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder='{"product": "Electronics", "quantity": 100, "specifications": {...}}'
                      rows="2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter JSON format product details (optional)
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Payment Terms (Optional)
                    </label>
                    <input
                      type="text"
                      value={createForm.payment_terms}
                      onChange={e => setCreateForm({...createForm, payment_terms: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., Net 30 days"
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
                  >
                    Create Trade
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 border border-gray-300 hover:bg-gray-50 font-medium rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Assign Bank Modal */}
      {showAssignForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Assign Bank to Trade #{assignTradeId}</h2>
                <button
                  onClick={() => setShowAssignForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleAssignBank} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bank Email *
                  </label>
                  <input
                    type="email"
                    value={bankEmail}
                    onChange={e => setBankEmail(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="bank.officer@bank.com"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter email of a registered bank user. Trade will move to BANK_REVIEWING status.
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg"
                  >
                    Assign Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAssignForm(false)}
                    className="px-6 py-3 border border-gray-300 hover:bg-gray-50 font-medium rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Trade History Modal */}
      {showHistory && selectedTrade && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedTrade.description ? `"${selectedTrade.description}" - ` : ''}Trade #{selectedTrade.id} - Activity History
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">Buyer</div>
                      <div className="font-medium">{selectedTrade.buyer_email}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">Seller</div>
                      <div className="font-medium">{selectedTrade.seller_email}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">Amount</div>
                      <div className="font-medium">{formatCurrency(selectedTrade.amount, selectedTrade.currency)}</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-xs text-gray-500">Status</div>
                      <div className="font-medium">{getStatusDisplay(selectedTrade.status)}</div>
                    </div>
                  </div>
                  {selectedTrade.description && (
                    <div className="mt-3">
                      <div className="text-xs text-gray-500">Trade Name</div>
                      <div className="font-medium text-gray-800">{selectedTrade.description}</div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setShowHistory(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {tradeHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No activity history available for this trade
                </div>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">Timeline ({tradeHistory.length} entries)</h3>
                  {tradeHistory.map((entry, index) => (
                    <div key={entry.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-3 py-1 rounded text-sm font-medium ${
                              entry.action === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                              entry.action === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              entry.action === 'BANK_ASSIGNED' || entry.action === 'BANK_REVIEWING' ? 'bg-blue-100 text-blue-800' :
                              entry.action === 'SELLER_CONFIRMED' ? 'bg-indigo-100 text-indigo-800' :
                              entry.action === 'DOCUMENTS_UPLOADED' ? 'bg-purple-100 text-purple-800' :
                              entry.action === 'BANK_APPROVED' ? 'bg-yellow-100 text-yellow-800' :
                              entry.action === 'PAYMENT_RELEASED' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {entry.action.replace(/_/g, ' ')}
                            </span>
                          </div>
                          {entry.meta_data && entry.meta_data.notes && (
                            <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                              <strong>Note:</strong> {entry.meta_data.notes}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 whitespace-nowrap ml-4">
                          {new Date(entry.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowHistory(false)}
                  className="px-4 py-2 border border-gray-300 hover:bg-gray-50 font-medium rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Trades List */}
      <div className="space-y-6">
        {/* Stats Summary - UPDATED FOR AUDITOR */}
        <div className={`grid ${isAuditor() || isAdmin() ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-10' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-8'} gap-4`}>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-2xl font-bold">{stats.totalTrades}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Active</div>
            <div className="text-2xl font-bold text-blue-600">{stats.activeTrades}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">INITIATED</div>
            <div className="text-2xl font-bold text-gray-600">{stats.initiatedTrades}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Seller Confirmed</div>
            <div className="text-2xl font-bold text-indigo-600">{stats.sellerConfirmedTrades}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Docs Uploaded</div>
            <div className="text-2xl font-bold text-purple-600">{stats.docsUploadedTrades}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">In Review</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.inReviewTrades}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Completed</div>
            <div className="text-2xl font-bold text-emerald-600">{stats.completedTrades}</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">Cancelled</div>
            <div className="text-2xl font-bold text-red-600">{stats.cancelledTrades}</div>
          </div>
          {(isAuditor() || isAdmin()) && (
            <>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-500">Disputed</div>
                <div className="text-2xl font-bold text-orange-600">{stats.disputedTrades}</div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="text-sm text-gray-500">High Value</div>
                <div className="text-2xl font-bold text-purple-600">{stats.highValueTrades}</div>
              </div>
            </>
          )}
        </div>

        {/* Pending Actions - HIDDEN FOR AUDITOR/ADMIN */}
        {!isAuditor() && !isAdmin() && (stats.pendingSellerAction > 0 || stats.pendingBuyerAction > 0) && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">Pending Actions</h3>
            <div className="flex flex-wrap gap-4">
              {stats.pendingSellerAction > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">{stats.pendingSellerAction}</span> trade(s) waiting for your acceptance
                  </span>
                </div>
              )}
              {stats.pendingBuyerAction > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-700">
                    <span className="font-medium">{stats.pendingBuyerAction}</span> trade(s) waiting for bank assignment
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auditor/Admin Info Banner */}
        {(isAuditor() || isAdmin()) && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">
              {isAuditor() ? "Auditor Mode" : "Admin Mode"}
            </h3>
            <p className="text-sm text-gray-700">
              {isAuditor() 
                ? "You have view-only access to all trades. You can monitor trade activity but cannot modify trades."
                : "You have administrative access to all trades. You can monitor trade activity and view detailed history."
              }
              Use the "View History" button to see detailed transaction history.
            </p>
          </div>
        )}

        {/* Trades Table - UPDATED: Show trade name/description */}
        <div className="bg-white rounded-xl shadow">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">
              {getPageTitle()} ({stats.totalTrades})
            </h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center text-gray-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p>Loading trades...</p>
            </div>
          ) : stats.totalTrades === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p className="mb-3">No trades found</p>
              {isCorporate() && (
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Your First Trade
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium text-gray-600">ID</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600">Buyer → Seller</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600">Trade Name</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600">Amount</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600">Status</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600">Created</th>
                    <th className="p-4 text-left text-sm font-medium text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {trades.map(trade => {
                    const isUserBuyer = isBuyer(trade);
                    const isUserSeller = isSeller(trade);
                    const isUserInvolved = isUserBuyer || isUserSeller || isBankUser() || isAdmin() || isAuditor();
                    
                    // Status indicators (hidden for auditor/admin)
                    const isWaitingSeller = !isAuditor() && !isAdmin() && isUserSeller && trade.status === "INITIATED";
                    const isWaitingBuyer = !isAuditor() && !isAdmin() && isUserBuyer && trade.status === "DOCUMENTS_UPLOADED" && !trade.issuing_bank_id;
                    const isWaitingBank = isBankUser() && trade.issuing_bank_id && trade.status === "DOCUMENTS_UPLOADED";
                    
                    return (
                      <tr key={trade.id} className="hover:bg-gray-50">
                        <td className="p-4 font-medium">#{trade.id}</td>
                        <td className="p-4">
                          <div className="text-sm">
                            <div className={`font-medium ${isUserBuyer ? "text-blue-600" : ""}`}>
                              {isUserBuyer ? "You (Buyer)" : trade.buyer_email}
                            </div>
                            <div className={`${isUserSeller ? "text-green-600" : "text-gray-500"}`}>
                              → {isUserSeller ? "You (Seller)" : trade.seller_email}
                            </div>
                            {isWaitingSeller && (
                              <div className="mt-1 text-xs text-green-600 font-medium">
                                ✓ Waiting for your acceptance
                              </div>
                            )}
                            {isWaitingBuyer && (
                              <div className="mt-1 text-xs text-blue-600 font-medium">
                                ✓ Ready for bank assignment
                              </div>
                            )}
                            {isWaitingBank && (
                              <div className="mt-1 text-xs text-yellow-600 font-medium">
                                ✓ Ready for bank review
                              </div>
                            )}
                            {(isAuditor() || isAdmin()) && trade.issuing_bank_id && (
                              <div className="mt-1 text-xs text-gray-500">
                                Bank ID: {trade.issuing_bank_id}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="text-sm">
                            <div className="font-medium text-gray-800">
                              {trade.description || "Unnamed Trade"}
                            </div>
                            {trade.payment_terms && (
                              <div className="text-xs text-gray-500 mt-1">
                                Terms: {trade.payment_terms}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold">{formatCurrency(trade.amount, trade.currency)}</div>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[trade.status]}`}>
                            {getStatusDisplay(trade.status)}
                            {trade.issuing_bank_id && trade.status !== "INITIATED" && (
                              <span className="ml-1">(Bank Assigned)</span>
                            )}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-gray-500">
                          {formatDate(trade.initiated_at)}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-2">
                            {isUserInvolved && renderActionButtons(trade)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Correct Workflow Guide */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
        <h3 className="font-semibold text-blue-800 mb-4 text-lg">Correct Trade Workflow</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <div className="text-gray-600 font-bold mb-2">1. INITIATED</div>
            <p className="text-sm text-gray-600">Buyer creates trade</p>
            <p className="text-xs text-gray-500 mt-1">Seller action: Accept Trade</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <div className="text-indigo-600 font-bold mb-2">2. SELLER_CONFIRMED</div>
            <p className="text-sm text-gray-600">Seller accepts trade</p>
            <p className="text-xs text-gray-500 mt-1">Seller action: Upload Documents</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <div className="text-purple-600 font-bold mb-2">3. DOCUMENTS_UPLOADED</div>
            <p className="text-sm text-gray-600">Documents uploaded</p>
            <p className="text-xs text-gray-500 mt-1">Buyer action: Assign Bank</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <div className="text-yellow-600 font-bold mb-2">4. BANK_REVIEWING → APPROVED</div>
            <p className="text-sm text-gray-600">Bank reviews documents</p>
            <p className="text-xs text-gray-500 mt-1">Bank actions: Approve/Dispute</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-blue-100">
            <div className="text-emerald-600 font-bold mb-2">5. PAYMENT_RELEASED → COMPLETED</div>
            <p className="text-sm text-gray-600">Bank releases payment</p>
            <p className="text-xs text-gray-500 mt-1">Buyer/Seller: Complete Trade</p>
          </div>
        </div>
        <div className="mt-4 text-sm text-blue-700">
          <p><strong>Important:</strong> Buyer can only assign bank after documents are uploaded (DOCUMENTS_UPLOADED status)</p>
          <p className="text-xs text-blue-600 mt-1">Current user: {userEmail} ({userRole})</p>
          {isAuditor() && <p className="text-xs text-blue-600 mt-1">👁️ Auditor: View-only access to all trades</p>}
          {isAdmin() && <p className="text-xs text-purple-600 mt-1">⚙️ Admin: Full access to all trades</p>}
        </div>
      </div>
    </Layout>
  );
}