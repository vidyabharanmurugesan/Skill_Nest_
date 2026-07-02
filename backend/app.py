import os
from flask import Flask, request, jsonify, send_from_directory, send_file # type: ignore
from flask_cors import CORS # type: ignore
from flask_socketio import SocketIO, emit, join_room, leave_room # type: ignore
from deep_translator import GoogleTranslator # type: ignore
from openai import OpenAI # type: ignore
from dotenv import load_dotenv # type: ignore
load_dotenv()

try:
    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "missing_key"))
except Exception:
    client = None

import re
import json
from datetime import datetime
from werkzeug.utils import secure_filename # type: ignore
import secrets


import sys
import io
# Standard fix for charmap encoding errors on Windows when printing emojis
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(16)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max file size

# Create upload directories
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'notes'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'videos'), exist_ok=True)
os.makedirs('data', exist_ok=True)

CORS(app, resources={r"/*": {"origins": "*"}})
# Let SocketIO auto-detect the best async mode
socketio = SocketIO(app, cors_allowed_origins="*", logger=True, engineio_logger=True)

# Store active chat rooms
active_chats = {}
chat_history = {}

# Helper function to save data for other JSON files
def save_to_file(filename, data):
    with open(f'data/{filename}', 'w') as f:
        json.dump(data, f, indent=2)

