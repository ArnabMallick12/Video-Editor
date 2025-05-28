// src/pages/UploadPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient.js';
import { useEditorStore } from '../store/editStore.js';

export default function UploadPage() {
  const [videoFile, setVideoFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const navigate = useNavigate();
  const setVideoUrl = useEditorStore((state) => state.setVideoUrl);

  const handleUpload = async () => {
    if (!videoFile) return alert('Please select a file.');

    // Add file size check (e.g., 100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (videoFile.size > maxSize) {
      alert('File size too large. Please select a file under 100MB.');
      return;
    }

    setUploading(true);
    const fileExt = videoFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    
    try {
      const { data, error } = await supabase.storage
        .from('video')
        .upload(fileName, videoFile);

      if (error) {
        throw error;
      }

      const { data: publicUrl } = supabase.storage
        .from('video')
        .getPublicUrl(fileName);

      setVideoUrl(publicUrl.publicUrl);
      navigate('/edit');
    } catch (error) {
      console.error('Upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setVideoFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Video Editor
          </h1>
          <p className="text-gray-400 text-lg">
            Upload your video to start editing
          </p>
        </div>

        <div 
          className={`relative border-2 border-dashed rounded-xl p-12 transition-all duration-300 ${
            dragActive 
              ? 'border-blue-500 bg-blue-500/10' 
              : 'border-gray-600 hover:border-gray-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <svg 
              className={`w-16 h-16 mx-auto mb-4 transition-colors duration-300 ${
                dragActive ? 'text-blue-400' : 'text-gray-400'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
              />
            </svg>
            
            <p className="text-xl mb-2">
              {videoFile ? videoFile.name : 'Drag and drop your video here'}
            </p>
            
            <p className="text-gray-400 mb-6">
              or click to select a file
            </p>

            <input
              type="file"
              accept="video/*"
              onChange={(e) => setVideoFile(e.target.files[0])}
              className="hidden"
              id="file-upload"
            />
            
            <label
              htmlFor="file-upload"
              className="inline-block bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transform transition-all duration-300 hover:scale-105 cursor-pointer shadow-lg"
            >
              Select Video
            </label>
          </div>
        </div>

        {videoFile && (
          <div className="mt-8 text-center">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:from-green-400 disabled:to-emerald-500 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 disabled:scale-100 shadow-lg inline-flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Uploading...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload & Continue
                </>
              )}
            </button>
          </div>
        )}

        <div className="mt-12 text-center text-gray-400">
          <p className="mb-2">Supported formats: MP4, WebM, MOV</p>
          <p>Maximum file size: 100MB</p>
        </div>
      </div>
    </div>
  );
}
