# SkillNest - Rural Education Platform

SkillNest is a comprehensive web application designed to empower rural education through technology. It bridges the language gap between teachers and students with real-time English-Tamil translation in chat.

## 🌟 Features

### For Teachers
- **Dashboard**: Overview of teaching activities and statistics
- **Notes Upload**: Share study materials (PDF, DOC, DOCX, TXT)
- **Video Upload**: Upload video lectures (MP4, AVI, MOV, WMV up to 500MB)
- **Live Classes**: Conduct real-time interactive sessions
- **One-to-One Chat**: Communicate with students (Tamil to English translation)

### For Students
- **Dashboard**: Track learning progress
- **Study Notes**: Access and download learning materials
- **Video Lectures**: Watch recorded lessons at your own pace
- **Live Classes**: Join interactive sessions with teachers
- **One-to-One Chat**: Ask questions (English to Tamil translation)

### Key Innovation
**Real-Time Translation**: Students type in English, teachers see Tamil (and vice versa), making education accessible across language barriers.

## 🛠️ Technology Stack

### Frontend
- React
- React Router
- Socket.IO Client
- Axios
- Modern CSS with gradients and animations

### Backend
- Python Flask
- Flask-SocketIO (Real-time communication)
- Flask-CORS
- Google Translate API
- Eventlet

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- Python (v3.8 or higher)
- pip

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Run the backend server:
```bash
python app.py
```

The backend will start on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The frontend will start on `http://localhost:3000`

## 🚀 Quick Start

### Demo Credentials

**Teacher Login:**
- Email: teacher@skillnest.com
- Password: teacher123

**Student Login:**
- Email: student@skillnest.com
- Password: student123

You can also use the "Use Demo Credentials" button on the login page.

## 📁 Project Structure

```
skillnest/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── teacher/
│   │   │   │   ├── NotesUpload.js
│   │   │   │   ├── VideoUpload.js
│   │   │   │   ├── LiveClass.js
│   │   │   │   ├── Upload.css
│   │   │   │   └── LiveClass.css
│   │   │   ├── student/
│   │   │   │   ├── NotesView.js
│   │   │   │   ├── VideosView.js
│   │   │   │   ├── LiveClassJoin.js
│   │   │   │   └── StudentView.css
│   │   │   ├── LandingPage.js
│   │   │   ├── Login.js
│   │   │   ├── TeacherDashboard.js
│   │   │   ├── StudentDashboard.js
│   │   │   ├── Chat.js
│   │   │   └── [Component CSS files]
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   └── package.json
│
└── backend/
    ├── app.py
    ├── requirements.txt
    ├── uploads/
    │   ├── notes/
    │   └── videos/
    └── data/
```

## 🎨 Design Features

- **Dark Theme**: Modern, eye-friendly dark design
- **Gradient Effects**: Beautiful gradient colors throughout
- **Glass Morphism**: Frosted glass effects for cards
- **Smooth Animations**: Fade-ins, slides, and hover effects
- **Responsive Design**: Works perfectly on mobile and desktop
- **Animated Backgrounds**: Dynamic starfield on landing page

## 💬 Chat Translation Feature

The chat system automatically translates messages:
- **Student → Teacher**: English to Tamil
- **Teacher → Student**: Tamil to English

This ensures seamless communication despite language barriers.

## 📝 Features in Detail

### Notes Management
- Upload multiple file formats
- Add titles and descriptions
- Download materials anytime
- Search functionality

### Video Lectures
- Upload large video files (up to 500MB)
- Built-in video player
- Search and filter videos
- Modal playback for better viewing

### Live Classes
- Real-time sessions
- Participant tracking
- Video controls
- Interactive chat during class

### Real-Time Chat
- Socket.IO powered
- Instant message delivery
- Typing indicators
- Message history
- Toggle translation display

## 🔒 Security Note

This is a demonstration application. For production use, you should:
- Implement proper authentication (JWT, OAuth)
- Add database (PostgreSQL, MongoDB)
- Use environment variables for sensitive data
- Add rate limiting
- Implement file validation and virus scanning
- Use cloud storage for files (AWS S3, Google Cloud Storage)
- Add SSL/TLS encryption

## 🌐 Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge

## 📱 Mobile Support

The application is fully responsive and works on:
- iOS devices
- Android devices
- Tablets

## 🤝 Contributing

This is an educational project. Feel free to fork and enhance it!

## 📄 License

This project is open source and available for educational purposes.

## 👥 Credits

Built with ❤️ for rural education

---

**Note**: Make sure both backend and frontend servers are running simultaneously for the application to work properly.

