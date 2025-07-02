// src/components/CompareDocuments.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Select, Upload, Button, Card, Typography, Row, Col, Carousel, Modal } from 'antd';
import { FileSearchOutlined, InboxOutlined, InfoCircleOutlined } from '@ant-design/icons';
import '../styles/CompareDocuments.css';

const { Option } = Select;
const { Dragger } = Upload;
const { Title, Text } = Typography;

const CompareDocuments = () => {
  const [contracts, setContracts] = useState([]);
  const [contractIdA, setContractIdA] = useState(null);
  const [fileB, setFileB] = useState(null);
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedComparison, setSelectedComparison] = useState(null);

  useEffect(() => {
    fetchContracts();
    fetchHistory();
  }, []);

  const fetchContracts = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/api/contracts/all', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      });
      setContracts(res.data.contracts);
    } catch (error) {
      toast.error('Failed to fetch contracts');
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:5000/api/contracts/comparisons', {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      });
      setHistory(res.data.comparisons);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchComparisonDetail = async (comparisonId) => {
    try {
      const res = await axios.get(`http://127.0.0.1:5000/api/contracts/comparisons/${comparisonId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` }
      });
      setSelectedComparison(res.data);
      setModalVisible(true);
    } catch (error) {
      toast.error('Failed to load comparison detail');
    }
  };

  const handleCompare = async () => {
    if (!contractIdA || !fileB) return toast.error('Please select a base contract and upload a new file.');

    const formData = new FormData();
    formData.append('contract_id_a', contractIdA);
    formData.append('fileB', fileB);

    try {
      setLoading(true);
      const res = await axios.post('http://127.0.0.1:5000/api/contracts/compare', formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      setComparisonResult(res.data);
      toast.success('Comparison complete');
      fetchHistory();
    } catch (error) {
      toast.error('Comparison failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="compare-container">
      <Title level={2} className="compare-heading">
        <FileSearchOutlined /> Compare Contracts
      </Title>

      <div className="compare-flex">
        <Card className="compare-card">
          <Title level={4}>Select Existing Contract (File A)</Title>
          <Select
            showSearch
            style={{ width: '100%' }}
            placeholder="Select contract to compare from"
            optionFilterProp="children"
            onChange={value => setContractIdA(value)}
            filterOption={(input, option) => option.children.toLowerCase().includes(input.toLowerCase())}
          >
            {contracts.map(contract => (
              <Option key={contract.id} value={contract.id}>
                {contract.title}
              </Option>
            ))}
          </Select>
        </Card>

        <Card className="compare-card">
          <Title level={4}>Upload New Contract (File B)</Title>
          <Dragger
            name="file"
            multiple={false}
            accept=".pdf,.doc,.docx"
            customRequest={({ file, onSuccess }) => {
              setFileB(file);
              onSuccess('ok');
            }}
            showUploadList={false}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p>Click or drag file here to upload</p>
            {fileB && <Text type="secondary">Selected: {fileB.name}</Text>}
          </Dragger>
        </Card>
      </div>

      <div className="compare-center">
        <Button type="primary" loading={loading} onClick={handleCompare} size="large">
          Compare Files
        </Button>
      </div>

      {comparisonResult && (
        <Card className="compare-result highlight-card" title="🔍 Comparison Summary">
          <p style={{ background: '#f0fdfa', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', borderLeft: '4px solid #10b981' }}>
            <strong style={{ color: '#065f46' }}>Summary:</strong> {comparisonResult.summary}
          </p>

          {comparisonResult.changes.map((change, index) => (
            <div key={index} className="compare-clause">
              <div className="compare-clause-title">{change.clause}</div>
              <Row gutter={16}>
                <Col span={12}>
                  <div className="compare-before">
                    <strong>Before:</strong>
                    <div>{change.before}</div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="compare-after">
                    <strong>After:</strong>
                    <div>{change.after}</div>
                  </div>
                </Col>
              </Row>
            </div>
          ))}
        </Card>
      )}

      <div className="compare-history">
        <Title level={4}>Previous Comparisons</Title>
        <Carousel dots={false} slidesToShow={2} autoplay style={{ padding: '1rem' }}>
          {history.map(item => (
            <Card
              key={item.comparison_id}
              className="compare-history-item"
              onClick={() => fetchComparisonDetail(item.comparison_id)}
              style={{ margin: '0 1rem' }}
            >
              <Title level={5}>{item.contract_a_title} ↔ {item.contract_b_title}</Title>
              <p><InfoCircleOutlined /> Risk Scores: A = {item.contract_a_risk ?? 'N/A'}, B = {item.contract_b_risk ?? 'N/A'}</p>
              <Text type="secondary">{item.created_at}</Text>
            </Card>
          ))}
        </Carousel>
      </div>

      <Modal
        title="Comparison Detail"
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={900}
      >
        {selectedComparison ? (
          <div>
            <p style={{ padding: '1rem', borderRadius: '6px', background: '#f3f4f6', marginBottom: '2rem' }}>
              <strong>Summary:</strong> {selectedComparison.summary}
            </p>
            {selectedComparison.changes.map((change, index) => (
              <div key={index} className="compare-clause">
                <div className="compare-clause-title">{change.clause}</div>
                <Row gutter={16}>
                  <Col span={12}>
                    <div className="compare-before">
                      <strong>Before:</strong>
                      <div>{change.before}</div>
                    </div>
                  </Col>
                  <Col span={12}>
                    <div className="compare-after">
                      <strong>After:</strong>
                      <div>{change.after}</div>
                    </div>
                  </Col>
                </Row>
              </div>
            ))}
          </div>
        ) : <p>Loading...</p>}
      </Modal>

    </div>
  );
};

export default CompareDocuments;
