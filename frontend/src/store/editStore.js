// src/store/editorStore.js
import { create } from 'zustand';

export const useEditorStore = create((set) => ({
  videoUrl: '',
  setVideoUrl: (url) => set({ videoUrl: url }),
  trimStart: 0,
  trimEnd: 10,
  isMuted: false,
  setTrimStart: (val) => set({ trimStart: val }),
  setTrimEnd: (val) => set({ trimEnd: val }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),

  overlayText: '',
  overlayPosition: 'bottom', // top | center | bottom
  overlayColor: '#FFFFFF',
  overlaySize: '24',

  setOverlayText: (text) => set({ overlayText: text }),
  setOverlayPosition: (pos) => set({ overlayPosition: pos }),
  setOverlayColor: (color) => set({ overlayColor: color }),
  setOverlaySize: (size) => set({ overlaySize: size }),

  // Add thumbnail state
  thumbnailUrl: '',
  setThumbnailUrl: (url) => set({ thumbnailUrl: url }),
}));
