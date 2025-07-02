// src/components/SOWGenerator.js
import React, { useState } from 'react';
import { Form, Input, Button, DatePicker, Divider, Row, Col, message } from 'antd';
import moment from 'moment';
import axios from 'axios';
import '../styles/GenerateDocument.css';

const { TextArea } = Input;

const SOWGenerator = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState(null);

  const handleSubmit = async (values) => {
    const formattedValues = {
      document_date: values.document_date ? values.document_date.format('MMMM D, YYYY') : '',
      project_title: values.project_title,
      client: {
        company_name: values.client_company_name,
        address: values.client_address,
        email: values.client_email,
        signatory_name: values.client_signatory_name,
        signatory_title: values.client_signatory_title
      },
      service_provider: {
        name: values.sp_name,
        email: values.sp_email,
        address: values.sp_address,
        signatory_name: values.sp_signatory_name,
        signatory_title: values.sp_signatory_title
      },
      project_objective: values.project_objective,
      scope_of_work: values.scope_of_work?.split('\n').map(line => ({ content: line.trim() })).filter(item => item.content),
      timeline: {
        duration: values.timeline_duration,
        start_date: values.timeline_start ? values.timeline_start.format('MMMM D, YYYY') : '',
        end_date: values.timeline_end ? values.timeline_end.format('MMMM D, YYYY') : ''
      },
      deliverables: values.deliverables?.split('\n').map(line => ({ content: line.trim() })).filter(item => item.content),
      payment: {
        total_fee: values.total_fee,
        schedule: values.payment_schedule,
        method: values.payment_method
      },
      assumptions: values.assumptions?.split('\n').map(line => ({ content: line.trim() })).filter(item => item.content),
      additional_terms_content: values.additional_terms_content,
      termination_clause: values.termination_clause,
      approval_clause: values.approval_clause
    };
    setLoading(true);

    try {
        console.log(formattedValues)
      const res = await axios.post('http://localhost:5000/api/contracts/sow/generate', formattedValues);
      if (res.data?.download_url) {
        setDownloadLink(res.data.download_url);
        message.success('Document generated successfully');
      } else {
        message.error('Unexpected response from server');
      }
    } catch (err) {
      message.error('Failed to generate document');
    }
    finally{
      setLoading(false);
    }
  };

  return (
    <div className="generate-subform">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <div className="generate-section">
          <h3>Project Info</h3>
          <Divider />
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Document Date" name="document_date" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Project Title" name="project_title" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
        </div>

        <div className="generate-section">
          <h3>Client Info</h3>
          <Divider />
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Company Name" name="client_company_name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Address" name="client_address" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Email" name="client_email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Signatory Name" name="client_signatory_name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Signatory Title" name="client_signatory_title" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
        </div>

        <div className="generate-section">
          <h3>Service Provider Info</h3>
          <Divider />
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Name" name="sp_name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Email" name="sp_email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Address" name="sp_address" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Signatory Name" name="sp_signatory_name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Signatory Title" name="sp_signatory_title" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
        </div>

        <div className="generate-section">
          <h3>Project Details</h3>
          <Divider />
          <Form.Item label="Project Objective" name="project_objective" rules={[{ required: true }]}><TextArea rows={3} /></Form.Item>
          <Form.Item label="Scope of Work (one per line)" name="scope_of_work" rules={[{ required: true }]}><TextArea rows={4} /></Form.Item>
        </div>

        <div className="generate-section">
          <h3>Timeline</h3>
          <Divider />
          <Row gutter={16}>
            <Col span={8}><Form.Item label="Duration" name="timeline_duration" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item label="Start Date" name="timeline_start" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item label="End Date" name="timeline_end" rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
        </div>

        <div className="generate-section">
          <h3>Deliverables</h3>
          <Divider />
          <Form.Item label="List of Deliverables (one per line)" name="deliverables" rules={[{ required: true }]}><TextArea rows={4} /></Form.Item>
        </div>

        <div className="generate-section">
          <h3>Payment Terms</h3>
          <Divider />
          <Row gutter={16}>
            <Col span={8}><Form.Item label="Total Fee" name="total_fee" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item label="Payment Schedule" name="payment_schedule" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={8}><Form.Item label="Payment Method" name="payment_method" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
        </div>

        <div className="generate-section">
          <h3>Assumptions</h3>
          <Divider />
          <Form.Item label="Assumptions (one per line)" name="assumptions" rules={[{ required: true }]}><TextArea rows={4} /></Form.Item>
        </div>

        <div className="generate-section">
          <h3>Additional Terms & Termination</h3>
          <Divider />
          <Form.Item label="Confidentiality Clause" name="additional_terms_content" rules={[{ required: true }]}><TextArea rows={3} /></Form.Item>
          <Form.Item label="Termination Clause" name="termination_clause" rules={[{ required: true }]}><TextArea rows={3} /></Form.Item>
        </div>

        <div className="generate-section">
          <h3>Approval</h3>
          <Divider />
          <Form.Item label="Approval Clause" name="approval_clause" rules={[{ required: true }]}><TextArea rows={3} /></Form.Item>
        </div>

        <div className="generate-submit">
          <Button type="primary" htmlType="submit" loading={loading}>Generate SOW</Button>
        </div>
      </Form>

      {downloadLink && (
        <div className="generate-json-output">
          <p>✅ Document ready:</p>
          <a href={downloadLink} target="_blank" rel="noopener noreferrer">Download</a>
        </div>
      )}
    </div>
  );
};

export default SOWGenerator;
