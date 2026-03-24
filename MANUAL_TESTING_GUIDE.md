# 📸 Manual Testing & Screenshot Guide

## 🎯 Purpose
Since automated browser testing is unavailable, this guide will help you manually test and capture screenshots of the SkillNest application.

---

## ✅ Pre-Testing Checklist

Before starting, ensure:
- [ ] Backend is running: `cd backend && python app.py`
- [ ] Frontend is running: `cd frontend && npm start`
- [ ] Browser is open
- [ ] Screenshot tool ready (Win + Shift + S on Windows)

---

## 📸 Test 1: Landing Page

### Steps:
1. Open browser
2. Navigate to: **http://localhost:3000/**
3. Wait for page to load fully

### Screenshot Requirements:
- **Filename:** `01_landing_page.png`
- **Capture:** Full page showing:
  - SkillNest logo
  - Feature cards
  - Teacher Login button
  - Student Login button
  - Footer

### Expected Result:
✅ Page loads with animations
✅ All buttons visible
✅ No console errors

### If Error Appears:
❌ Take screenshot showing error
❌ Check browser console (F12)
❌ Screenshot console errors

---

## 📸 Test 2: Student Login Page

### Steps:
1. From landing page
2. Click: **"Student Login"** button
3. Wait for login page to load

### Screenshot Requirements:
- **Filename:** `02_student_login.png`
- **Capture:** Login form showing:
  - Student icon (👨‍🎓)
  - "Student Login" heading
  - Email input field
  - Password input field
  - "Login" button
  - "Use Demo Credentials" button
  - "Register here" link

### Expected Result:
✅ URL changes to: /login/student
✅ Form loads correctly
✅ Back button visible

### If Error Appears:
❌ Screenshot error message
❌ Note the URL

---

## 📸 Test 3: Registration Form

### Steps:
1. From Student Login page
2. Click: **"Register here"** link
3. Wait for form to update

### Screenshot Requirements:
- **Filename:** `03_registration_form.png`
- **Capture:** Registration form showing:
  - "Student Register" heading
  - Name input field (NEW)
  - Email input field
  - Password input field
  - "Register" button
  - "Login here" link

### Expected Result:
✅ Heading changes to "Student Register"
✅ Name field appears
✅ "Login here" link visible

---

## 📸 Test 4: New Student Registration (Success)

### Steps:
1. Fill registration form:
   - **Name:** Test Student
   - **Email:** teststudent@example.com
   - **Password:** test123456
2. Click: **"Register"** button
3. Wait for response

### Screenshot Requirements:
- **Filename:** `04_registration_success.png`
- **Capture:** Dashboard after successful registration

### Expected Result:
✅ Redirects to: /student
✅ Shows Student Dashboard
✅ Welcome message visible

### If Error Appears:
❌ Screenshot error message
❌ Note error text

---

## 📸 Test 5: Duplicate Registration (Error)

### Steps:
1. Go back to registration
2. Fill form with EXISTING email:
   - **Name:** Another Student
   - **Email:** student@skillnest.com (existing)
   - **Password:** test123
3. Click: **"Register"**

### Screenshot Requirements:
- **Filename:** `05_duplicate_error.png`
- **Capture:** Error message showing:
  - Form with filled data
  - Red error message
  - Form still active

### Expected Result:
✅ Error message: "User already exists"
✅ Form stays on same page
✅ Red error box visible

---

## 📸 Test 6: Teacher Login with Demo Credentials

### Steps:
1. Navigate to: http://localhost:3000/
2. Click: **"Teacher Login"**
3. Click: **"Use Demo Credentials"**
4. Verify fields are filled:
   - Email: teacher@skillnest.com
   - Password: teacher123
5. Click: **"Login"**

### Screenshot Requirements:
**Before Login:**
- **Filename:** `06a_demo_credentials.png`
- **Capture:** Form with demo credentials filled

**After Login:**
- **Filename:** `06b_teacher_dashboard.png`
- **Capture:** Teacher Dashboard

### Expected Result:
✅ Email/password auto-filled
✅ Redirects to: /teacher
✅ Shows Teacher Dashboard

---

## 📸 Test 7: Invalid Login (Error)

### Steps:
1. Navigate to login page
2. Fill with WRONG credentials:
   - **Email:** wrong@email.com
   - **Password:** wrongpassword
3. Click: **"Login"**

