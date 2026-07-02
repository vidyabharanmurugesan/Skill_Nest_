import os
import sys
import socket
import subprocess
import time

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def kill_process_on_port(port):
    try:
        # Check netstat for listening process on the target port
        cmd = f"netstat -ano | findstr :{port}"
        out = subprocess.check_output(cmd, shell=True).decode('utf-8', errors='ignore')
        
        terminated_any = False
        for line in out.strip().split('\n'):
            parts = line.split()
            if len(parts) >= 5 and 'LISTENING' in parts[1:4]:  # Ensure it matches connection state
                pid = parts[-1]
                # Avoid terminating our own process if running
                if int(pid) != os.getpid():
                    print(f"[Diagnose] Port {port} is occupied by process PID {pid}. Terminating process to start server...")
                    subprocess.run(f"taskkill /F /PID {pid}", shell=True)
                    terminated_any = True
        
        if terminated_any:
            time.sleep(1)  # Give OS time to reclaim socket
            return True
    except Exception as e:
        print(f"[Error] Failed to terminate blocking process on port {port}: {e}")
    return False

if __name__ == '__main__':
    port = 5000
    print("[SkillNest] Running backend pre-start diagnostics...")
    
    if is_port_in_use(port):
        print(f"[Warning] Port {port} is currently in use.")
        if kill_process_on_port(port):
            print("[Diagnose] Port cleared successfully.")
        else:
            print("[Warning] Could not clear port. Server start might fail if the address is locked.")
    else:
        print(f"[Diagnose] Port {port} is free and ready.")

    print(f"\n[SkillNest] Starting backend server (app.py) on port {port}...")
    try:
        # Start app.py
        app_path = os.path.join(os.path.dirname(__file__), "app.py")
        subprocess.run([sys.executable, app_path])
    except KeyboardInterrupt:
        print("\n[SkillNest] Backend server stopped.")