def load_from_file(filename):
    try:
        with open(f'data/{filename}', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

# Helper function to update last login
def update_user_last_login(email):
    try:
        users = load_from_file('users.json')
        for user in users:
            if user.get('email') == email:
                user['last_login'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                break
        save_to_file('users.json', users)
    except Exception as e:
        print(f"Error updating last login: {e}")

def get_next_user_id(role, users_list):
    prefix = 'T' if role == 'teacher' else 'S'
    role_users = [u for u in users_list if u.get('role') == role]
    max_num = 0
    for u in role_users:
        try:
            num = int(u.get('id', '')[1:])
            if num > max_num:
                max_num = num
        except:
            pass
    return f"{prefix}{int(max_num) + 1:03d}"

# Authentication endpoints
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.json
        email = data.get('email', '').lower().strip()
        password = data.get('password')
        
        users = load_from_file('users.json')
        user_row = next((u for u in users if u.get('email') == email and u.get('password') == password), None)
        
        if user_row:
            # Update last login time
            try:
                update_user_last_login(email)
            except Exception as e:
                print(f"Failed to update last login: {e}")

            return jsonify({
                'success': True,
                'user': {
                    'email': user_row.get('email'),
                    'name': user_row.get('name'),
                    'role': user_row.get('role'),
                    'id': user_row.get('id')
                }
            })
        
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.json
        email = data.get('email', '').lower().strip()
        password = data.get('password')
        name = data.get('name')
        role = data.get('role', 'student')
        
        # Read existing users from DB
        users = load_from_file('users.json')
        existing = any(u.get('email') == email for u in users)
        
        if existing:
            return jsonify({'success': False, 'message': 'User already exists'}), 400
        
        # Generate ID with global helper
        user_id = get_next_user_id(role, users)
        registered_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        new_user = {
            'id': user_id,
            'email': email,
            'password': password,
            'name': name,
            'role': role,
            'standard': None,
            'registered_at': registered_at,
            'last_login': None
        }
        users.append(new_user)
        save_to_file('users.json', users)
        
        return jsonify({
            'success': True,
            'user': {
                'email': email,
                'name': name,
                'role': role,
                'id': user_id
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': f'Failed to register user: {str(e)}'}), 500

@app.route('/api/auth/google', methods=['POST'])
def google_auth():
    try:
        data = request.json
        email = data.get('email', '').lower().strip()
        name = data.get('name', 'Google User')
        role = data.get('role', 'student')
        
        users = load_from_file('users.json')
        user_row = next((u for u in users if u.get('email') == email), None)
        
        if not user_row:
            # Register new Google user
            user_id = get_next_user_id(role, users)
            registered_at = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            
            user_row = {
                'id': user_id,
                'email': email,
                'password': secrets.token_hex(8),  # random password for google sign-in users
                'name': name,
                'role': role,
                'standard': None,
                'registered_at': registered_at,
                'last_login': registered_at
            }
            users.append(user_row)
            save_to_file('users.json', users)
        else:
            # Update last login
            user_row['last_login'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            save_to_file('users.json', users)
            
        return jsonify({
            'success': True,
            'user': {
                'email': user_row.get('email'),
                'name': user_row.get('name'),
                'role': user_row.get('role'),
                'id': user_row.get('id')
            }
        })
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/config/firebase', methods=['GET'])
def get_firebase_config():
    try:
        return jsonify({
            'apiKey': os.getenv('VITE_FIREBASE_API_KEY'),
            'authDomain': os.getenv('VITE_FIREBASE_AUTH_DOMAIN'),
            'databaseURL': os.getenv('VITE_FIREBASE_DATABASE_URL'),
            'projectId': os.getenv('VITE_FIREBASE_PROJECT_ID'),
            'storageBucket': os.getenv('VITE_FIREBASE_STORAGE_BUCKET'),
            'messagingSenderId': os.getenv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
            'appId': os.getenv('VITE_FIREBASE_APP_ID'),
            'measurementId': os.getenv('VITE_FIREBASE_MEASUREMENT_ID')
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/users', methods=['GET'])
def get_users():
    role = request.args.get('role')
    all_users = load_from_file('users.json')
    if role:
        users = [u for u in all_users if u.get('role') == role]
    else:
        users = all_users
    
    return jsonify({'success': True, 'users': users})

# File upload endpoints
@app.route('/api/upload/notes', methods=['POST'])
def upload_notes():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file provided'}), 400
    
    file = request.files['file']
    title = request.form.get('title', '')
    description = request.form.get('description', '')
    teacher_id = request.form.get('teacher_id', '')
    
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400
    
    filename = secure_filename(file.filename)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{timestamp}_{filename}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'notes', filename)
    file.save(filepath)
    
    # Save note metadata
    notes = load_from_file('notes.json')
    note = {
        'id': len(notes) + 1,
        'title': title,
        'description': description,
        'filename': filename,
        'filepath': filepath,
        'teacher_id': teacher_id,
        'subject': request.form.get('subject', 'General'),
        'standard': request.form.get('standard', 'Unknown'),
        'uploaded_at': datetime.now().isoformat(),
        'status': 'pending'
    }
    notes.append(note)
    save_to_file('notes.json', notes)
    
    return jsonify({'success': True, 'note': note})

@app.route('/api/upload/video', methods=['POST'])
def upload_video():
    if 'file' not in request.files:
        return jsonify({'success': False, 'message': 'No file provided'}), 400
    
    file = request.files['file']
    title = request.form.get('title', '')
    description = request.form.get('description', '')
    teacher_id = request.form.get('teacher_id', '')
    
    if file.filename == '':
        return jsonify({'success': False, 'message': 'No file selected'}), 400
    
    filename = secure_filename(file.filename)
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"{timestamp}_{filename}"
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], 'videos', filename)
    file.save(filepath)
    
    # Save video metadata
    videos = load_from_file('videos.json')
    video = {
        'id': len(videos) + 1,
        'title': title,
        'description': description,
        'filename': filename,
        'filepath': filepath,
        'teacher_id': teacher_id,
        'subject': request.form.get('subject', 'General'),
        'standard': request.form.get('standard', 'Unknown'),
        'uploaded_at': datetime.now().isoformat(),
        'status': 'pending'
    }
    videos.append(video)
    save_to_file('videos.json', videos)
    
    return jsonify({'success': True, 'video': video})

# Get notes and videos
@app.route('/api/notes', methods=['GET'])
def get_notes():
    notes = load_from_file('notes.json')
    return jsonify({'success': True, 'notes': notes})

@app.route('/api/videos', methods=['GET'])
def get_videos():
    videos = load_from_file('videos.json')
    return jsonify({'success': True, 'videos': videos})

@app.route('/api/content/verify', methods=['POST'])
def verify_content():
    try:
        data = request.json
        content_id = data.get('id')
        content_type = data.get('type') # 'notes' or 'videos'
        new_status = data.get('status', 'verified') # 'verified' or 'flagged'
        
        filename = 'notes.json' if content_type == 'notes' else 'videos.json'
        items = load_from_file(filename)
        
        updated = False
        for item in items:
            if str(item.get('id')) == str(content_id):
                item['status'] = new_status
                updated = True
                break
        
        if updated:
            save_to_file(filename, items)
            return jsonify({'success': True, 'message': f'Content marked as {new_status}'})
        
        return jsonify({'success': False, 'message': 'Content not found'}), 404
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

# Download files
@app.route('/api/download/notes/<filename>', methods=['GET'])
def download_note(filename):
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'notes')
        full_path = os.path.join(file_path, filename)
        
        print(f"Download request for: {filename}")
        print(f"Full path: {full_path}")
        print(f"File exists: {os.path.exists(full_path)}")
        
        if not os.path.exists(full_path):
            return jsonify({'error': 'File not found', 'path': full_path}), 404
            
        return send_from_directory(
            file_path,
            filename,
            as_attachment=True
        )
    except Exception as e:
        print(f"Download error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/download/videos/<filename>', methods=['GET'])
def download_video(filename):
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'videos')
        full_path = os.path.join(file_path, filename)
        
        print(f"Download video request for: {filename}")
        print(f"Full path: {full_path}")
        print(f"File exists: {os.path.exists(full_path)}")
        
        if not os.path.exists(full_path):
            return jsonify({'error': 'File not found', 'path': full_path}), 404
            
        return send_from_directory(
            file_path,
            filename,
            as_attachment=True
        )
    except Exception as e:
        print(f"Download video error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Live class endpoints
@app.route('/api/liveclass/start', methods=['POST'])
def start_live_class():
    data = request.json
    teacher_id = data.get('teacher_id')
    title = data.get('title')
    
    live_classes = load_from_file('live_classes.json')
    live_class = {
        'id': len(live_classes) + 1,
        'teacher_id': teacher_id,
        'title': title,
        'subject': data.get('subject', 'General'),
        'standard': data.get('standard', 'Unknown'),
        'status': 'active',
        'started_at': datetime.now().isoformat(),
        'participants': []
    }
    live_classes.append(live_class)
    save_to_file('live_classes.json', live_classes)
    
    return jsonify({'success': True, 'class': live_class})

@app.route('/api/liveclass', methods=['GET'])
def get_live_classes():
    live_classes = load_from_file('live_classes.json')
    active_classes = [c for c in live_classes if c.get('status') == 'active']
    return jsonify({'success': True, 'classes': active_classes})

@app.route('/api/liveclass/end', methods=['POST'])
def end_live_class():
    data = request.json
    class_id = data.get('class_id')
    
    live_classes = load_from_file('live_classes.json')
    for c in live_classes:
        if c.get('id') == class_id:
            c['status'] = 'ended'
            c['ended_at'] = datetime.now().isoformat()
            break
            
    save_to_file('live_classes.json', live_classes)
    
    # Notify students via Socket.IO
    socketio.emit('class_ended', {'class_id': class_id}, room=f"class_{class_id}")
    
    return jsonify({'success': True})

# Store active participants for live classes
live_participants = {}

@socketio.on('join_class_room')
def handle_join_class_room(data):
    class_id = data.get('class_id')
    user_id = data.get('user_id')
    user_name = data.get('user_name')
    room = f"class_{class_id}"
    
    join_room(room)
    
    # Persist participant to live_classes.json
    live_classes = load_from_file('live_classes.json')
    updated = False
    for c in live_classes:
        if c.get('id') == class_id:
            if 'participants' not in c:
                c['participants'] = []
            
            # Add user if not already present
            if not any(p['user_id'] == user_id for p in c['participants']):
                c['participants'].append({
                    'user_id': user_id,
                    'user_name': user_name,
                    'joined_at': datetime.now().isoformat()
                })
                updated = True
            break
    
    if updated:
        save_to_file('live_classes.json', live_classes)

    if room not in live_participants:
        live_participants[room] = []
    
    room_participants = live_participants.get(room, []) # pyre-ignore
    # Check if user already in room
    for p in room_participants: # pyre-ignore
        if p.get('user_id') == user_id:
            return
            
    room_participants.append({ # pyre-ignore
        'user_id': user_id,
        'user_name': user_name
    })
    live_participants[room] = room_participants
    
    print(f"User {user_name} ({user_id}) joined class room: {room}")
    
    # Notify everyone in the room about updated participant list
    emit('participants_update', {
        'participants': live_participants[room],
        'count': len(live_participants[room])
    }, room=room)

@socketio.on('leave_class_room')
def handle_leave_class_room(data):
    class_id = data.get('class_id')
    user_id = data.get('user_id')
    room = f"class_{class_id}"
    
    leave_room(room)
    
    if room in live_participants:
        room_participants = live_participants.get(room, []) # pyre-ignore
        live_participants[room] = [p for p in room_participants if p.get('user_id') != user_id] # pyre-ignore
        
        # Notify everyone
        emit('participants_update', {
            'participants': live_participants[room],
            'count': len(live_participants[room])
        }, room=room)
    
    print(f"User {user_id} left class room: {room}")

@socketio.on('send_class_message')
def handle_class_message(data):
    class_id = data.get('class_id')
    room = f"class_{class_id}"
    message = data.get('message')
    sender_id = data.get('sender_id')
    sender_name = data.get('sender_name')
    sender_role = data.get('sender_role')
    
    message_data = {
        'sender_id': sender_id,
        'sender_name': sender_name,
        'sender_role': sender_role,
        'message': message,
        'timestamp': datetime.now().isoformat()
    }
    
    # Store in history if needed, but for live class simple emit is usually fine
    emit('receive_class_message', message_data, room=room)

@app.route('/api/chat/send', methods=['POST'])
def send_chat_message():
    data = request.json
    room = data.get('room')
    message = data.get('message')
    sender_id = data.get('sender_id')
    sender_name = data.get('sender_name')
    sender_role = data.get('sender_role')
    target_language = data.get('target_language', 'en')
    
    # Original message
    original_message = message
    
    # Translate message if needed
    translated_message = message
    try:
        if sender_role == 'student' and target_language == 'ta':
            # Student types in English, translate to Tamil for teacher
            translated_message = GoogleTranslator(source='en', target='ta').translate(message)
        elif sender_role == 'teacher' and target_language == 'en':
            # Teacher types in Tamil, translate to English for student
            translated_message = GoogleTranslator(source='ta', target='en').translate(message)
    except Exception as e:
        print(f"Translation error: {e}")
        translated_message = message
    
    message_data = {
        'sender_id': sender_id,
        'sender_name': sender_name,
        'sender_role': sender_role,
        'original_message': original_message,
        'translated_message': translated_message,
        'timestamp': datetime.now().isoformat()
    }
    
    # Store in chat history
    if room not in chat_history:
        chat_history[room] = []
    chat_history[room].append(message_data)
    

        
    return jsonify({'success': True, 'message': message_data})

@app.route('/api/chat/history/<room>', methods=['GET'])
def get_chat_history(room):
    if room in chat_history:
        return jsonify({'success': True, 'messages': chat_history[room]})
    return jsonify({'success': True, 'messages': []})

# Socket.IO events for real-time chat with translation
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    emit('connected', {'data': 'Connected to SkillNest'})

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

@socketio.on('join_chat')
def handle_join_chat(data):
    room = data.get('room')
    user_id = data.get('user_id')
    user_name = data.get('user_name')
    
    join_room(room)
    
    if room not in active_chats:
        active_chats[room] = []
    
    if user_id not in active_chats[room]:
        active_chats[room].append(user_id)
    
    emit('user_joined', {
        'user_id': user_id,
        'user_name': user_name,
        'room': room
    }, room=room)
    
    # Send chat history
    if room in chat_history:
        emit('chat_history', {'messages': chat_history[room]})

@socketio.on('leave_chat')
def handle_leave_chat(data):
    room = data.get('room')
    user_id = data.get('user_id')
    
    leave_room(room)
    
    if room in active_chats and user_id in active_chats[room]:
        active_chats[room].remove(user_id)

@socketio.on('send_message')
def handle_message(data):
    room = data.get('room')
    message = data.get('message')
    sender_id = data.get('sender_id')
    sender_name = data.get('sender_name')
    sender_role = data.get('sender_role')
    target_language = data.get('target_language', 'en')
    
    # Original message
    original_message = message
    
    # Translate message if needed
    translated_message = message
    try:
        if sender_role == 'student' and target_language == 'ta':
            # Student types in English, translate to Tamil for teacher
            translated_message = GoogleTranslator(source='en', target='ta').translate(message)
        elif sender_role == 'teacher' and target_language == 'en':
            # Teacher types in Tamil, translate to English for student
            translated_message = GoogleTranslator(source='ta', target='en').translate(message)
    except Exception as e:
        print(f"Translation error: {e}")
        translated_message = message
    
    message_data = {
        'sender_id': sender_id,
        'sender_name': sender_name,
        'sender_role': sender_role,
        'original_message': original_message,
        'translated_message': translated_message,
        'timestamp': datetime.now().isoformat()
    }
    
    # Store in chat history
    if room not in chat_history:
        chat_history[room] = []
    chat_history[room].append(message_data)
    
    # Emit to all users in the room
    emit('receive_message', message_data, room=room)

@socketio.on('typing')
def handle_typing(data):
    room = data.get('room')
    user_name = data.get('user_name')
    is_typing = data.get('is_typing')
    
    emit('user_typing', {
        'user_name': user_name,
        'is_typing': is_typing
    }, room=room, include_self=False)

def cleanup_orphaned_files():
    """Remove database entries for files that don't exist"""
    print("Cleaning up orphaned file references...")
    
    # Clean notes
    notes = load_from_file('notes.json')
    valid_notes = []
    removed_notes = int(0)
    for note in notes:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'notes', note['filename'])
        if os.path.exists(file_path):
            valid_notes.append(note)
        else:
            print(f"  * Removed orphaned note: {note['filename']}")
            removed_notes = removed_notes + 1 # type: ignore
    
    if removed_notes > 0:
        save_to_file('notes.json', valid_notes)
        print(f"[OK] Cleaned {removed_notes} orphaned note(s)")
    
    # Clean videos
    videos = load_from_file('videos.json')
    valid_videos = []
    removed_videos = int(0)
    for video in videos:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], 'videos', video['filename'])
        if os.path.exists(file_path):
            valid_videos.append(video)
        else:
            print(f"  * Removed orphaned video: {video['filename']}")
            removed_videos = removed_videos + 1 # type: ignore
    
    if removed_videos > 0:
        save_to_file('videos.json', valid_videos)
        print(f"[OK] Cleaned {removed_videos} orphaned video(s)")
    
    print("[OK] Database cleanup complete!")

# --- Quiz & Assessment Logic ---

@app.route('/api/quizzes/create', methods=['POST'])
def create_quiz():
    try:
        data = request.json
        quizzes = load_from_file('quizzes.json')
        
        new_quiz = {
            'id': len(quizzes) + 1,
            'title': data.get('title'),
            'subject': data.get('subject'),
            'standard': str(data.get('standard')),
            'teacher_id': data.get('teacher_id'),
            'questions': data.get('questions'), # Expecting list of {q, options:[], correct:idx}
            'created_at': datetime.now().isoformat()
        }
        
        quizzes.append(new_quiz)
        save_to_file('quizzes.json', quizzes)
        return jsonify({'success': True, 'quiz': new_quiz})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/coding/problems', methods=['GET'])
def get_coding_problems():
    language = request.args.get('language', 'Python')
    difficulty = request.args.get('difficulty', 'Easy')
    
    # Mock data for coding problems
    problems = [
        {
            'id': 1,
            'title': 'Sum of Two Numbers',
            'difficulty': 'Easy',
            'languages': ['Python', 'Java', 'JavaScript', 'C++'],
            'description': 'Write a function that returns the sum of two numbers a and b.',
            'template': {
                'Python': 'def solve(a, b):\n    # Return sum of a and b\n    return a + b',
                'Java': 'public class Solution {\n    public int solve(int a, int b) {\n        return a + b;\n    }\n}',
                'JavaScript': 'function solve(a, b) {\n    return a + b;\n}',
                'C++': 'int solve(int a, int b) {\n    return a + b;\n}'
            },
            'points': 10
        },
        {
            'id': 2,
            'title': 'Palindrome Check',
            'difficulty': 'Easy',
            'languages': ['Python', 'JavaScript'],
            'description': 'Write a function that checks if a given string is a palindrome.',
            'template': {
                'Python': 'def is_palindrome(s):\n    return s == s[::-1]',
                'JavaScript': 'function isPalindrome(s) {\n    return s === s.split("").reverse().join("");\n}'
            },
            'points': 15
        },
        {
            'id': 3,
            'title': 'Factorial of N',
            'difficulty': 'Medium',
            'languages': ['Python', 'Java', 'C++', 'JavaScript'],
            'description': 'Given an integer N, calculate its factorial.',
            'template': {
                'Python': 'def factorial(n):\n    if n == 0: return 1\n    return n * factorial(n-1)',
                'Java': 'public class Solution {\n    public int factorial(int n) {\n        if (n == 0) return 1;\n        return n * factorial(n-1);\n    }\n}'
            },
            'points': 30
        },
        {
            'id': 4,
            'title': 'Binary Search',
            'difficulty': 'Medium',
            'languages': ['Python', 'Java', 'C++'],
            'description': 'Implement binary search on a sorted array.',
            'template': {
                'Python': 'def binary_search(arr, x):\n    # Your code here\n    pass'
            },
            'points': 40
        },
        {
            'id': 5,
            'title': 'Merge Sort Implementation',
            'difficulty': 'Hard',
            'languages': ['Python', 'Java', 'C++'],
            'description': 'Implement the merge sort algorithm.',
            'template': {
                'Python': 'def merge_sort(arr):\n    # Your code here\n    pass'
            },
            'points': 70
        },
        {
            'id': 6,
            'title': 'Longest Common Subsequence',
            'difficulty': 'Hard',
            'languages': ['Python', 'Java'],
            'description': 'Find the length of the longest common subsequence of two strings.',
            'template': {
                'Python': 'def lcs(s1, s2):\n    # Your code here\n    pass'
            },
            'points': 100
        }
    ]
    
    # Filter by language and difficulty
    filtered = [p for p in problems if language in p.get('languages', []) and p.get('difficulty') == difficulty] # pyre-ignore
    
    return jsonify({'success': True, 'problems': filtered})

@app.route('/api/quizzes', methods=['GET'])
def get_quizzes():
    quizzes = load_from_file('quizzes.json')
    standard = request.args.get('standard')
    
    # If no quizzes yet, provide defaults for demo
    if not quizzes:
        quizzes = [
            {
                'id': 1,
                'subject': 'Mathematics',
                'standard': '12',
                'title': 'Calculus Basics',
                'questions': [
                    {'q': 'What is the derivative of x^2?', 'options': ['x', '2x', 'x^3', '2'], 'correct': 1},
                    {'q': 'Integrate 1/x', 'options': ['x', 'ln(x)', 'e^x', 'x^2'], 'correct': 1}
                ]
            }
        ]
        save_to_file('quizzes.json', quizzes)

    if standard:
        quizzes = [q for q in quizzes if str(q.get('standard')) == str(standard)]
        
    return jsonify({'success': True, 'quizzes': quizzes})

@app.route('/api/assessment/submit', methods=['POST'])
def submit_assessment():
    data = request.json
    student_id = data.get('student_id')
    student_name = data.get('student_name')
    quiz_id = data.get('quiz_id')
    answers = data.get('answers')
    subject = data.get('subject')
    standard = data.get('standard')
    
    # Use provided score/feedback if available (Manual entry), otherwise calculate
    score = data.get('score')
    ai_feedback = data.get('feedback')
    
    if score is None:
        # Mock AI Evaluation Logic if not manually provided
        total_questions = len(answers or [])
        correct_count = 0
        for i, ans in enumerate(answers or []):
            correct_count += 1 if i % 2 == 0 else 0 
        score = (correct_count / total_questions) * 100 if total_questions > 0 else 0
        ai_feedback = "Excellent grasp of concepts!" if score > 80 else "Good attempt, needs more practice in core areas."
    
    result = {
        'id': secrets.token_hex(4),
        'student_id': student_id,
        'student_name': student_name,
        'quiz_id': quiz_id,
        'subject': subject,
        'standard': standard,
        'score': score,
        'ai_feedback': ai_feedback,
        'timestamp': datetime.now().isoformat()
    }
    
    assessments = load_from_file('assessments.json')
    assessments.append(result)
    save_to_file('assessments.json', assessments)
    
    return jsonify({'success': True, 'result': result})

@app.route('/api/coding/evaluate', methods=['POST'])
def evaluate_code():
    try:
        data = request.json
        code = data.get('code', '')
        language = data.get('language', '')
        problem_title = data.get('problem_title', '')
        student_id = data.get('student_id')
        student_name = data.get('student_name', 'Student')
        
        result_data = None

        if client and os.getenv("OPENAI_API_KEY"):
            try:
                prompt = f"""Evaluate the following {language} code for the problem: '{problem_title}'.
                Code:
                {code}
                
                Return ONLY a JSON response in this format:
                {{
                    "passed": boolean,
                    "score": integer (0-100),
                    "ai_feedback": "A short verdict",
                    "suggestions": ["suggestion 1", "suggestion 2"]
                }}
                """
                
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[{"role": "user", "content": prompt}],
                    response_format={"type": "json_object"}
                )
                result_data = json.loads(response.choices[0].message.content)
            except Exception as ai_err:
                print(f"OpenAI error, falling back to mock: {ai_err}")

        if not result_data:
            # Sophisticated Mock Logic
            passed = len(code) > 30 and ("function" in code or "def " in code or "return" in code)
            score = 85 if passed else 45
            
            if passed:
                feedback = "Excellent structure! Your logic handles the core requirements well."
                suggestions = ["Consider edge case handling", "Add more inline comments for clarity"]
            else:
                feedback = "Logic seems incomplete. Ensure you follow the problem requirements."
                suggestions = ["Check your function syntax", "Make sure all variables are defined"]

            result_data = {
                'passed': passed,
                'score': score,
                'ai_feedback': feedback,
                'suggestions': suggestions
            }
            
        result = {
            'id': secrets.token_hex(4),
            'student_id': student_id,
            'student_name': student_name,
            'language': language,
            'problem_title': problem_title,
            'score': result_data.get('score', 0),
            'passed': result_data.get('passed', False),
            'ai_feedback': result_data.get('ai_feedback', ''),
            'suggestions': result_data.get('suggestions', []),
            'timestamp': datetime.now().isoformat()
        }
        
        # Store coding assessments
        coding_assessments = load_from_file('coding_assessments.json')
        coding_assessments.append(result)
        save_to_file('coding_assessments.json', coding_assessments)
        
        return jsonify({'success': True, 'result': result})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/ai/chat', methods=['POST'])
def ai_chatbot():
    try:
        data = request.json
        message = data.get('message', '')
        student_id = data.get('student_id', 'anonymous')
        
        reply = None

        if client and os.getenv("OPENAI_API_KEY"):
            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=[
                        {"role": "system", "content": "You are a helpful coding assistant for SkillNest students. Help them with their coding doubts and level-specific problems."},
                        {"role": "user", "content": message}
                    ]
                )
                reply = response.choices[0].message.content
            except Exception as ai_err:
                print(f"OpenAI Chat error, falling back to mock: {ai_err}")

        if not reply:
            # Mock Chatbot responses based on keywords
            msg_lower = message.lower()
            if 'how' in msg_lower or 'help' in msg_lower:
                reply = "I'm here to help! Could you provide more details about the specific coding problem you're working on?"
            elif 'error' in msg_lower or 'debug' in msg_lower:
                reply = "Debugging can be tricky. Have you checked your console for specific error lines? Feel free to paste your code here!"
            elif 'thank' in msg_lower:
                reply = "You're very welcome! Keep up the great work learning to code."
            else:
                reply = "That's an interesting topic! As your AI mentor, I suggest breaking down the problem into smaller steps. What part is most confusing right now?"

        return jsonify({'success': True, 'reply': reply})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/translate', methods=['POST'])
