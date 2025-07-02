// src/components/SummarizeDocs.js
import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Select, Upload, Button, Card, Typography, Modal, Row, Col, Radio } from 'antd';
import { FileTextOutlined, InboxOutlined } from '@ant-design/icons';
import '../styles/SummarizeDocs.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { Dragger } = Upload;

const SummarizeDocs = ({ contracts }) => {
    const [contractId, setContractId] = useState(null);
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [mode, setMode] = useState('select');

    const handleSummarize = async () => {
        if ((mode === 'select' && !contractId) || (mode === 'upload' && !file)) {
            return toast.error('Select a file or upload one');
        }

        const formData = new FormData();
        if (mode === 'select') formData.append('contract_id', contractId);
        if (mode === 'upload') formData.append('file', file);

        try {
            setLoading(true);
            const res = await axios.post('http://127.0.0.1:5000/api/contracts/summarize', formData, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`,
                    'Content-Type': 'multipart/form-data'
                }
            });
            setResult(res.data);
            toast.success('Summarization complete');
        } catch {
            toast.error('Failed to summarize');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="summarize-container">
            <Title level={2} className="summarize-title">
                <FileTextOutlined /> Summarize Legal Document
            </Title>

            <div className="summarize-radio-group">
                <Radio.Group value={mode} onChange={e => setMode(e.target.value)}>
                    <Radio value="select">Choose from existing contracts</Radio>
                    <Radio value="upload">Upload a new file</Radio>
                </Radio.Group>
            </div>

            <div className="summarize-flex">
                {mode === 'select' && (
                    <Card className="summarize-card">
                        <Title level={4}>Select Existing Contract</Title>
                        <Select
                            showSearch
                            allowClear
                            style={{ width: '100%' }}
                            placeholder="Choose contract"
                            optionFilterProp="children"
                            onChange={val => setContractId(val)}
                        >
                            {contracts.map(c => (
                                <Option key={c.id} value={c.id}>{c.title}</Option>
                            ))}
                        </Select>
                    </Card>
                )}

                {mode === 'upload' && (
                    <Card className="summarize-card">
                        <Title level={4}>Upload New File</Title>
                        <Dragger
                            accept=".pdf,.doc,.docx"
                            multiple={false}
                            showUploadList={false}
                            customRequest={({ file, onSuccess }) => {
                                setFile(file);
                                onSuccess('ok');
                            }}
                        >
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                            </p>
                            <p>Click or drag file here</p>
                            {file && <Text type="secondary">Selected: {file.name}</Text>}
                        </Dragger>
                    </Card>
                )}
            </div>

            <div className="summarize-center">
                <Button type="primary" size="large" onClick={handleSummarize} loading={loading}>
                    Summarize
                </Button>
                {result && (
                    <Button type="default" className="summarize-show-btn" onClick={() => setModalVisible(true)}>
                        Show Results
                    </Button>
                )}
            </div>

            <Modal
                title={<div className="summarize-modal-title">📄 Simplified Summary of Contract</div>}
                open={modalVisible}
                footer={null}
                onCancel={() => setModalVisible(false)}
                width={900}
                className="summarize-modal"
            >
                {result && (
                    <div className="summarize-modal-content">
                        {/* Summary */}
                        <div className="summarize-section summarize-summary">
                            <Title level={4} className="summarize-section-title">🧠 Overview Summary</Title>
                            <p className="summarize-paragraph">{result.summary}</p>
                        </div>

                        {/* Clause Explanations */}
                        <div className="summarize-section">
                            <Title level={4} className="summarize-section-title">📌 Clause Explanations</Title>
                            {result.explanations?.map((item, i) => (
                                <div className="summarize-box summarize-explanation" key={i}>
                                    <Text className="summarize-label">{item.clause}</Text>
                                    <p>{item.explanation}</p>
                                </div>
                            ))}
                        </div>

                        {/* Definitions */}
                        <div className="summarize-section">
                            <Title level={4} className="summarize-section-title">📚 Key Terms & Definitions</Title>
                            <Row gutter={[16, 16]}>
                                {result.definitions?.map((item, i) => (
                                    <Col span={12} key={i}>
                                        <div className="summarize-box summarize-definition">
                                            <Text className="summarize-label">{item.term}</Text>
                                            <p>{item.definition}</p>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </div>
                    </div>
                )}
            </Modal>

        </div>
    );
};

export default SummarizeDocs;
