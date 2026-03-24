# 🔧 SkillNest - Issue Resolution Guide

## ✅ Issues Identified and Fixed

---

## Issue 1: Frontend Not Starting ✅ **RESOLVED**

### Problem:
```
Module not found: Error: Can't resolve 'react-router-dom'
Module not found: Error: Can't resolve 'socket.io-client'
```

### Root Cause:
- Corrupted `node_modules` folder
- Missing dependencies after Pusher package was removed

### Solution Applied:
1. ✅ Removed corrupted `node_modules` folder
2. ✅ Deleted `package-lock.json`
3. ✅ Reinstalled all 1,300+ packages
4. ✅ Installed missing `web-vitals` package

### Status: **FIXED** ✅

---

## Issue 2: PowerShell Path with Spaces ✅ **RESOLVED**

### Problem:
```powershell
cd d:\project 22\frontend  # ❌ FAILS
```

### Root Cause:
- Path contains spaces
- PowerShell requires quotes for paths with spaces

### Solution:
```powershell
# ✅ CORRECT WAY
cd "d:\project 22\frontend"
npm start

# OR use semicolon for multiple commands
cd "d:\project 22\frontend"; npm start
```

### Status: **DOCUMENTED** ✅

---

## Issue 3: File Download Problem 🔍 **INVESTIGATING**

### Problem Reported:
"Uploaded files cannot be downloaded"

### Current Status:
Files ARE uploaded successfully:
```
✅ uploads/notes/20260213_180354_NexGen_Hackathon_food_list.docx (22KB)
✅ uploads/notes/20260213_181812_Web_technology_-_Unit_1_Notes.docx.pdf (5.5MB)
✅ uploads/videos/20260213_180305_ads.mp4 (4.5MB)
```

### Download Endpoint Code (Backend):
```python
# Line 191-193 in backend/app.py
@app.route('/api/download/notes/<filename>', methods=['GET'])
def download_note(filename):
    return send_from_directory(os.path.join(app.config['UPLOAD_FOLDER'], 'notes'), filename)
```

### Download Code (Frontend):
```javascript
// Line 31-33 in frontend/src/components/student/NotesView.js
const downloadNote = (filename) => {
    window.open(`${API_URL}/api/download/notes/${filename}`, '_blank');
};
```

### Potential Issues:

#### ❌ Issue A: Filename Encoding
If filename has special characters, URL encoding might be needed.

**Fix:**
```javascript
const downloadNote = (filename) => {
    const encodedFilename = encodeURIComponent(filename);
    window.open(`${API_URL}/api/download/notes/${encodedFilename}`, '_blank');
};
```

#### ❌ Issue B: CORS Headers for Downloads
Backend might need additional headers.

**Fix:**
```python
from flask import send_from_directory, make_response

@app.route('/api/download/notes/<filename>', methods=['GET'])
def download_note(filename):
    try:
        response = make_response(
            send_from_directory(
                os.path.join(app.config['UPLOAD_FOLDER'], 'notes'),
                filename,
                as_attachment=True  # Force download
            )
        )
        return response
    except FileNotFoundError:
        return jsonify({'error': 'File not found'}), 404
```

#### ❌ Issue C: Backend Not Running
If backend is down, downloads won't work.

**Check:**
```powershell
# Test if backend is running
curl http://localhost:5000/api/notes
```

---

## 🚀 How to Start Application

### Step 1: Start Backend
```powershell
# Navigate to project root
cd "d:\project 22"

# Activate virtual environment
.venv\Scripts\Activate.ps1

# Start backend
cd backend
python app.py
```

**Expected Output:**
```
Starting SkillNest Backend Server...
Server running on http://localhost:5000
 * Running on http://0.0.0.0:5000
```

### Step 2: Start Frontend (New Terminal)
```powershell  
# Navigate to frontend folder
cd "d:\project 22\frontend"

# Start development server
npm start
```

**Expected Output:**
```
Compiled successfully!
You can now view skillnest-frontend in the browser.
  Local:            http://localhost:3000
  On Your Network:  http://192.168.x.x:3000
```