def translate_text():
    try:
        data = request.json
        text = data.get('text', '')
        target_lang_code = data.get('target_lang', 'en-US')
        
        # Deep translator uses short codes like 'ta', 'hi', 'ml'
        mapped_lang = target_lang_code.split('-')[0]
        
        if mapped_lang != 'en':
            translator = GoogleTranslator(source='auto', target=mapped_lang)
            translated_text = translator.translate(text)
        else:
            translated_text = text
            
        return jsonify({'success': True, 'translated_text': translated_text})
    except Exception as e:
        print(f"Translation Error in /api/translate: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/api/openai/tts', methods=['POST'])
def openai_tts():
    try:
        if not client or not os.getenv("OPENAI_API_KEY"):
            return jsonify({'success': False, 'message': 'OpenAI API key is missing'}), 503

        data = request.json
        text = data.get('text', '')
        # OpenAI TTS doesn't strictly take language codes, but we can pass text in that language.
        # It auto-detects the language of the input text.
        
        if not text:
            return jsonify({'success': False, 'message': 'No text provided'}), 400

        # Create a temporary file path for the audio
        audio_filename = f"tts_{secrets.token_hex(4)}.mp3"
        audio_filepath = os.path.join(app.config['UPLOAD_FOLDER'], audio_filename)

        if client is None:
            return jsonify({'success': False, 'message': 'OpenAI client not configured'}), 500

        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy", # Options: alloy, echo, fable, onyx, nova, shimmer
            input=text
        )

        response.stream_to_file(audio_filepath)

        return send_file(audio_filepath, mimetype='audio/mpeg')

    except Exception as e:
        print(f"OpenAI TTS Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/assessment/update', methods=['POST'])
def update_assessment():
    data = request.json
    student_name = data.get('student_name')
    new_score = data.get('score')
    new_feedback = data.get('feedback')
    
    assessments = load_from_file('assessments.json')
    updated = False
    for a in assessments:
        if a['student_name'] == student_name:
            a['score'] = new_score
            a['ai_feedback'] = new_feedback
            updated = True
            break
            
    if updated:
        save_to_file('assessments.json', assessments)
        return jsonify({'success': True, 'message': 'Assessment updated'})
    return jsonify({'success': False, 'message': 'Student record not found'})

@app.route('/api/teacher/stats/<teacher_id>', methods=['GET'])
def get_teacher_stats(teacher_id):
    subject_filter = request.args.get('subject')
    standard_filter = request.args.get('standard')

    # Calculate stats from files
    notes = load_from_file('notes.json')
    videos = load_from_file('videos.json')
    live_classes = load_from_file('live_classes.json')
    assessments = load_from_file('assessments.json')
    
    teacher_notes = [n for n in notes if n.get('teacher_id') == teacher_id]
    teacher_videos = [v for v in videos if v.get('teacher_id') == teacher_id]
    teacher_live = [lc for lc in live_classes if lc.get('teacher_id') == teacher_id]
    
    # Apply context filter if present
    if subject_filter:
        teacher_notes = [n for n in teacher_notes if n.get('subject') == subject_filter]
        teacher_videos = [v for v in teacher_videos if v.get('subject') == subject_filter]
        teacher_live = [lc for lc in teacher_live if lc.get('subject') == subject_filter]
        assessments = [a for a in assessments if a.get('subject') == subject_filter]

    if standard_filter:
        teacher_notes = [n for n in teacher_notes if str(n.get('standard')) == str(standard_filter)]
        teacher_videos = [v for v in teacher_videos if str(v.get('standard')) == str(standard_filter)]
        teacher_live = [lc for lc in teacher_live if str(lc.get('standard')) == str(standard_filter)]
        assessments = [a for a in assessments if str(a.get('standard')) == str(standard_filter)]
    
    # Subject-wise breakdown
    subject_stats = {}
    for n in teacher_notes:
        sub = n.get('subject', 'General')
        subject_stats[sub] = subject_stats.get(sub, {'notes': 0, 'videos': 0, 'live': 0})
        subject_stats[sub]['notes'] += 1
        
    for v in teacher_videos:
        sub = v.get('subject', 'General')
        if sub not in subject_stats: subject_stats[sub] = {'notes': 0, 'videos': 0, 'live': 0}
        subject_stats[sub]['videos'] += 1
        
    # Calculate total unique participations
    total_participants = 0
    unique_students = set()
    for lc in teacher_live:
        participants = lc.get('participants', [])
        total_participants += len(participants)
        for p in participants:
            if isinstance(p, dict):
                unique_students.add(p.get('user_id'))
            else:
                unique_students.add(str(p))
            
    # Get all student assessments related to this teacher (or general for now)
    return jsonify({
        'success': True,
        'total_notes': len(teacher_notes),
        'total_videos': len(teacher_videos),
        'total_live': len(teacher_live),
        'total_participations': total_participants,
        'unique_students': len(unique_students),
        'subject_stats': subject_stats,
        'student_assessments': assessments,
        'notes': teacher_notes,
        'videos': teacher_videos,
        'live_classes': teacher_live
    })

@app.route('/api/profile/<role>/<user_id>', methods=['GET'])
def get_profile(role, user_id):
    try:
        profiles = load_from_file('profiles.json')
        profile_match = [p for p in profiles if p.get('id') == user_id]
        
        if profile_match:
            return jsonify({'success': True, 'profile': profile_match[0]})
        
        # Merge basic info from users if not in profiles yet
        users = load_from_file('users.json')
        user_info = next((u for u in users if u.get('id') == user_id), None)
        
        return jsonify({'success': True, 'profile': {
            'id': user_id,
            'name': user_info.get('name') if user_info else 'New User',
            'headline': 'Add a catchy headline',
            'about': 'Tell us about yourself...',
            'skills': '',
            'location': 'Earth'
        }})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/profile/update', methods=['POST'])
def update_profile():
    try:
        data = request.json
        user_id = data.get('id')
        
        profiles = load_from_file('profiles.json')
        
        # Remove existing if present
        profiles = [p for p in profiles if p.get('id') != user_id]
        
        # Append new/updated items
        profiles.append(data)
        
        # Save back to JSON
        save_to_file('profiles.json', profiles)
            
        return jsonify({'success': True, 'message': 'Profile updated'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    print("Starting SkillNest Backend Server...")
    print("Server running on http://localhost:5000")
    
    # Initialize
    cleanup_orphaned_files()
    
    # Run without eventlet to avoid SSL issues
    socketio.run(app, host='0.0.0.0', port=5000, debug=False, allow_unsafe_werkzeug=True)
