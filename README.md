# Video Editor Web Application

A full-stack web application for video editing with features like trimming, text overlay, and thumbnail generation. Built with React, Node.js, and FFmpeg.

## Features

### Core Features
- Video upload and processing
- Video trimming with start and end time selection
- Text overlay with customizable:
  - Position (draggable)
  - Color
  - Size
- Thumbnail generation
- Video download
- Thumbnail download
- Video sharing via URL

### Authentication & User Management
- User registration and login
- Secure session management
- Protected routes

### Job History
- Track all processed videos
- View processing history
- Delete processed videos
- See previous edits

## Tech Stack

### Frontend
- React.js
- Tailwind CSS
- Zustand (State Management)
- React Router
- Supabase Client

### Backend
- Node.js
- Express.js
- FFmpeg
- Supabase (Storage & Database)
- Multer (File Upload)

## Prerequisites

- Node.js (v14 or higher)
- FFmpeg installed on your system
- Supabase account and project

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd video-editor
```

2. Install frontend dependencies:
```bash
cd frontend
npm install
```

3. Install backend dependencies:
```bash
cd ../backend
npm install
```

4. Create a `.env` file in the backend directory:
```env
PORT=5000
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

```

5. Create a `.env` file in the frontend directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

```

## Running the Application

1. Start the backend server:
```bash
cd backend
npm run dev
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
video-editor/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── store/
│   │   └── lib/
│   └── public/
└── backend/
    ├── src/
    │   ├── controllers/
    │   ├── routes/
    │   ├── utils/
    │   └── middleware/
    └── temp/
```

## Implementation Focus

This project is a full-stack implementation with equal emphasis on both frontend and backend development:

### Frontend Focus
- Modern, responsive UI with Tailwind CSS
- Smooth animations and transitions
- Intuitive user experience
- Real-time feedback for user actions
- Drag-and-drop functionality for text positioning
- Error handling and user notifications

### Backend Focus
- Efficient video processing with FFmpeg
- Secure file handling
- Optimized storage management
- Robust error handling
- CORS configuration
- File cleanup and temporary storage management

## Bonus Features

1. **Draggable Text Overlay**
   - Interactive text positioning
   - Real-time preview
   - Position persistence

2. **Advanced Video Controls**
   - Custom video player controls
   - Thumbnail preview

3. **User Experience**
   - Loading states and animations
   - Error handling with user feedback

