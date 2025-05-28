import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobStore } from '../store/jobStore';
import { useAuthStore } from '../store/authStore';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { jobs, loading, error, fetchJobs, deleteJob } = useJobStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchJobs();
  }, [user, navigate]);

  const handleDelete = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await deleteJob(jobId);
      } catch (error) {
        console.error('Error deleting job:', error);
      }
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Processing History
          </h2>
          <button
            onClick={() => navigate('/')}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-700 transform transition-all duration-300 hover:scale-105 shadow-lg"
          >
            New Video
          </button>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white p-4 rounded-xl mb-6 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-xl mb-6 text-gray-300">No processing history yet.</p>
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-700 transform transition-all duration-300 hover:scale-105 shadow-lg"
            >
              Process Your First Video
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-xl overflow-hidden group"
              >
                <div className="relative aspect-video">
                  {job.thumbnail_url ? (
                    <img
                      src={job.thumbnail_url}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-700/50 flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-2">
                    <a
                      href={job.output_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-500/80 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transform transition-all duration-300 hover:scale-105"
                    >
                      View Video
                    </a>
                    <button
                      onClick={() => handleDelete(job.id)}
                      className="bg-red-500/80 hover:bg-red-600 text-white px-4 py-2 rounded-lg transform transition-all duration-300 hover:scale-105"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-sm text-gray-400">
                        {new Date(job.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(job.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                      {job.status}
                    </span>
                  </div>
                  {job.settings.overlayText && (
                    <p className="text-sm text-gray-300 truncate">
                      Text: {job.settings.overlayText}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {job.settings.trimStart > 0 && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-500/20 text-blue-400">
                        Trim: {job.settings.trimStart}s - {job.settings.trimEnd}s
                      </span>
                    )}
                    {job.settings.isMuted && (
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400">
                        Muted
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 