// src/components/FileUpload.js
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';

const FileUpload = ({ onSuccess, onClose }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, DOC, DOCX, or TXT file');
      return;
    }

    // Validate file size (16MB limit)
    if (file.size > 16 * 1024 * 1024) {
      toast.error('File size must be less than 16MB');
      return;
    }

    await uploadFile(file);
  }, []);

  const uploadFile = async (file) => {
    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, "")); // Remove extension

      const response = await axios.post('http://127.0.0.1:5000/api/upload/contract', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });

      if (response.data.contract) {
        onSuccess(response.data.contract);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'text/plain': ['.txt']
    },
    multiple: false,
    maxSize: 16 * 1024 * 1024, // 16MB
  });

  return (
    <div className="modal-overlay">
      <div className="modal animate-slide-up">
        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-title">Upload Contract</h3>
          <button onClick={onClose} className="modal-close">
            <X />
          </button>
        </div>

        {/* Upload Area */}
        <div className="modal-body">
          <div
            {...getRootProps()}
            className={`
              dropzone
              ${isDragActive && !isDragReject ? 'drag-active' : ''}
              ${isDragReject ? 'drag-reject' : ''}
              ${uploading ? 'uploading' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {uploading ? (
              <div className="space-y-4">
                <div className="loading-spinner mx-auto"></div>
                <div>
                  <p className="dropzone-title">Uploading...</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="dropzone-meta mt-1">{uploadProgress}% complete</p>
                </div>
              </div>
            ) : (
              <div>
                {isDragReject ? (
                  <div className="space-y-2">
                    <AlertCircle className="dropzone-icon text-error-500" />
                    <p className="dropzone-title text-error-600">File type not supported</p>
                    <p className="dropzone-meta text-error-500">Please upload PDF, DOC, DOCX, or TXT files</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className={`transition-transform ${isDragActive ? 'transform scale-110' : ''}`}>
                      {isDragActive ? (
                        <Upload className="dropzone-icon text-primary-600" />
                      ) : (
                        <FileText className="dropzone-icon" />
                      )}
                    </div>
                    
                    <div>
                      <p className="dropzone-title">
                        {isDragActive ? 'Drop your file here' : 'Drag & drop your contract here'}
                      </p>
                      <p className="dropzone-description">or click to browse</p>
                    </div>
                    
                    <div className="dropzone-meta">
                      <p>Supported formats: PDF, DOC, DOCX, TXT</p>
                      <p>Maximum file size: 16MB</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button
            onClick={onClose}
            disabled={uploading}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;