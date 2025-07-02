// src/pages/Profile.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Briefcase,
  Building2,
  Scale,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Profile = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    company: '',
    industry: ''
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

 const loadProfile = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:5000/api/auth/profile', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`
      }
    });
    setProfile(response.data.user); // ✅ use response.data.user
  } catch (error) {
    toast.error('Failed to load profile');
  } finally {
    setLoading(false);
  }
};

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put('http://127.0.0.1:5000/api/auth/profile', profile, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) return <div className="container py-8">Loading...</div>;

  return (
    <div>
      <Navbar/>
    <div className="container py-8">
      
      <h2 className="text-3xl font-bold mb-6">Edit Profile</h2>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
        {/* First Name */}
        <div className="form-group">
          <label className="form-label flex items-center text-gray-700">
            <User className="h-4 w-4 mr-2 text-primary-600" /> First Name
          </label>
          <input
            className="form-input"
            type="text"
            name="first_name"
            value={profile.first_name}
            onChange={handleChange}
            />
        </div>

        {/* Last Name */}
        <div className="form-group">
          <label className="form-label flex items-center text-gray-700">
            <User className="h-4 w-4 mr-2 text-primary-600" /> Last Name
          </label>
          <input
            className="form-input"
            type="text"
            name="last_name"
            value={profile.last_name}
            onChange={handleChange}
            />
        </div>

        {/* Email */}
        <div className="form-group">
          <label className="form-label flex items-center text-gray-700">
            <Mail className="h-4 w-4 mr-2 text-primary-600" /> Email
          </label>
          <input
            className="form-input bg-gray-100"
            type="email"
            name="email"
            value={profile.email}
            disabled
            />
        </div>

        {/* Company */}
        <div className="form-group">
          <label className="form-label flex items-center text-gray-700">
            <Building2 className="h-4 w-4 mr-2 text-primary-600" /> Company
          </label>
          <input
            className="form-input"
            type="text"
            name="company"
            value={profile.company}
            onChange={handleChange}
            />
        </div>

        {/* Industry */}
        <div className="form-group md:col-span-2">
          <label className="form-label flex items-center text-gray-700">
            <Briefcase className="h-4 w-4 mr-2 text-primary-600" /> Industry
          </label>
          <select
            className="form-select"
            name="industry"
            value={profile.industry}
            onChange={handleChange}
            >
            <option value="">Select Industry</option>
            <option value="technology">Technology</option>
            <option value="healthcare">Healthcare</option>
            <option value="finance">Finance</option>
            <option value="legal">Legal Services</option>
            <option value="consulting">Consulting</option>
            <option value="real-estate">Real Estate</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="retail">Retail</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="md:col-span-2 text-right">
          <button className="btn btn-primary mt-4" type="submit">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  </div>
  );
};

export default Profile;
