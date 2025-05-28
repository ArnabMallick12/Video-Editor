// src/pages/EditorPage.jsx
import { useEditorStore } from '../store/editStore';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobStore } from '../store/jobStore';
import { supabase } from '../lib/supabaseClient.js';

export default function EditorPage() {
  const navigate = useNavigate();
  const videoUrl = useEditorStore((s) => s.videoUrl);
  const trimStart = useEditorStore((s) => s.trimStart);
  const trimEnd = useEditorStore((s) => s.trimEnd);
  const isMuted = useEditorStore((s) => s.isMuted);
  const setTrimStart = useEditorStore((s) => s.setTrimStart);
  const setTrimEnd = useEditorStore((s) => s.setTrimEnd);
  const toggleMute = useEditorStore((s) => s.toggleMute);
  const overlayText = useEditorStore((s) => s.overlayText);
  const overlayPosition = useEditorStore((s) => s.overlayPosition);
  const overlayColor = useEditorStore((s) => s.overlayColor);
  const overlaySize = useEditorStore((s) => s.overlaySize);
  const setOverlayText = useEditorStore((s) => s.setOverlayText);
  const setOverlayPosition = useEditorStore((s) => s.setOverlayPosition);
  const setOverlayColor = useEditorStore((s) => s.setOverlayColor);
  const setOverlaySize = useEditorStore((s) => s.setOverlaySize);
  const setVideoUrl = useEditorStore((s) => s.setVideoUrl);

  const videoRef = useRef(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [previewText, setPreviewText] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 }); // Position in percentage
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailError, setThumbnailError] = useState(null);
  const videoContainerRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      // Set crossOrigin attribute
      videoRef.current.crossOrigin = 'anonymous';
      
      const handleLoadedMetadata = () => {
        if (videoRef.current) {
          setVideoDuration(videoRef.current.duration);
          // Set initial trim end to video duration
          if (!trimEnd || trimEnd > videoRef.current.duration) {
            setTrimEnd(videoRef.current.duration);
          }
        }
      };

      // Handle CORS errors
      const handleError = (e) => {
        console.error('Video loading error:', e);
        setError('Error loading video. Please try again.');
      };

      videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      videoRef.current.addEventListener('error', handleError);

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          videoRef.current.removeEventListener('error', handleError);
        }
      };
    }
  }, [videoUrl]);

  // Update preview text when overlay settings change
  useEffect(() => {
    if (overlayText) {
      setPreviewText(overlayText);
    }
  }, [overlayText, overlayColor, overlaySize]);

  const handleDragStart = (e) => {
    e.preventDefault();
    if (!videoContainerRef.current) return;
    
    const rect = videoContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ x, y });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    if (!isDragging || !videoContainerRef.current) return;
    
    const rect = videoContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate new position as percentage
    const newX = Math.max(0, Math.min(100, (x / rect.width) * 100));
    const newY = Math.max(0, Math.min(100, (y / rect.height) * 100));
    
    setTextPosition({ x: newX, y: newY });
  };

  const handleDragEnd = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // Add global mouse event listeners
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleDrag);
      window.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  const validateTrimValues = () => {
    if (trimStart < 0 || trimEnd < 0) {
      throw new Error('Trim values cannot be negative');
    }
    if (trimStart >= trimEnd) {
      throw new Error('Start time must be less than end time');
    }
    if (trimEnd > videoDuration) {
      throw new Error('End time cannot exceed video duration');
    }
  };

  const captureThumbnail = async () => {
    try {
      setThumbnailError(null);
      if (!videoRef.current) return;

      // Create canvas with video dimensions
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');

      // Draw the current video frame
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      // Convert to blob with error handling
      try {
        const blob = await new Promise((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to create thumbnail'));
            }
          }, 'image/jpeg', 0.95);
        });

        const thumbnailUrl = URL.createObjectURL(blob);
        setThumbnail(thumbnailUrl);
      } catch (blobError) {
        console.error('Blob creation error:', blobError);
        setThumbnailError('Failed to create thumbnail. Please try again.');
      }
    } catch (error) {
      console.error('Thumbnail capture error:', error);
      setThumbnailError('Failed to capture thumbnail. Please try again.');
    }
  };

  const handleProcess = async () => {
    try {
      setError(null);
      validateTrimValues();
      setProcessing(true);

      // Check authentication first
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Please sign in to process videos');
      }

      // Create form data to send both video processing options and thumbnail
      const formData = new FormData();
      
      // Ensure all values are properly formatted
      formData.append('videoUrl', videoUrl || '');
      formData.append('trimStart', trimStart?.toString() || '0');
      formData.append('trimEnd', trimEnd?.toString() || '0');
      formData.append('isMuted', isMuted?.toString() || 'false');
      formData.append('overlayText', overlayText || '');
      formData.append('overlayPosition', JSON.stringify({
        x: textPosition?.x || 50,
        y: textPosition?.y || 50
      }));
      formData.append('overlayColor', overlayColor || '#ffffff');
      formData.append('overlaySize', overlaySize?.toString() || '24');

      // Add thumbnail if available
      if (thumbnail) {
        try {
          const thumbnailBlob = await fetch(thumbnail).then(r => r.blob());
          formData.append('thumbnail', thumbnailBlob, 'thumbnail.jpg');
        } catch (error) {
          console.error('Error creating thumbnail blob:', error);
          // Continue without thumbnail if there's an error
        }
      }

      console.log('Sending form data:', Object.fromEntries(formData.entries()));

      const response = await fetch('http://localhost:5000/api/edit', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Processing failed');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Processing failed');
      }

      // Save job history
      try {
        await useJobStore.getState().addJob({
          inputUrl: videoUrl,
          outputUrl: data.videoUrl,
          thumbnailUrl: data.thumbnailUrl,
          trimStart: parseFloat(trimStart),
          trimEnd: parseFloat(trimEnd),
          isMuted: isMuted === 'true',
          overlayText,
          overlayPosition: textPosition,
          overlayColor,
          overlaySize: parseInt(overlaySize)
        });
      } catch (error) {
        console.error('Error saving job history:', error);
        // Show error but continue since the video was processed successfully
        setError('Video processed successfully, but failed to save to history. Please try again later.');
      }

      // Store both video and thumbnail URLs
      setVideoUrl(data.videoUrl);
      if (data.thumbnailUrl) {
        useEditorStore.getState().setThumbnailUrl(data.thumbnailUrl);
      }
      navigate('/result');
    } catch (error) {
      console.error('Processing error:', error);
      setError(error.message || 'An error occurred while processing the video');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Edit Your Video
          </h2>
          <p className="text-gray-400">Trim, add text, and customize your video</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white p-4 rounded-xl mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {videoUrl ? (
          <div className="space-y-8">
            <div className="relative group" ref={videoContainerRef}>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-xl blur-xl group-hover:blur-2xl transition-all duration-300" />
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                crossOrigin="anonymous"
                className="relative max-w-full w-full rounded-xl shadow-2xl transform transition-transform duration-300 group-hover:scale-[1.02]"
              />
              {previewText && (
                <div
                  className={`absolute text-white select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                  style={{
                    left: `${textPosition.x}%`,
                    top: `${textPosition.y}%`,
                    transform: 'translate(-50%, -50%)',
                    color: overlayColor,
                    fontSize: `${overlaySize}px`,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.5)',
                    zIndex: 10,
                  }}
                  onMouseDown={handleDragStart}
                >
                  {previewText}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-xl">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Trim Video
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Start Time (seconds)</label>
                    <input
                      type="number"
                      min={0}
                      max={videoDuration}
                      step="0.1"
                      value={trimStart}
                      onChange={(e) => setTrimStart(Number(e.target.value))}
                      className="w-full bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors duration-300"
                    />
                    <span className="text-sm text-gray-400 mt-1 block">
                      Max: {videoDuration.toFixed(1)}s
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">End Time (seconds)</label>
                    <input
                      type="number"
                      min={0}
                      max={videoDuration}
                      step="0.1"
                      value={trimEnd}
                      onChange={(e) => setTrimEnd(Number(e.target.value))}
                      className="w-full bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors duration-300"
                    />
                    <span className="text-sm text-gray-400 mt-1 block">
                      Max: {videoDuration.toFixed(1)}s
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="mute"
                      checked={isMuted}
                      onChange={toggleMute}
                      className="w-4 h-4 rounded border-gray-600 bg-gray-700/50 focus:ring-blue-500"
                    />
                    <label htmlFor="mute" className="text-sm font-medium text-gray-400">
                      Mute Audio
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700/50 shadow-xl">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v18m1.5-18v18M6 20.25V3.75M18 20.25V3.75" />
                  </svg>
                  Text Overlay
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Text</label>
                    <input
                      type="text"
                      value={overlayText}
                      onChange={(e) => setOverlayText(e.target.value)}
                      placeholder="Enter overlay text"
                      className="w-full bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Font Size</label>
                    <input
                      type="number"
                      min="12"
                      max="72"
                      value={overlaySize}
                      onChange={(e) => setOverlaySize(e.target.value)}
                      className="w-full bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:border-blue-500 transition-colors duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={overlayColor}
                        onChange={(e) => setOverlayColor(e.target.value)}
                        className="w-12 h-12 p-1 rounded-lg border border-gray-600 bg-gray-700/50"
                      />
                      <span className="text-sm text-gray-400">
                        {overlayColor}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <p className="text-sm text-gray-400 mb-2">
                      Click and drag the text to position it anywhere on the video
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">X: {Math.round(textPosition.x)}%</span>
                      <span className="text-sm text-gray-400">Y: {Math.round(textPosition.y)}%</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-700/50">
                    <h4 className="text-lg font-medium mb-3">Thumbnail</h4>
                    <div className="space-y-4">
                      {thumbnailError && (
                        <div className="bg-red-500/20 border border-red-500 text-white p-3 rounded-lg flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {thumbnailError}
                        </div>
                      )}

                      <button
                        onClick={captureThumbnail}
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-2 rounded-lg hover:from-purple-600 hover:to-pink-700 transform transition-all duration-300 hover:scale-105 shadow-lg inline-flex items-center justify-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Capture Current Frame
                      </button>

                      {thumbnail && (
                        <div className="relative group">
                          <img
                            src={thumbnail}
                            alt="Video thumbnail"
                            className="w-full rounded-lg shadow-lg"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                            <button
                              onClick={() => {
                                setThumbnail(null);
                                setThumbnailError(null);
                              }}
                              className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg transform transition-all duration-300 hover:scale-105"
                            >
                              Remove Thumbnail
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={handleProcess}
                disabled={processing}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 disabled:from-blue-400 disabled:to-indigo-500 disabled:cursor-not-allowed transform transition-all duration-300 hover:scale-105 disabled:scale-100 shadow-lg inline-flex items-center gap-2"
              >
                {processing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Process Video
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p className="text-xl mb-6 text-gray-300">No video loaded.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transform transition-all duration-300 hover:scale-105 shadow-lg"
            >
              Upload a Video
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
