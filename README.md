# ⚡ SIG — Code to Unlock

A high-stakes, real-time multiplayer coding game built for rapid hackathon deployment. 

## 🚀 How to Run

### 1. Backend (Spring Boot)
- **Requirements**: JDK 17+ (JDK 23 recommended)
- **Commands**:
  ```bash
  cd backend
  ./gradlew bootRun
  ```
- **Port**: 8080 (H2 Console at `/h2-console`)
- **Credentials**: `admin` / `admin123`

### 2. Frontend (React + Vite)
- **Requirements**: Node.js 18+
- **Commands**:
  ```bash
  cd frontend
  npm install
  npm run dev
  ```
- **Port**: 5173

---

## 🎮 Game Flow

1. **Organizer Login**: Log in at `/` using the Organizer tab (`admin` / `admin123`).
2. **Create Room**: Click "Create Room" to generate a unique 6-digit Room ID.
3. **Participants Join**: Teams enter their Team ID and the Room ID on the Participant tab.
4. **Waiting Room**: Teams wait for the organizer to start. High-energy SIG branding and "Scan to Join" QR codes are displayed.
5. **Start Game**: The organizer clicks "Start Game." All teams receive the first riddle simultaneously.
6. **Solve Riddles**: 
   - **Stage 1**: Sum an array of numbers. Result digit: `1200`.
   - **Stage 2**: Reverse a string. Result digit: `34`.
7. **Technical Evaluation**: Code is compiled and tested on the backend in real-time.
8. **Final Code**: Collect values `1200` and `34`. Use the equation `X + Y` to get the locker code `1234`.
9. **Winner**: The first team to verify their code and unlock the physical locker wins!

---

## 🧱 Tech Stack
- **Frontend**: React 19, Vite, Monaco Editor, STOMP.js (WebSockets), Vanilla CSS (Dark Navy/Blue palette).
- **Backend**: Spring Boot 3.4.4, Java JDK 23, Spring WebSockets, Spring Data JPA, H2 In-Memory Database.
- **Dynamic Eval**: `javax.tools.JavaCompiler` for in-memory code compilation and execution.

---

## 🎨 Design System
- **Palette**: Dark Navy (`#0a1628`), SIG Blue (`#3b82f6`), Racing Yellow (`#ffe900`), Accent Red (`#e8112d`).
- **Aesthetics**: Glassmorphism, animated grid backgrounds, sleek micro-animations, and JetBrains Mono for a hackathon feel.

---

Built with ⚡ by Antigravity