### Screenshot Requirements:
- **Filename:** `07_invalid_login.png`
- **Capture:** Error message showing:
  - Form with wrong credentials
  - Error message: "Invalid credentials"
  - Form still active

### Expected Result:
✅ Error message appears
✅ Stays on login page
✅ Can retry login

---

## 📸 Test 8: Navigation Test

### Steps:
1. From any login page
2. Click: **"← Back to Home"** button

### Screenshot Requirements:
- **Filename:** `08_navigation.png`
- **Capture:** Landing page after clicking back

### Expected Result:
✅ Returns to landing page
✅ URL: http://localhost:3000/

---

## 📸 Test 9: Browser Console Check

### Steps:
1. On any page
2. Press **F12** to open Developer Tools
3. Click **Console** tab
4. Look for errors (red text)

### Screenshot Requirements:
- **Filename:** `09_console_errors.png` (if errors exist)
- **Filename:** `09_console_clean.png` (if no errors)
- **Capture:** Console showing:
  - Any red error messages
  - Or empty/clean console

### Expected Result:
✅ No critical errors
⚠️ Warnings are OK
❌ Red errors need fixing

---

## 📸 Test 10: Network Tab Check

### Steps:
1. Open Developer Tools (F12)
2. Click **Network** tab
3. Refresh page
4. Click on any failed requests (red)

### Screenshot Requirements:
- **Filename:** `10_network_errors.png` (if errors)
- **Filename:** `10_network_success.png` (if success)
- **Capture:** Network tab showing:
  - API calls to /api/login or /api/register
  - Status codes (200 = success, 400/401 = error)

### Expected Result:
✅ Status 200 for successful requests
✅ Status 401 for invalid login
✅ Status 400 for duplicate registration

---

## 🔍 Additional Tests

### Test 11: Student Dashboard Features
1. After logging in as student
2. Navigate through:
   - Chat page
   - Notes page
   - Videos page
   - Live Classes

**Screenshot each page!**

### Test 12: Teacher Dashboard Features
1. After logging in as teacher
2. Navigate through:
   - Upload Notes
   - Upload Video
   - Live Class
   - Chat

**Screenshot each page!**

---

## 📊 Screenshot Summary Checklist

After completing all tests, you should have:

- [ ] 01_landing_page.png
- [ ] 02_student_login.png
- [ ] 03_registration_form.png
- [ ] 04_registration_success.png
- [ ] 05_duplicate_error.png
- [ ] 06a_demo_credentials.png
- [ ] 06b_teacher_dashboard.png
- [ ] 07_invalid_login.png
- [ ] 08_navigation.png
- [ ] 09_console_*.png
- [ ] 10_network_*.png
- [ ] Additional dashboard screenshots

---

## 🐛 Common Issues to Look For

### Visual Issues:
- [ ] Buttons not aligned
- [ ] Text overlapping
- [ ] Colors not showing
- [ ] Icons missing

### Functional Issues:
- [ ] Forms not submitting
- [ ] Navigation not working
- [ ] Error messages not showing
- [ ] Data not persisting

### Console Errors to Note:
- [ ] 404 errors (file not found)
- [ ] CORS errors (cross-origin)
- [ ] API errors (backend down)
- [ ] JavaScript errors

---

## 📝 How to Take Screenshots

### Windows:
1. **Full Screen:** Press `PrtScn`
2. **Selected Area:** Press `Win + Shift + S`
3. **Window Only:** Press `Alt + PrtScn`

### Save Screenshots:
1. Paste into Paint or image editor
2. Save with correct filename
3. Store in: `d:\project 22\screenshots\`

---

## ✅ After Testing

Once you have all screenshots:

1. **Create folder:** `d:\project 22\screenshots\`
2. **Save all screenshots** there
3. **Share with developer** for review
4. **Note any unexpected behavior**

---

## 📞 Questions to Answer

After testing, answer these:

1. **Did the landing page load correctly?** (Yes/No)
2. **Did registration work for new user?** (Yes/No)
3. **Did error show for duplicate email?** (Yes/No)
4. **Did demo login work?** (Yes/No)
5. **Did invalid login show error?** (Yes/No)
6. **Did navigation work properly?** (Yes/No)
7. **Were there any console errors?** (Yes/No)
8. **Did dashboards load after login?** (Yes/No)

---

**Testing Guide Complete!**  
Follow each test in order and capture screenshots as specified.
