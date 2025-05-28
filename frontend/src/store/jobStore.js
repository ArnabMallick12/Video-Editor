import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useJobStore = create((set, get) => ({
  jobs: [],
  loading: false,
  error: null,

  setJobs: (jobs) => set({ jobs }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchJobs: async () => {
    try {
      set({ loading: true, error: null });
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ jobs: data, loading: false });
    } catch (error) {
      console.error('Error fetching jobs:', error);
      set({ error: error.message || 'Failed to fetch jobs', loading: false });
    }
  },

  addJob: async (jobData) => {
    try {
      set({ loading: true, error: null });
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase
        .from('jobs')
        .insert([
          {
            user_id: session.user.id,
            input_url: jobData.inputUrl,
            output_url: jobData.outputUrl,
            thumbnail_url: jobData.thumbnailUrl,
            status: 'completed',
            settings: {
              trimStart: jobData.trimStart,
              trimEnd: jobData.trimEnd,
              isMuted: jobData.isMuted,
              overlayText: jobData.overlayText,
              overlayPosition: jobData.overlayPosition,
              overlayColor: jobData.overlayColor,
              overlaySize: jobData.overlaySize
            }
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      set(state => ({
        jobs: [data, ...state.jobs],
        loading: false
      }));
    } catch (error) {
      console.error('Error adding job:', error);
      set({ error: error.message || 'Failed to add job', loading: false });
      throw error;
    }
  },

  deleteJob: async (jobId) => {
    try {
      set({ loading: true, error: null });
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)
        .eq('user_id', session.user.id);

      if (error) throw error;
      
      set(state => ({
        jobs: state.jobs.filter(job => job.id !== jobId),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting job:', error);
      set({ error: error.message || 'Failed to delete job', loading: false });
      throw error;
    }
  }
})); 