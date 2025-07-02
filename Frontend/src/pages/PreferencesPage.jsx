// src/pages/Preferences.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
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
    ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Preferences = () => {
    const [form, setForm] = useState({});
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const fetchPreferences = async () => {
  try {
    const res = await axios.get('http://127.0.0.1:5000/api/auth/preferences', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    const rawPrefs = res.data.preferences || {};
    const parsed = {};

    for (const docType in rawPrefs) {
      try {
        parsed[docType] = JSON.parse(rawPrefs[docType]);  // ✅ Parse stringified JSON
      } catch (err) {
        console.warn(`Could not parse preferences for ${docType}:`, err);
      }
    }

    // Flatten into single-level form like before
    const flat = Object.values(parsed).reduce((acc, prefs) => ({ ...acc, ...prefs }), {});
    setForm(flat);
  } catch (error) {
    toast.error('Failed to load preferences');
  }
};

    useEffect(() => {
        fetchPreferences();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://127.0.0.1:5000/api/auth/preferences', form, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access_token')}`
                }
            });
            toast.success('Preferences updated');
        } catch (error) {
            toast.error('Failed to update preferences');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navigation */}
            <Navbar/>
            <div className='container'>

                <h1 className="text-3xl font-bold mb-6 text-center">Your Document Preferences</h1>
                <form onSubmit={handleSubmit} className="space-y-8 margin-bottom-10">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-8">
                            {/* NDA */}
                            <section className="card p-6">
                                <h2 className="text-xl font-semibold mb-4">📜 NDA Preferences</h2>
                                <div className="form-group">
                                    <label className="form-label">Mutual or one-way NDA?</label><br />
                                    <label><input type="radio" name="nda_type" value="mutual" checked={form.nda_type === 'mutual'} onChange={handleChange} /> Mutual</label>
                                    <label className="ml-4"><input type="radio" name="nda_type" value="one_way" checked={form.nda_type === 'one_way'} onChange={handleChange} /> One-way</label>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Duration of confidentiality</label>
                                    <input name="nda_duration" value={form.nda_duration || ''} onChange={handleChange} className="form-input" placeholder="e.g., 2 years" />
                                </div>
                                <div className="form-group">
                                    <label><input type="checkbox" name="nda_non_compete" checked={form.nda_non_compete || false} onChange={handleChange} /> Include non-compete?</label>
                                </div>
                                <div className="form-group">
                                    <label><input type="checkbox" name="nda_non_solicit" checked={form.nda_non_solicit || false} onChange={handleChange} /> Include non-solicit?</label>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Exceptions to confidentiality</label>
                                    <input name="nda_exceptions" value={form.nda_exceptions || ''} onChange={handleChange} className="form-input" />
                                </div>
                            </section>

                            {/* Freelancer Agreement */}
                            <section className="card p-6">
                                <h2 className="text-xl font-semibold mb-4">💼 Freelancer Agreement Preferences</h2>
                                <div className="form-group">
                                    <label className="form-label">Ownership of deliverables</label><br />
                                    <label><input type="radio" name="freelancer_ownership" value="client" checked={form.freelancer_ownership === 'client'} onChange={handleChange} /> Client</label>
                                    <label className="ml-4"><input type="radio" name="freelancer_ownership" value="freelancer" checked={form.freelancer_ownership === 'freelancer'} onChange={handleChange} /> Freelancer</label>
                                </div>
                                <div className="form-group">
                                    <label><input type="checkbox" name="freelancer_portfolio_rights" checked={form.freelancer_portfolio_rights || false} onChange={handleChange} /> Retain rights for portfolio use?</label>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Termination notice period</label>
                                    <input name="freelancer_termination_notice" value={form.freelancer_termination_notice || ''} onChange={handleChange} className="form-input" placeholder="e.g., 7 days" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Payment frequency</label><br />
                                    <label><input type="radio" name="freelancer_payment_frequency" value="weekly" checked={form.freelancer_payment_frequency === 'weekly'} onChange={handleChange} /> Weekly</label>
                                    <label className="ml-4"><input type="radio" name="freelancer_payment_frequency" value="biweekly" checked={form.freelancer_payment_frequency === 'biweekly'} onChange={handleChange} /> Biweekly</label>
                                    <label className="ml-4"><input type="radio" name="freelancer_payment_frequency" value="monthly" checked={form.freelancer_payment_frequency === 'monthly'} onChange={handleChange} /> Monthly</label>
                                </div>
                                <div className="form-group">
                                    <label><input type="checkbox" name="freelancer_arbitration" checked={form.freelancer_arbitration || false} onChange={handleChange} /> Include arbitration clause?</label>
                                </div>
                            </section>
                        </div>

                        <div className="space-y-8">
                            {/* SOW */}
                            <section className="card p-6">
                                <h2 className="text-xl font-semibold mb-4">📄 SOW Preferences</h2>
                                <div className="form-group">
                                    <label className="form-label">Expected project duration (months)</label>
                                    <input name="sow_duration" value={form.sow_duration || ''} onChange={handleChange} className="form-input" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Payment method</label><br />
                                    <label><input type="radio" name="sow_payment_method" value="fixed" checked={form.sow_payment_method === 'fixed'} onChange={handleChange} /> Fixed</label>
                                    <label className="ml-4"><input type="radio" name="sow_payment_method" value="hourly" checked={form.sow_payment_method === 'hourly'} onChange={handleChange} /> Hourly</label>
                                    <label className="ml-4"><input type="radio" name="sow_payment_method" value="milestone" checked={form.sow_payment_method === 'milestone'} onChange={handleChange} /> Milestone-based</label>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Revision limit</label>
                                    <input name="sow_revisions" value={form.sow_revisions || ''} onChange={handleChange} className="form-input" placeholder="e.g., 2 rounds" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Late delivery penalty</label>
                                    <input name="sow_penalty" value={form.sow_penalty || ''} onChange={handleChange} className="form-input" placeholder="e.g., 5% per week" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Change request handling</label><br />
                                    <label><input type="radio" name="sow_changes" value="addendum" checked={form.sow_changes === 'addendum'} onChange={handleChange} /> Formal addendum</label>
                                    <label className="ml-4"><input type="radio" name="sow_changes" value="email" checked={form.sow_changes === 'email'} onChange={handleChange} /> Email is fine</label>
                                </div>
                            </section>

                            {/* Service Agreement */}
                            <section className="card p-6">
                                <h2 className="text-xl font-semibold mb-4">🔧 Service Agreement Preferences</h2>
                                <div className="form-group">
                                    <label className="form-label">SLA uptime requirement</label>
                                    <input name="service_sla_uptime" value={form.service_sla_uptime || ''} onChange={handleChange} className="form-input" placeholder="e.g., 99.9%" />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Max support response time</label>
                                    <input name="service_response_time" value={form.service_response_time || ''} onChange={handleChange} className="form-input" placeholder="e.g., 4 hours" />
                                </div>
                                <div className="form-group">
                                    <label><input type="checkbox" name="service_downtime_credit" checked={form.service_downtime_credit || false} onChange={handleChange} /> Include service credits for downtime?</label>
                                </div>
                                <div className="form-group">
                                    <label><input type="checkbox" name="service_scope_approval" checked={form.service_scope_approval || false} onChange={handleChange} /> Scope change approval required?</label>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Renewal reminder period</label>
                                    <input name="service_renewal_reminder" value={form.service_renewal_reminder || ''} onChange={handleChange} className="form-input" placeholder="e.g., 30 days before expiry" />
                                </div>
                            </section>
                        </div>
                    </div>

                    <div className="mt-6 text-center">
                        <button type="submit" className="btn btn-primary">Save Preferences</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Preferences;
