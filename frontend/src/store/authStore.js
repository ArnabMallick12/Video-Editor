import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      set({ user: data.user, session: data.session, loading: false });
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  signUp: async (email, password) => {
    try {
      set({ loading: true, error: null });
      
      // Sign up and sign in immediately
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            email_confirmed: true
          }
        }
      });
      
      if (error) throw error;

      // Set the user and session immediately
      set({ 
        user: data.user, 
        session: data.session, 
        loading: false 
      });
      
      return data;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, session: null, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  initialize: async () => {
    try {
      set({ loading: true });
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session) {
        set({ user: session.user, session, loading: false });
      } else {
        set({ user: null, session: null, loading: false });
      }

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session);
          set({ user: session?.user || null, session: session || null });
        }
      );

      return () => subscription.unsubscribe();
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },
})); 