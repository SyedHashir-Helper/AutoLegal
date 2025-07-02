// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Scale,
  Upload,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  RefreshCw,
  LogOut,
  User,
  ChevronDown,
  FilePlus
} from 'lucide-react';
import FileUpload from '../components/FileUpload';
import ContractCard from '../components/ContractCard';
import CompareDocuments from '../components/CompareDocuments';
import { useNavigate } from 'react-router-dom';
import '../styles/Hero.css';
import SummarizeDocs from '../components/SummarizeDocs';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const base_url = 'http://127.0.0.1:5000';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_contracts: 0,
    completed_contracts: 0,
    processing_contracts: 0,
    failed_contracts: 0,
    total_size_bytes: 0
  });
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const contractsPerPage = 3;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsResponse, contractsResponse] = await Promise.all([
        axios.get(`${base_url}/api/contracts/stats`),
        axios.get(`${base_url}/api/contracts/`)
      ]);
      setStats(statsResponse.data);
      setContracts(contractsResponse.data.contracts);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSuccess = (newContract) => {
    setContracts((prev) => [newContract, ...prev]);
    setStats((prev) => ({
      ...prev,
      total_contracts: prev.total_contracts + 1,
      total_size_bytes: prev.total_size_bytes + newContract.file_size
    }));
    setShowUpload(false);
    toast.success('Contract uploaded successfully!');
  };

  const filteredContracts = contracts.filter((contract) =>
    contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contract.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const indexOfLast = currentPage * contractsPerPage;
  const indexOfFirst = indexOfLast - contractsPerPage;
  const currentContracts = filteredContracts.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredContracts.length / contractsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Hero */}
      <div className="hero-merged">
        <div className="hero-merged-overlay">
          <div className="hero-merged-content">
            <div className="hero-merged-content text-center">
              <div className="hero-merged-badge">Your AI Legal Assistant</div>
              <h1 className="hero-merged-title">
                Welcome to <span className="brand-gradient">AutoLegal</span>
              </h1>
              <p className="hero-merged-subtitle">
                Upload contracts, analyze legal risks, compare documents, and manage your legal workflows with smart AI insights.
              </p>

              <button
                onClick={() => navigate('/generate')}
                className="generate-doc-btn"
              >
                  <span className="icon-wrapper">
                    <FilePlus className="icon-spin" />
                  </span>
                Generate Document
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-8">
        {/* Stats */}
        <div className="stats-grid mb-10">
          <div className="stat-card">
            <CheckCircle className="stat-icon text-green-600" />
            <div className="stat-label">Completed</div>
            <div className="stat-value">{stats.completed_contracts}</div>
          </div>
          <div className="stat-card">
            <Clock className="stat-icon text-yellow-500" />
            <div className="stat-label">Processing</div>
            <div className="stat-value">{stats.processing_contracts}</div>
          </div>
          <div className="stat-card">
            <AlertCircle className="stat-icon text-red-500" />
            <div className="stat-label">Failed</div>
            <div className="stat-value">{stats.failed_contracts}</div>
          </div>
          <div className="stat-card">
            <FileText className="stat-icon text-blue-500" />
            <div className="stat-label">Total</div>
            <div className="stat-value">{stats.total_contracts}</div>
          </div>
        </div>

        {/* Upload Section */}
        <div className="upload-section">
          <Upload className="upload-icon" />
          <h2 className="upload-title">Upload Your Contract</h2>
          <p className="upload-description">Drag and drop your PDF, DOC, or DOCX files here or click to browse</p>
          <button onClick={() => setShowUpload(true)} className="upload-button">
            <Upload className="h-5 w-5 mr-2" /> Choose File
          </button>
        </div>

        {/* Contracts Section */}
        <div className="card">
          <div className="card-body">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Contracts</h2>
              <div className="flex items-center space-x-4">
                <div className="search-container">
                  <Search className="search-icon" />
                  <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="form-input search-input" />
                </div>
                <button onClick={loadDashboardData} className="btn btn-primary">
                  <RefreshCw className="h-4 w-4 mr-2" /> Refresh
                </button>
              </div>
            </div>

            {currentContracts.length > 0 ? (
              <div className="contracts-grid">
                {currentContracts.map(contract => (
                  <ContractCard key={contract.id} contract={contract} onUpdate={loadDashboardData} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <FileText className="empty-icon" />
                <h3 className="empty-title">{searchTerm ? 'No contracts found' : 'No contracts yet'}</h3>
                <p className="empty-description">{searchTerm ? 'Try adjusting your search terms' : 'Upload your first contract to get started'}</p>
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-center mt-6 space-x-2">
              <button disabled={currentPage === 1} onClick={() => handlePageChange(currentPage - 1)} className="btn btn-secondary">Prev</button>
              {[...Array(totalPages).keys()].map(n => (
                <button key={n} onClick={() => handlePageChange(n + 1)} className={`btn ${currentPage === n + 1 ? 'btn-primary' : 'btn-secondary'}`}>{n + 1}</button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => handlePageChange(currentPage + 1)} className="btn btn-secondary">Next</button>
            </div>
          </div>
        </div>

        {/* Compare */}
        <CompareDocuments />
        {/* Compare */}
        <SummarizeDocs contracts={contracts} />
      </div>

      
      {showUpload && <FileUpload onSuccess={handleUploadSuccess} onClose={() => setShowUpload(false)} />}
              <Footer/>
    </div>
  );
};

export default Dashboard;