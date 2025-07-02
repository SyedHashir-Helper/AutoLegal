// src/components/ContractCard.js
import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Modal, Button, Badge, List, Typography, Tag, Tooltip } from 'antd';
import {
  FileText,
  Download,
  Eye,
  Trash2,
  Calendar,
  HardDrive,
  CheckCircle,
  Clock,
  AlertCircle,
  File,
  FileImage,
  Search,
  BarChart,
  DownloadCloud,
  Trash
} from 'lucide-react';

const ContractCard = ({ contract, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false);
  const [contractContent, setContractContent] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-success-600" />;
      case 'processing': return <Clock className="h-4 w-4 text-warning-600" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-error-600" />;
      default: return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'completed': return 'status-completed';
      case 'processing': return 'status-processing';
      case 'failed': return 'status-failed';
      default: return 'status-uploaded';
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType.toLowerCase()) {
      case 'pdf': return <FileImage className="contract-icon text-error-600" />;
      case 'doc':
      case 'docx': return <FileText className="contract-icon text-primary-600" />;
      case 'txt': return <File className="contract-icon text-gray-600" />;
      default: return <FileText className="contract-icon text-gray-600" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit', minute: '2-digit'
    });
  };

  const handleDownload = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://127.0.0.1:5000/api/upload/contract/${contract.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', contract.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    } finally {
      setLoading(false);
    }
  };

  const handleViewContent = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/upload/contract/${contract.id}/content`);
      setContractContent(response.data);
      setContentModalOpen(true);
    } catch (error) {
      console.error('Failed to load content:', error);
      toast.error('Failed to load contract content');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalysis = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5000/api/contracts/${contract.id}/analysis`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      setAnalysisData(response.data.analysis);
      setAnalysisModalOpen(true);
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
      toast.error('Could not load analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this contract?')) return;
    try {
      setLoading(true);
      await axios.delete(`http://127.0.0.1:5000/api/contracts/${contract.id}`);
      toast.success('Contract deleted');
      onUpdate();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete contract');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contract-card">
      <div className="contract-header">
        <div className="contract-info">
          {getFileIcon(contract.file_type)}
          <div>
            <h3 className="contract-title" title={contract.title}>{contract.title}</h3>
            <p className="contract-filename" title={contract.filename}>{contract.filename}</p>
          </div>
        </div>
        <div className="flex items-center">
          {getStatusIcon(contract.upload_status)}
          <span className={`contract-status ${getStatusClass(contract.upload_status)} ml-2`}>
            {contract.upload_status}
          </span>
        </div>
      </div>

      <div className="contract-details">
        <div className="contract-detail">
          <span className="contract-detail-label"><HardDrive className="h-4 w-4 mr-1" /> Size:</span>
          <span className="contract-detail-value">{formatFileSize(contract.file_size)}</span>
        </div>
        <div className="contract-detail">
          <span className="contract-detail-label"><Calendar className="h-4 w-4 mr-1" /> Uploaded:</span>
          <span className="contract-detail-value">{formatDate(contract.created_at)}</span>
        </div>
        <div className="contract-detail">
          <span className="contract-detail-label">Analyses:</span>
          <span className="contract-detail-value">{contract.analysis_count}</span>
        </div>
      </div>

      <div className="contract-actions">
        <Tooltip title="View Content">
          <Button icon={<Eye />} onClick={handleViewContent} disabled={loading || !contract.has_content} />
        </Tooltip>
        <Tooltip title="Risk Analysis">
          <Button icon={<BarChart />} onClick={handleViewAnalysis} disabled={loading || contract.upload_status !== 'completed'} />
        </Tooltip>
        <Tooltip title="Download File">
          <Button icon={<DownloadCloud />} onClick={handleDownload} disabled={loading} />
        </Tooltip>
        <Tooltip title="Delete Contract">
          <Button icon={<Trash />} danger onClick={handleDelete} disabled={loading} />
        </Tooltip>
      </div>

      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

      <Modal
        title={`${contract.title} — Contract Content`}
        open={contentModalOpen}
        onCancel={() => setContentModalOpen(false)}
        footer={null}
        width={800}
      >
        {contractContent ? (
          <>
            <p><strong>Filename:</strong> {contract.filename}</p>
            <p><strong>Status:</strong> {contract.upload_status}</p>
            <p><strong>Word Count:</strong> {contractContent.word_count}</p>
            <pre style={{ whiteSpace: 'pre-wrap', backgroundColor: '#f9f9f9', padding: 10 }}>{contractContent.content}</pre>
          </>
        ) : <p>Loading content...</p>}
      </Modal>

      <Modal
        title={`${contract.title} — Risk Analysis`}
        open={analysisModalOpen}
        onCancel={() => setAnalysisModalOpen(false)}
        footer={null}
        width={800}
      >
        {analysisData ? (
          <>
            <div style={{ marginBottom: 16 }}>
              <b>Risk Score: </b>
              <Badge
                count={`${analysisData.risk_score}/100`}
                style={{
                  backgroundColor:
                    analysisData.risk_score >= 80 ? '#52c41a' :
                    analysisData.risk_score >= 50 ? '#faad14' : '#ff4d4f'
                }}
              />
            </div>

            <Typography.Title level={5}>Summary</Typography.Title>
            <Typography.Paragraph>{analysisData.summary}</Typography.Paragraph>

            <Typography.Title level={5}>Flagged Clauses</Typography.Title>
            {Object.entries(analysisData.flagged_clauses).map(([clause, detail], i) => (
              <div key={i} style={{ marginBottom: 16, padding: '10px', border: '1px solid #eee', borderRadius: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <b>{clause.replace(/_/g, ' ').toUpperCase()}</b>
                  <Tag
                    color={
                      detail.severity === 'high' ? 'red' :
                      detail.severity === 'medium' ? 'orange' : 'green'
                    }
                  >
                    {detail.severity.toUpperCase()}
                  </Tag>
                </div>
                <Typography.Paragraph italic>"{detail.summary}"</Typography.Paragraph>
                <Typography.Paragraph>{detail.risk}</Typography.Paragraph>
                <Typography.Paragraph strong>💡 {detail.recommendation}</Typography.Paragraph>
              </div>
            ))}

            <Typography.Title level={5}>Top Recommendations</Typography.Title>
            <List
              size="small"
              bordered
              dataSource={analysisData.recommendations.slice(0, 5)}
              renderItem={(item) => <List.Item>✔️ {item}</List.Item>}
            />
          </>
        ) : <p>Loading analysis...</p>}
      </Modal>
    </div>
  );
};

export default ContractCard;
