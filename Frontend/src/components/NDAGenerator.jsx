// src/components/NDAGenerator.js
import React, { useState } from 'react';
import { Form, Input, Button, DatePicker, Divider, message } from 'antd';
import moment from 'moment';
import axios from 'axios';
import '../styles/GenerateDocument.css';

const { TextArea } = Input;

const NDAGenerator = () => {
  const [form] = Form.useForm();
  const [generatedJSON, setGeneratedJSON] = useState(null);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values) => {
    const formattedValues = {
      agreement_date: values.agreement_date ? values.agreement_date.format('YYYY-MM-DD') : undefined,
      disclosing_party: {
        company_name: values.dp_company_name,
        address: values.dp_address,
        email: values.dp_email,
        signatory_name: values.dp_signatory_name,
        signatory_title: values.dp_signatory_title
      },
      receiving_party: {
        name: values.rp_name,
        address: values.rp_address,
        email: values.rp_email,
        signatory_name: values.rp_signatory_name,
        signatory_title: values.rp_signatory_title
      },
      confidential_info_types: values.confidential_info_types,
      purpose_of_disclosure: values.purpose_of_disclosure,
      agreement_duration: values.agreement_duration,
      governing_law: values.governing_law,
      jurisdiction: values.jurisdiction
    };

    setGeneratedJSON(formattedValues);
    setDownloadUrl(null);
    setLoading(true);

    try {
      const res = await axios.post(
        'http://localhost:5000/api/contracts/nda/generate',
        formattedValues,
        { headers: { 'Content-Type': 'application/json' } }
      );
      if (res.data?.download_url) {
        message.success('NDA generated successfully');
        setDownloadUrl(res.data.download_url);
      } else {
        message.error('Failed to get document link');
      }
    } catch (err) {
      console.error(err);
      message.error('Document generation failed');
    } finally {
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
          <h3>Agreement Info</h3>
          <Divider />
          <Form.Item label="Agreement Date" name="agreement_date" rules={[{ required: true, message: "Agreement Date is required" }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </div>

        <Divider orientation="left">Disclosing Party Info</Divider>
        <div className="generate-grid-2col">
          <Form.Item label="Company Name" name="dp_company_name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Address" name="dp_address" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Email" name="dp_email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item label="Signatory Name" name="dp_signatory_name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Signatory Title" name="dp_signatory_title" rules={[{ required: true }]}><Input /></Form.Item>
        </div>

        <Divider orientation="left">Receiving Party Info</Divider>
        <div className="generate-grid-2col">
          <Form.Item label="Name" name="rp_name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Address" name="rp_address" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Email" name="rp_email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item label="Signatory Name" name="rp_signatory_name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Signatory Title" name="rp_signatory_title" rules={[{ required: true }]}><Input /></Form.Item>
        </div>

        <Divider orientation="left">Disclosure Details</Divider>
        <Form.Item label="Purpose of Disclosure" name="purpose_of_disclosure" rules={[{ required: true }]}>
          <TextArea rows={3} />
        </Form.Item>
        <Form.Item label="Types of Confidential Information" name="confidential_info_types" rules={[{ required: true }]}>
          <TextArea rows={3} />
        </Form.Item>

        <Divider orientation="left">Legal Terms</Divider>
        <div className="generate-grid-2col">
          <Form.Item label="Agreement Duration" name="agreement_duration" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Governing Law" name="governing_law" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item label="Jurisdiction" name="jurisdiction" rules={[{ required: true }]}><Input /></Form.Item>
        </div>

        <div className="generate-submit">
          <Button type="primary" htmlType="submit" loading={loading}>
            Generate NDA
          </Button>
        </div>
      </Form>

      {downloadUrl && (
        <div className="generate-download-link">
          <Divider />
          <Button type="link" href={downloadUrl} target="_blank">
            📄 Download NDA Document
          </Button>
        </div>
      )}
    </div>
  );
};

export default NDAGenerator;
