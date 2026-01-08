// src/pages/IntegrityCheckPage.jsx
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Layout from '../components/Layout';

export default function IntegrityCheckPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checks, setChecks] = useState([]);
  const [summary, setSummary] = useState(null);
  const [lastCheckResult, setLastCheckResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('access_token') || localStorage.getItem('refresh_token');
    if (!token) navigate('/login');
    if (role !== 'admin') navigate(`/${role}/dashboard`);
  }, [navigate]);

  const fetchChecks = async () => {
    try {
      const response = await api.get('/admin/integrity-checks');
      setChecks(response.data);
      if (response.data.length > 0) setLastCheckResult(response.data[0]);
    } catch (err) {
      console.error('Failed to fetch checks:', err);
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await api.get('/admin/integrity-checks/summary');
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to fetch summary:', err);
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    fetchChecks();
    fetchSummary();
  }, []);

  const runIntegrityCheck = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/admin/run-integrity-check', {}, { params: { force } });
      setLastCheckResult(response.data);
      fetchChecks();
      fetchSummary();
      setActiveTab('results');
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      } else {
        setError(err.response?.data?.detail || 'Failed to run integrity check');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'running': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Document Integrity Check</h1>
          <div className="flex gap-3">
            <button
              onClick={() => runIntegrityCheck(false)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Running Check...
                </span>
              ) : 'Run Integrity Check'}
            </button>
            <button
              onClick={() => runIntegrityCheck(true)}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Force Run Check
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('summary')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'summary'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('results')}
              disabled={!lastCheckResult}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'results'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } ${!lastCheckResult ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              Last Results
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              History
            </button>
          </nav>
        </div>

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="space-y-6">
            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Checks (7 days)</dt>
                        <dd className="text-lg font-medium text-gray-900">{summary.total_checks}</dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className={`h-8 w-8 ${summary.last_check_status === 'completed' ? 'text-green-500' : 'text-red-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Last Check Status</dt>
                        <dd className={`text-lg font-medium ${summary.last_check_status === 'completed' ? 'text-green-600' : 'text-red-600'}`}>
                          {summary.last_check_status || 'No checks'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Last Modified Files</dt>
                        <dd className="text-lg font-medium text-red-600">
                          {summary.last_check_summary?.modified_documents || 0}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Avg Issues</dt>
                        <dd className="text-lg font-medium text-yellow-600">
                          {summary.average_findings?.toFixed(1) || '0.0'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">About Integrity Check</h2>
              <div className="space-y-3 text-gray-600">
                <p>This integrity check compares documents in the database with files stored in AWS S3.</p>
                <p><strong>Modified files include:</strong></p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Files with different hash in AWS S3 than database</li>
                  <li>Files missing from AWS S3 (considered modified)</li>
                </ul>
                <p className="pt-2 text-sm text-gray-500">Click "Run Integrity Check" to start a new check. Use "Force Run Check" to bypass the 5-minute cache.</p>
              </div>
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && lastCheckResult && (
          <div className="space-y-6">
            {/* Check Header */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-800">
                      Integrity Check #{lastCheckResult.id}
                    </h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(lastCheckResult.status)}`}>
                        {lastCheckResult.status}
                      </span>
                      <span className="text-sm text-gray-500">
                        Started: {format(new Date(lastCheckResult.created_at), 'PPpp')}
                      </span>
                      {lastCheckResult.completed_at && (
                        <span className="text-sm text-gray-500">
                          Completed: {format(new Date(lastCheckResult.completed_at), 'PPpp')}
                        </span>
                      )}
                    </div>
                  </div>
                  {lastCheckResult.findings?.summary && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-800">
                        {lastCheckResult.findings.summary.total_documents_checked} documents
                      </div>
                      <div className="text-sm text-gray-500">Total checked</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary Stats */}
              {lastCheckResult.findings?.summary && (
                <div className="p-6 border-b">
                  <h3 className="text-md font-semibold text-gray-700 mb-4">Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {lastCheckResult.findings.summary.verified_documents || 0}
                      </div>
                      <div className="text-sm text-gray-600">Verified</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-red-600">
                        {lastCheckResult.findings.summary.modified_documents || 0}
                      </div>
                      <div className="text-sm text-gray-600">Modified/Missing</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-600">
                        {lastCheckResult.findings.summary.documents_without_url || 0}
                      </div>
                      <div className="text-sm text-gray-600">No URL</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {lastCheckResult.findings.summary.access_errors || 0}
                      </div>
                      <div className="text-sm text-gray-600">Access Errors</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Errors - Modified/Missing Files */}
              {lastCheckResult.findings?.errors && lastCheckResult.findings.errors.length > 0 && (
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-md font-semibold text-red-700">Modified/Missing Files ({lastCheckResult.findings.errors.length})</h3>
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Critical Issues</span>
                  </div>
                  <div className="space-y-3">
                    {lastCheckResult.findings.errors.map((error, index) => (
                      <div key={index} className="border border-red-200 rounded-lg p-4 bg-red-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-medium text-red-800">{error.description}</div>
                            <div className="text-sm text-red-600 mt-1">
                              Document #{error.document_id} • {error.doc_number} • {error.doc_type}
                            </div>
                          </div>
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${getSeverityColor(error.severity)}`}>
                            {error.severity}
                          </span>
                        </div>
                        {error.db_hash_short && error.s3_hash_short ? (
                          <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">DB Hash: </span>
                              <code className="font-mono bg-gray-100 px-2 py-1 rounded">{error.db_hash_short}</code>
                            </div>
                            <div>
                              <span className="font-medium text-gray-700">AWS Hash: </span>
                              <code className="font-mono bg-gray-100 px-2 py-1 rounded">{error.s3_hash_short}</code>
                            </div>
                          </div>
                        ) : error.category === 'file_missing_in_aws' && (
                          <div className="mt-3 text-sm">
                            <span className="font-medium text-gray-700">Status: </span>
                            <span className="text-red-600 font-medium">File missing from AWS S3</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-800">Integrity Check History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modified Files</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Docs</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {checks.map((check) => (
                    <tr key={check.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{check.id}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(check.status)}`}>
                          {check.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {format(new Date(check.created_at), 'PPpp')}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-red-600">
                          {check.findings?.summary?.modified_documents || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {check.findings?.summary?.total_documents_checked || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {checks.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No integrity checks found</h3>
                <p className="mt-1 text-sm text-gray-500">Run an integrity check to get started.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}