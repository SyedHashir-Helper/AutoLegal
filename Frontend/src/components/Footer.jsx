import React from 'react';
import { Mail, Github, Linkedin } from 'lucide-react';
import '../styles/Footer.css';

const Footer = () => {
  return (
    <footer className="autolegal-footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h2 className="brand-text">Auto<span className="gradient-text">Legal</span></h2>
          <p className="footer-subtext">Your AI-powered legal assistant for faster, smarter contract management.</p>
        </div>

        <div className="footer-links">
          <a href="mailto:support@autolegal.com" className="footer-link"><Mail size={18} /> support@autolegal.com</a>
          <a href="https://github.com/your-repo" target="_blank" rel="noopener noreferrer" className="footer-link">
            <Github size={18} /> GitHub
          </a>
          <a href="https://linkedin.com/company/autolegal" target="_blank" rel="noopener noreferrer" className="footer-link">
            <Linkedin size={18} /> LinkedIn
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} AutoLegal. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
