// src/components/ProfessionalAgreementGenerator.js
import React, { useState } from 'react';
import { Form, Input, Button, DatePicker, Divider, Row, Col, message } from 'antd';
import moment from 'moment';
import axios from 'axios';
import '../styles/GenerateDocument.css';

const { TextArea } = Input;

const ServiceAgreement = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [downloadLink, setDownloadLink] = useState(null);

  const handleSubmit = async (values) => {
    const formattedValues = {
      document_type: 'Professional Services Agreement',
      effective_date: values.effective_date ? values.effective_date.format('MMMM D, YYYY') : '',
      provider: {
        company_name: values.provider_company_name,
        address: values.provider_address,
        email: values.provider_email,
        signatory_name: values.provider_signatory_name,
        signatory_title: values.provider_signatory_title
      },
      customer: {
        company_name: values.customer_company_name,
        address: values.customer_address,
        email: values.customer_email,
        signatory_name: values.customer_signatory_name,
        signatory_title: values.customer_signatory_title
      },
      service_description: values.service_description,
      subscription_fee: values.subscription_fee,
      service_plan: values.service_plan,
      payment_terms: values.payment_terms,
      uptime_guarantee: values.uptime_guarantee,
      maintenance_notice: values.maintenance_notice,
      data_ownership_clause: values.data_ownership_clause,
      confidentiality_clause: values.confidentiality_clause,
      term_and_termination_clause: values.term_and_termination_clause,
      liability_limitation_clause: values.liability_limitation_clause,
      additional_sections_title: values.additional_sections_title,
      additional_sections_content: values.additional_sections_content,
      governing_law_clause: values.governing_law_clause
    };

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/contracts/service-agreement/generate', formattedValues);
      if (res.data?.download_url) {
        setDownloadLink(res.data.download_url);
        message.success('Document generated successfully');
      } else {
        message.error('Unexpected response from server');
      }
    } catch (err) {
      message.error('Failed to generate document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="generate-subform">
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <div className="generate-section">
          <h3>Agreement Info</h3>
          <Divider />
          <Form.Item label="Effective Date" name="effective_date" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <div className="generate-section">
          <h3>Service Provider Info</h3>
          <Divider />
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Company Name" name="provider_company_name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Address" name="provider_address" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Email" name="provider_email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Signatory Name" name="provider_signatory_name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Signatory Title" name="provider_signatory_title" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
        </div>

        <div className="generate-section">
          <h3>Customer Info</h3>
          <Divider />
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Company Name" name="customer_company_name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Address" name="customer_address" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Email" name="customer_email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Signatory Name" name="customer_signatory_name" rules={[{ required: true }]}><Input /></Form.Item></Col>
            <Col span={12}><Form.Item label="Signatory Title" name="customer_signatory_title" rules={[{ required: true }]}><Input /></Form.Item></Col>
          </Row>
        </div>

        <div className="generate-section">
          <h3>Service Details</h3>
          <Divider />
          <Form.Item label="Service Description" name="service_description" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Service Plan" name="service_plan" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Subscription Fee" name="subscription_fee" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Payment Terms" name="payment_terms" rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Uptime Guarantee" name="uptime_guarantee" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Maintenance Notice" name="maintenance_notice" rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
        </div>

        <div className="generate-section">
          <h3>Legal & Confidentiality</h3>
          <Divider />
          <Form.Item label="Data Ownership Clause" name="data_ownership_clause" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Confidentiality Clause" name="confidentiality_clause" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Term and Termination Clause" name="term_and_termination_clause" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Liability Limitation Clause" name="liability_limitation_clause" rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Governing Law Clause" name="governing_law_clause" rules={[{ required: true }]}>
            <TextArea rows={2} />
          </Form.Item>
        </div>

        <div className="generate-section">
          <h3>Additional Section</h3>
          <Divider />
          <Form.Item label="Section Title" name="additional_sections_title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Section Content" name="additional_sections_content" rules={[{ required: true }]}>
            <TextArea rows={3} />
          </Form.Item>
        </div>

        <div className="generate-submit">
          <Button type="primary" htmlType="submit" loading={loading}>Generate Agreement</Button>
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

export default ServiceAgreement;