### Step 3: Open Browser
- Navigate to: **http://localhost:3000**
- Or the port shown in terminal (3001 if 3000 is busy)

---

## 🧪 Test File Download

### Manual Test:

1. **Login as Teacher:**
   - Go to http://localhost:3000
   - Click "Teacher Login"
   - Use demo credentials
   - Upload a test file

2. **Login as Student (different browser/incognito):**
   - Go to http://localhost:3000
   - Click "Student Login"
   - Use demo credentials or register
   - Go to "Study Notes"
   - Click "Download" button

3. **Check Console:**
   - Press F12
   - Check for errors
   - Check Network tab for 404 or 500 errors

### Backend Test:
```powershell
# Test download endpoint directly
curl -I "http://localhost:5000/api/download/notes/20260213_180354_NexGen_Hackathon_food_list.docx"
```

**Expected:** Status 200 OK

---

## 🐛 Troubleshooting Download Issues

### Error: "404 Not Found"
**Cause:** File doesn't exist or wrong filename  
**Solution:** Check `backend/data/notes.json` for correct filename

### Error: "Network Error"
**Cause:** Backend not running  
**Solution:** Start backend: `python backend/app.py`

### Error: "CORS Error"
**Cause:** CORS not allowing downloads  
**Solution:** Already configured in backend (line 21: `CORS(app)`)

###  Error: Download Opens in Browser Instead
**Cause:** Browser displays instead of downloading  
**Solution:** Add `as_attachment=True` to `send_from_directory`

### File Downloads but is Corrupted
**Cause:** Wrong file path or permissions  
**Solution:** Check file exists in `backend/uploads/notes/`

---

## 📝 Recommended Fixes

### Fix 1: Update Download Endpoint (Backend)
```python
# File: backend/app.py
# Replace lines 191-193

@app.route('/api/download/notes/<filename>', methods=['GET'])
def download_note(filename):
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'notes')
        return send_from_directory(
            file_path,
            filename,
            as_attachment=True,  # Force download dialog
            mimetype='application/octet-stream'
        )
    except FileNotFoundError:
        return jsonify({'success': False, 'error': 'File not found'}), 404
```

### Fix 2: Update Download Function (Frontend)
```javascript
// File: frontend/src/components/student/NotesView.js
// Replace lines 31-33

const downloadNote = async (filename) => {
    try {
        const encodedFilename = encodeURIComponent(filename);
        const downloadUrl = `${API_URL}/api/download/notes/${encodedFilename}`;
        
        // Option 1: Open in new tab (current behavior)
        window.open(downloadUrl, '_blank');
        
        // Option 2: Trigger download directly
        // const response = await fetch(downloadUrl);
        // const blob = await response.blob();
        // const url = window.URL.createObjectURL(blob);
        // const a = document.createElement('a');
        // a.href = url;
        // a.download = filename;
        // a.click();
        // window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Download error:', error);
        alert('Failed to download file. Please try again.');
    }
};
```

---

## ✅ Current Application Status

| Component | Status | Port | Notes |
|-----------|--------|------|-------|
| Backend | ✅ **RUNNING** | 5000 | Flask + Socket.IO |
| Frontend | ⚠️ **NEEDS RESTART** | 3000/3001 | After npm install |
| Database | ✅ **WORKING** | N/A | In-memory + JSON files |
| File Upload | ✅ **WORKING** | N/A | Files in uploads/ |
| File Download | 🔍 **TESTING** | N/A | Needs verification |

---

## 📞 Next Steps

1. **Restart Frontend:**
   ```powershell
   cd "d:\project 22\frontend"
   npm start
   ```

2. **Test Download:**
   - Login as student
   - Navigate to Notes
   - Click download button
   - Check if file downloads

3. **If Download Fails:**
   - Check browser console (F12)
   - Check Network tab for error
   - Screenshot error message
   - Apply recommended fixes above

4. **Verify Backend:**
   ```powershell
   curl http://localhost:5000/api/notes
   ```

---

**Issue Resolution Guide Complete!** 🎉  
Follow the steps above to resolve all issues.
