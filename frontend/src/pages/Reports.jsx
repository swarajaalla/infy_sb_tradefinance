// frontend/src/pages/Reports.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Snackbar,
  Stack
} from '@mui/material';
import {
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  TableChart as CsvIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  Description as DocumentIcon,
  AccountBalance as TradeIcon,
  Timeline as LedgerIcon,
  Security as RiskIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import api from '../api/axios';
import Layout from '../components/Layout'; // Add this import

const Reports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [trades, setTrades] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState({ type: '', tradeId: null, documentId: null });
  const [searchTerm, setSearchTerm] = useState('');
  const [exportLoading, setExportLoading] = useState({
    trades: false,
    documents: false,
    ledger: false,
    risk: false
  });
  const [stats, setStats] = useState({
    totalTrades: 0,
    totalDocuments: 0,
    recentExports: []
  });

  const userRole = localStorage.getItem('role');
  const isAdminOrAuditor = userRole === 'admin' || userRole === 'auditor';

  // Fetch initial data
  useEffect(() => {
    fetchTrades();
    fetchDocuments();
    fetchStats();
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const response = await api.get('/trades');
      setTrades(response.data);
    } catch (err) {
      setError('Failed to fetch trades');
      console.error('Error fetching trades:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await api.get('/documents');
      setDocuments(response.data);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const tradesResponse = await api.get('/trades');
      const docsResponse = await api.get('/documents');
      
      setStats({
        totalTrades: tradesResponse.data.length,
        totalDocuments: docsResponse.data.length,
        recentExports: JSON.parse(localStorage.getItem('recentExports') || '[]')
      });
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  // Export functions
  const handleExport = async (type, tradeId = null, documentId = null) => {
    try {
      setExportLoading(prev => ({ ...prev, [type]: true }));
      
      let url = '';
      if (type === 'pdf-trade') {
        url = `/reports/pdf/trade/${tradeId}`;
      } else if (type === 'pdf-document') {
        url = `/reports/pdf/document/${documentId}`;
      } else {
        url = `/reports/csv/${type}`;
      }

      const response = await api.get(url, {
        responseType: 'blob' // Important for file downloads
      });

      // Create download link
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      let filename = '';
      switch (type) {
        case 'trades': filename = 'trades.csv'; break;
        case 'documents': filename = 'documents.csv'; break;
        case 'ledger': filename = 'ledger_entries.csv'; break;
        case 'risk': filename = 'risk_scores.csv'; break;
        case 'pdf-trade': filename = `trade_${tradeId}_report.pdf`; break;
        case 'pdf-document': filename = `document_${documentId}_report.pdf`; break;
        default: filename = 'export.csv';
      }
      
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      // Save to recent exports
      const exportRecord = {
        type,
        filename,
        timestamp: new Date().toISOString(),
        tradeId,
        documentId
      };
      
      const recentExports = JSON.parse(localStorage.getItem('recentExports') || '[]');
      recentExports.unshift(exportRecord);
      if (recentExports.length > 5) recentExports.pop();
      localStorage.setItem('recentExports', JSON.stringify(recentExports));
      setStats(prev => ({ ...prev, recentExports }));

      setSuccess(`${filename} downloaded successfully!`);
      setOpenDialog(false);
    } catch (err) {
      console.error('Export error:', err);
      setError(`Failed to export ${type}: ${err.response?.data?.detail || err.message || 'Unknown error'}`);
    } finally {
      setExportLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const openExportDialog = (type, tradeId = null, documentId = null) => {
    setDialogContent({ type, tradeId, documentId });
    setOpenDialog(true);
  };

  const getExportTypeName = (type) => {
    const names = {
      'trades': 'Trades CSV',
      'documents': 'Documents CSV',
      'ledger': 'Ledger CSV',
      'risk': 'Risk Scores CSV',
      'pdf-trade': 'Trade PDF Report',
      'pdf-document': 'Document PDF Report'
    };
    return names[type] || type;
  };

  const filteredTrades = trades.filter(trade =>
    trade.buyer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trade.seller_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trade.id?.toString().includes(searchTerm) ||
    trade.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Reports & Exports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generate and download trade reports in CSV or PDF format
          </Typography>
        </Box>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}


        {/* CSV Export Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <CsvIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              CSV Exports
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Export data in CSV format for analysis in spreadsheet applications
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={exportLoading.trades ? <CircularProgress size={20} /> : <CsvIcon />}
                  onClick={() => handleExport('trades')}
                  disabled={exportLoading.trades}
                >
                  Export Trades
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={exportLoading.documents ? <CircularProgress size={20} /> : <CsvIcon />}
                  onClick={() => handleExport('documents')}
                  disabled={exportLoading.documents}
                >
                  Export Documents
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={exportLoading.ledger ? <CircularProgress size={20} /> : <CsvIcon />}
                  onClick={() => handleExport('ledger')}
                  disabled={exportLoading.ledger}
                >
                  Export Ledger
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={exportLoading.risk ? <CircularProgress size={20} /> : <CsvIcon />}
                  onClick={() => handleExport('risk')}
                  disabled={exportLoading.risk || !isAdminOrAuditor}
                  title={!isAdminOrAuditor ? "Only admin/auditor can access risk scores" : ""}
                >
                  Export Risk Scores
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* PDF Export Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <PdfIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
              PDF Reports
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Generate detailed PDF reports for individual trades and documents
            </Typography>

            {/* Trade List for PDF Export */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Select a trade for PDF report:
              </Typography>
              
              <TextField
                fullWidth
                variant="outlined"
                size="small"
                placeholder="Search trades by ID, buyer, seller, or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />
                }}
                sx={{ mb: 2 }}
              />

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Trade ID</TableCell>
                      <TableCell>Buyer</TableCell>
                      <TableCell>Seller</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <CircularProgress size={24} />
                        </TableCell>
                      </TableRow>
                    ) : filteredTrades.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No trades found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTrades.map((trade) => (
                        <TableRow key={trade.id}>
                          <TableCell>#{trade.id}</TableCell>
                          <TableCell>{trade.buyer_email}</TableCell>
                          <TableCell>{trade.seller_email}</TableCell>
                          <TableCell>
                            {trade.amount} {trade.currency}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={trade.status}
                              size="small"
                              color={
                                trade.status === 'completed' ? 'success' :
                                trade.status === 'pending' ? 'warning' :
                                trade.status === 'failed' ? 'error' : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title="Generate PDF Report">
                              <IconButton
                                size="small"
                                onClick={() => openExportDialog('pdf-trade', trade.id)}
                                disabled={exportLoading['pdf-trade']}
                              >
                                {exportLoading['pdf-trade'] ? <CircularProgress size={20} /> : <PdfIcon />}
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Document List for PDF Export */}
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Select a document for PDF report:
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Document ID</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Number</TableCell>
                      <TableCell>Trade ID</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {documents.slice(0, 5).map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>#{doc.id}</TableCell>
                        <TableCell>{doc.doc_type}</TableCell>
                        <TableCell>{doc.doc_number}</TableCell>
                        <TableCell>Trade #{doc.trade_id}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="Generate PDF Report">
                            <IconButton
                              size="small"
                              onClick={() => openExportDialog('pdf-document', null, doc.id)}
                              disabled={exportLoading['pdf-document']}
                            >
                              {exportLoading['pdf-document'] ? <CircularProgress size={20} /> : <PdfIcon />}
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </CardContent>
        </Card>

        {/* Recent Exports */}
        {stats.recentExports.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <DownloadIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Recent Exports
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>File Name</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.recentExports.map((exp, index) => (
                      <TableRow key={index}>
                        <TableCell>{exp.filename}</TableCell>
                        <TableCell>{getExportTypeName(exp.type)}</TableCell>
                        <TableCell>
                          {new Date(exp.timestamp).toLocaleDateString()} {new Date(exp.timestamp).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {/* Export Confirmation Dialog */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
          <DialogTitle>
            Confirm Export
            <IconButton
              onClick={() => setOpenDialog(false)}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to generate and download the{' '}
              <strong>{getExportTypeName(dialogContent.type)}</strong>?
            </Typography>
            {dialogContent.tradeId && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Trade ID: {dialogContent.tradeId}
              </Typography>
            )}
            {dialogContent.documentId && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Document ID: {dialogContent.documentId}
              </Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={() => handleExport(dialogContent.type, dialogContent.tradeId, dialogContent.documentId)}
              disabled={exportLoading[dialogContent.type]}
              startIcon={exportLoading[dialogContent.type] ? <CircularProgress size={20} /> : <DownloadIcon />}
            >
              {exportLoading[dialogContent.type] ? 'Generating...' : 'Download'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Refresh Button */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => {
              fetchTrades();
              fetchDocuments();
              fetchStats();
            }}
            disabled={loading}
          >
            Refresh Data
          </Button>
        </Box>
      </Container>
    </Layout>
  );
};

export default Reports;