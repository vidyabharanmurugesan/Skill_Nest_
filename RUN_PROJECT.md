# 🚀 How to Run SkillNest

## Quick Start Guide

### Step 1: Install Backend Dependencies

Open a terminal in the project root and run:

```bash
# Navigate to backend folder
cd backend

# Install Python dependencies using pip
pip install -r requirements.txt
```

Or if you want to use a virtual environment:

```bash
# Navigate to backend folder
cd backend

# Activate your virtual environment (if you have one)
.\.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 2: Start Backend Server

```bash
# Make sure you're in the backend folder
cd backend

# Run the Flask server
python app.py
```

You should see:
```
Starting SkillNest Backend Server...
Server running on http://localhost:5000
```

**Keep this terminal open!**

---

### Step 3: Install Frontend Dependencies (if needed)

Open a NEW terminal and run:

```bash
# Navigate to frontend folder
cd frontend

# Install Node.js dependencies (only needed first time)
npm install
```

### Step 4: Start Frontend Server

```bash
# Make sure you're in the frontend folder
cd frontend

# Start React development server
npm start
```

You should see:
```
Compiled successfully!
You can now view frontend in the browser.
Local: http://localhost:3000
```

**Keep this terminal open too!**

---

## ✅ Verify Everything is Running

You should have TWO terminals running:

1. **Terminal 1** - Backend (Python Flask)
   - Running on: http://localhost:5000
   
2. **Terminal 2** - Frontend (React)
   - Running on: http://localhost:3000

---

## 🌐 Access the Application

Open your browser and go to: **http://localhost:3000**

---

## 🔑 Demo Credentials

**Teacher Login:**
- Email: `teacher@skillnest.com`
- Password: `teacher123`

**Student Login:**
- Email: `student@skillnest.com`
- Password: `student123`

---

## ❌ Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'deep_translator'"

**Solution:**
```bash
cd backend
pip install deep-translator
```

### Issue: Backend won't start

**Solution:**
```bash
cd backend
pip install Flask Flask-CORS Flask-SocketIO python-socketio deep-translator Werkzeug python-dotenv
python app.py
```

### Issue: Frontend won't start

**Solution:**
```bash
cd frontend
npm install
npm start
```

### Issue: Port 3000 or 5000 already in use

**Solution:**
- Close any other applications using those ports
- Or change the port in the code

---

## 📁 Project Structure

```
d:\project 22\
├── backend/
│   ├── app.py              ← Main Flask server
│   ├── requirements.txt    ← Python dependencies
│   ├── uploads/           ← Uploaded files folder
│   └── data/              ← Database files
│
├── frontend/
│   ├── src/               ← React source code
│   ├── public/            ← Static files
│   ├── package.json       ← Node.js dependencies
│   └── node_modules/      ← Installed packages
│
├── README.md              ← Full documentation
├── DEMO_GUIDE.md          ← Demo instructions
└── RUN_PROJECT.md         ← This file
```

---

## 🎯 Next Steps

1. ✅ Start both servers (backend + frontend)
2. ✅ Open http://localhost:3000
3. ✅ Login with demo credentials
4. ✅ Explore all features
5. ✅ Record your demo video!

---

## Need Help?

- Check that both terminals are running
- Make sure no errors in the terminal output
- Verify you're using the correct URLs
- Try refreshing the browser

**Enjoy using SkillNest! 🎓✨**
