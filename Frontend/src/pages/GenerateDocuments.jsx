// src/components/GenerateDocuments.js
import React, { useState } from 'react';
import { Tabs } from 'antd';
import '../styles/GenerateDocument.css';
import NDAGenerator from '../components/NDAGenerator';
import SOWGenerator from '../components/SOWGenerator';
import ServiceAgreement from '../components/ServiceAgreement';
import Navbar from '../components/Navbar';
// import SOWGenerator from './SOWGenerator';
// import ServiceAgreementGenerator from './ServiceAgreementGenerator';
// import FreelancerAgreementGenerator from './FreelancerAgreementGenerator';

const { TabPane } = Tabs;

const GenerateDocuments = () => {
  return (
    <div>
      <Navbar />
      <div className="generate-container">
        <h2 className="generate-title">Generate Legal Document</h2>

        <div className="generate-form">
          <Tabs defaultActiveKey="NDA" className="generate-tabs">
            <TabPane tab="Non-Disclosure Agreement" key="NDA">
              <NDAGenerator />
            </TabPane>
            <TabPane tab="Statement of Work (SOW)" key="SOW">
              <SOWGenerator />
            </TabPane>
            <TabPane tab="Service Agreement" key="ServiceAgreement">
              <ServiceAgreement />
            </TabPane>
            <TabPane tab="Freelancer Agreement" key="FreelancerAgreement">
              Coming Soon...
            </TabPane>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default GenerateDocuments;
