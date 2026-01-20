// frontend/src/pages/RiskDashboard.jsx
import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';

const RiskDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [riskScores, setRiskScores] = useState([]);
  const [myRiskScore, setMyRiskScore] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState(null);
  const [selectedScore, setSelectedScore] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [recalculatingAll, setRecalculatingAll] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Get current user info
  useEffect(() => {
    const fetchUserInfo = () => {
      const role = localStorage.getItem('role') || '';
      const email = localStorage.getItem('email') || '';
      const token = localStorage.getItem('access_token');
      
      // Get user ID from JWT token
      let id = null;
      if (token) {
        try {
          const base64Url = token.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(
            atob(base64)
              .split('')
              .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
              .join('')
          );
          const decoded = JSON.parse(jsonPayload);
          id = decoded.user_id || decoded.sub;
        } catch (err) {
          console.error('Failed to decode JWT:', err);
        }
      }
      
      setUserRole(role);
      setUserEmail(email);
      setUserId(id);
    };
    
    fetchUserInfo();
    fetchMyRiskScore();
    if (isAdminOrAuditor()) {
      fetchAllRiskScores();
      fetchRiskStatistics();
    }
  }, []);

  // Check permissions
  const isAdminOrAuditor = () => {
    return userRole === 'admin' || userRole === 'auditor';
  };

  // Fetch my risk score
  const fetchMyRiskScore = async () => {
    try {
      const res = await api.get('/risk/me/score');
      setMyRiskScore(res.data);
    } catch (err) {
      console.error('Failed to load my risk score:', err);
      // Set default if calculation failed
      if (err.response?.data?.factors?.error === "calculation_failed") {
        setMyRiskScore(err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch all risk scores
  const fetchAllRiskScores = async () => {
    try {
      const res = await api.get('/risk/');
      setRiskScores(res.data);
    } catch (err) {
      console.error('Failed to load risk scores:', err);
    }
  };

  // Fetch risk statistics
  const fetchRiskStatistics = async () => {
    if (!isAdminOrAuditor()) return;
    
    setLoadingStats(true);
    try {
      const res = await api.get('/risk/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load risk statistics:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // Recalculate risk score for a specific user
  const recalculateUserRisk = async (userId) => {
    if (!userId) {
      alert('User ID not found');
      return;
    }
    
    if (window.confirm('Recalculate this risk score?')) {
      try {
        await api.post(`/risk/recalculate/${userId}`);
        alert('Risk score recalculated!');
        
        // Refresh the data
        if (parseInt(userId) === parseInt(userId)) {
          fetchMyRiskScore();
        }
        if (isAdminOrAuditor()) {
          fetchAllRiskScores();
          fetchRiskStatistics();
        }
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to recalculate');
      }
    }
  };

  // Recalculate ALL risk scores (admin only)
  const recalculateAllRisks = async () => {
    if (!window.confirm('Are you sure you want to recalculate all risk scores? This may take some time.')) {
      return;
    }
    
    setRecalculatingAll(true);
    try {
      await api.post('/risk/recalculate-all');
      alert('Risk score recalculation started in background!');
      
      // Refresh data after a delay
      setTimeout(() => {
        fetchMyRiskScore();
        if (isAdminOrAuditor()) {
          fetchAllRiskScores();
          fetchRiskStatistics();
        }
      }, 3000);
    } catch (err) {
      console.error('Batch recalculation error:', err);
      alert(err.response?.data?.detail || 'Failed to start batch recalculation');
    } finally {
      setRecalculatingAll(false);
    }
  };

  // Refresh data
  const refreshData = async () => {
    setLoading(true);
    try {
      await fetchMyRiskScore();
      if (isAdminOrAuditor()) {
        await Promise.all([fetchAllRiskScores(), fetchRiskStatistics()]);
      }
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get risk color
  const getRiskColor = (level) => {
    switch (level) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get score color
  const getScoreColor = (score) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format factor values
  const formatFactorValue = (key, value) => {
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toFixed(2);
    return value;
  };

  // Get factor details for display
  const getFactorDetails = (factorName, factorData) => {
    if (!factorData) return null;
    
    switch (factorName) {
      case 'verification':
        return factorData.is_verified ? 
          '✓ Verified (+20 points)' : 
          '✗ Not verified (-5 points)';
      
      case 'account_age':
        return `${factorData.days} days (+${factorData.bonus.toFixed(2)} points)`;
      
      case 'role':
        return `${factorData.role} role (+${factorData.bonus} points)`;
      
      case 'trade_history':
        if (factorData.no_trades) return 'No trade history';
        return `${factorData.total_trades} trades, ${factorData.completed} completed (+${factorData.trade_score.toFixed(2)} points)`;
      
      case 'document_history':
        if (factorData.no_documents) return 'No documents uploaded';
        return `${factorData.total_documents} docs, ${factorData.hash_rate}% valid (+${factorData.document_score.toFixed(2)} points)`;
      
      case 'recent_activity':
        return `${factorData.trades_last_30_days} recent trades (+${factorData.activity_score.toFixed(2)} points)`;
      
      case 'ledger_activity':
        return `${factorData.total_entries} ledger entries (+${factorData.transparency_score.toFixed(2)} points)`;
      
      case 'trade_value':
        return `Avg trade: $${factorData.average_trade_value.toFixed(2)} (+${factorData.value_score.toFixed(2)} points)`;
      
      default:
        return JSON.stringify(factorData);
    }
  };

  // Filter scores
  const getFilteredScores = () => {
    if (!searchTerm) return riskScores;
    const term = searchTerm.toLowerCase();
    return riskScores.filter(score => 
      score.user_id.toString().includes(term) ||
      (score.factors?.role?.role || '').toLowerCase().includes(term) ||
      score.risk_level.toLowerCase().includes(term)
    );
  };

  const filteredScores = getFilteredScores();

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
            <p className="text-gray-600">Loading risk scores...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Risk Scoring Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Logged in as: <span className="font-medium">{userEmail}</span> 
            <span className={`ml-2 px-2 py-1 rounded text-xs ${userRole === 'admin' ? 'bg-purple-100 text-purple-800' : userRole === 'auditor' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
              {userRole}
            </span>
            {userId && <span className="text-gray-500 text-sm ml-2">ID: {userId}</span>}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={refreshData}
            className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          {isAdminOrAuditor() && (
            <button
              onClick={recalculateAllRisks}
              disabled={recalculatingAll}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {recalculatingAll ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Recalculate All
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Risk Details Modal */}
      {showDetails && selectedScore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Risk Score Details</h2>
                  <p className="text-sm text-gray-600">User ID: #{selectedScore.user_id}</p>
                </div>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                {/* Score Summary */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <div className={`px-4 py-2 rounded-full ${getRiskColor(selectedScore.risk_level)} border font-semibold`}>
                      {selectedScore.risk_level.toUpperCase()} RISK
                    </div>
                    <div className={`text-3xl font-bold ${getScoreColor(selectedScore.score)}`}>
                      {selectedScore.score.toFixed(1)}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Last calculated: {formatDate(selectedScore.last_calculated)}</div>
                    {selectedScore.expires_at && (
                      <div>Expires: {formatDate(selectedScore.expires_at)}</div>
                    )}
                  </div>
                </div>

                {/* Factors */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-700 mb-2">Risk Factors</h3>
                  {selectedScore.factors && Object.entries(selectedScore.factors).map(([key, value]) => {
                    if (value?.error) {
                      return (
                        <div key={key} className="border border-yellow-200 bg-yellow-50 rounded-lg p-3">
                          <div className="font-medium text-yellow-800 capitalize">{key.replace('_', ' ')}</div>
                          <div className="text-sm text-yellow-700 mt-1">Data unavailable: {value.error}</div>
                        </div>
                      );
                    }
                    
                    return (
                      <div key={key} className="border border-gray-200 hover:border-gray-300 rounded-lg p-4 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-medium text-gray-800 capitalize">{key.replace('_', ' ')}</div>
                          <div className="text-sm font-medium text-blue-600">
                            {value.bonus !== undefined ? `+${value.bonus.toFixed(2)}` : 
                             value.penalty !== undefined ? `${value.penalty.toFixed(2)}` : ''}
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          {getFactorDetails(key, value)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-sm text-gray-500">
                    Score ID: {selectedScore.id || 'N/A'}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        recalculateUserRisk(selectedScore.user_id);
                        setShowDetails(false);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Recalculate
                    </button>
                    <button
                      onClick={() => setShowDetails(false)}
                      className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* My Risk Score */}
        {myRiskScore && (
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">My Risk Score</h2>
                <p className="text-gray-600 text-sm">Personal risk assessment based on your activity</p>
              </div>
              <button
                onClick={() => recalculateUserRisk(userId)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Recalculate
              </button>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(myRiskScore.score)} mb-2`}>
                  {myRiskScore.score.toFixed(1)}
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-medium ${getRiskColor(myRiskScore.risk_level)} border`}>
                  {myRiskScore.risk_level.toUpperCase()} RISK
                </div>
              </div>
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-4">
                  <div>Last updated: <span className="font-medium">{formatDate(myRiskScore.last_calculated)}</span></div>
                  {myRiskScore.expires_at && (
                    <div>Expires: <span className="font-medium">{formatDate(myRiskScore.expires_at)}</span></div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedScore(myRiskScore);
                      setShowDetails(true);
                    }}
                    className="px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg text-sm transition-colors"
                  >
                    View Details
                  </button>
                  {myRiskScore.factors?.error && (
                    <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded text-xs flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      Calculation Warning
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Admin/Auditor View */}
        {isAdminOrAuditor() && (
          <>
            {/* Stats */}
            

            {/* Search and Info */}
            <div className="bg-white p-4 rounded-xl shadow border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by User ID, Role, or Risk Level..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  Showing {filteredScores.length} of {riskScores.length} scores
                </div>
              </div>
            </div>

            {/* Scores Table */}
            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">All Risk Scores</h2>
                  <div className="text-sm text-gray-600">
                    Total: {riskScores.length} users
                  </div>
                </div>
              </div>
              
              {riskScores.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mb-2">No risk scores found</p>
                  <p className="text-sm">Risk scores will appear after they are calculated</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="p-4 text-left text-sm font-medium text-gray-600">User ID</th>
                        <th className="p-4 text-left text-sm font-medium text-gray-600">Score</th>
                        <th className="p-4 text-left text-sm font-medium text-gray-600">Risk Level</th>
                        <th className="p-4 text-left text-sm font-medium text-gray-600">Role</th>
                        <th className="p-4 text-left text-sm font-medium text-gray-600">Last Updated</th>
                        <th className="p-4 text-left text-sm font-medium text-gray-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredScores.map(score => (
                        <tr key={score.user_id} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-medium text-gray-900">#{score.user_id}</td>
                          <td className="p-4">
                            <div className={`text-xl font-bold ${getScoreColor(score.score)}`}>
                              {score.score.toFixed(1)}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${getRiskColor(score.risk_level)} border inline-flex items-center gap-1`}>
                              <div className="w-2 h-2 rounded-full bg-current opacity-75"></div>
                              {score.risk_level.toUpperCase()}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm capitalize px-2 py-1 bg-gray-100 text-gray-700 rounded inline-block">
                              {score.factors?.role?.role || 'N/A'}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-gray-600">
                            {formatDate(score.last_calculated)}
                          </td>
                          <td className="p-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedScore(score);
                                  setShowDetails(true);
                                }}
                                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm transition-colors flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </button>
                              <button
                                onClick={() => recalculateUserRisk(score.user_id)}
                                className="px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-sm transition-colors flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Recalc
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Regular User Info */}
        {!isAdminOrAuditor() && myRiskScore && (
          <div className="bg-white p-6 rounded-xl shadow border border-gray-200">
            <h3 className="font-semibold text-gray-800 mb-4">About Your Risk Score</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-800">Score Calculation</div>
                    <div className="text-sm text-gray-600">Based on multiple factors including verification, trades, and documents</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-2 rounded-full bg-green-500 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-800">Improve Your Score</div>
                    <div className="text-sm text-gray-600">Complete successful trades and upload valid documents</div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-2 rounded-full bg-purple-500 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-800">Risk Levels</div>
                    <div className="text-sm text-gray-600">
                      Low (≥75), Medium (40-74), High (≤39)
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500 flex-shrink-0"></div>
                  <div>
                    <div className="font-medium text-gray-800">Auto Refresh</div>
                    <div className="text-sm text-gray-600">Scores update automatically every 24 hours</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RiskDashboard;