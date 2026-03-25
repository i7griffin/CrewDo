# CrewDo Backend API

Clan-based habit tracking system — Node.js + Express + MongoDB + Socket.IO

---

## Quick Start

```bash
cp .env.example .env        # Fill in your secrets
npm install
npm run dev                 # Starts with nodemon on port 5000
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default 5000) |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | e.g. `7d` |
| `JWT_REFRESH_SECRET` | Refresh token secret |
| `JWT_REFRESH_EXPIRES_IN` | e.g. `30d` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `FRONTEND_URL` | CORS allowed origin |
| `STREAK_RESET_HOUR` | UTC hour for daily cron (0 = midnight) |
| `STREAK_RESET_MINUTE` | UTC minute for daily cron |

---

## API Reference

All protected routes require: `Authorization: Bearer <accessToken>`

### Auth

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | ✗ | Register new user |
| POST | `/api/auth/login` | ✗ | Login |
| POST | `/api/auth/refresh` | ✗ | Refresh access token |
| POST | `/api/auth/logout` | ✓ | Logout (clears refresh token) |
| GET  | `/api/auth/me` | ✓ | Get current user |

**Register body:**
```json
{ "username": "john", "email": "john@example.com", "password": "secret123" }
```

**Login body:**
```json
{ "email": "john@example.com", "password": "secret123" }
```

---

### Clans

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/clans` | ✓ | Create a clan |
| POST | `/api/clans/join` | ✓ | Join via invite code |
| DELETE | `/api/clans/leave` | ✓ | Leave current clan |
| GET | `/api/clans/my` | ✓ | Get your clan details |
| GET | `/api/clans/leaderboard` | ✓ | Top clans by streak |
| GET | `/api/clans/search?q=&category=` | ✓ | Search public clans |
| GET | `/api/clans/:id` | ✓ | Get clan by ID |
| GET | `/api/clans/:id/streak-history` | ✓ | Streak history log |
| PATCH | `/api/clans/:id/task` | ✓ (leader) | Update daily task |
| PATCH | `/api/clans/:id/transfer` | ✓ (leader) | Transfer leadership |

**Create clan body:**
```json
{
  "name": "Morning Runners",
  "description": "Run every morning at 6am",
  "dailyTask": {
    "title": "Run 5km",
    "description": "Screenshot your running app",
    "proofRequired": true,
    "category": "fitness"
  },
  "maxMembers": 8,
  "isPrivate": false
}
```

---

### Proofs

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/proofs/submit` | ✓ | Submit proof (multipart/form-data) |
| GET | `/api/proofs/today` | ✓ | Today's proof feed for your clan |
| GET | `/api/proofs/my` | ✓ | Your proof history |
| GET | `/api/proofs/pending` | ✓ (leader) | Pending proofs to review |
| GET | `/api/proofs/clan/:clanId` | ✓ | All proofs for a clan |
| POST | `/api/proofs/:id/approve` | ✓ (leader) | Approve a proof |
| POST | `/api/proofs/:id/reject` | ✓ (leader) | Reject a proof |
| DELETE | `/api/proofs/:id` | ✓ | Delete own pending proof |

**Submit proof:** `multipart/form-data`
- `proof` — image (jpg/png/webp) or video (mp4/mov), max 50MB
- `caption` — optional text

**Reject body:** `{ "reason": "Blurry image" }`

---

### Users

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/users/leaderboard` | ✓ | Top users by points |
| GET | `/api/users/:id` | ✓ | Public user profile |
| PATCH | `/api/users/profile` | ✓ | Update own profile |

---

### Test Routes (dev only)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/test/health` | Health check |
| POST | `/api/test/seed` | Seed test data |
| DELETE | `/api/test/wipe` | Wipe all data |
| POST | `/api/test/clans/:id/break-streak` | Force break streak |
| POST | `/api/test/clans/:id/maintain-streak` | Force maintain streak |

---

## WebSocket Events

Connect with: `io('http://localhost:5000', { auth: { token: '<accessToken>' } })`

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_clan` | `clanId` | Join a clan room |
| `leave_clan` | `clanId` | Leave a clan room |
| `activity:started` | `{}` | Broadcast you started the task |
| `ping` | — | Heartbeat |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `notification` | `{ type, title, message, ... }` | Push notification |
| `member_status_update` | `{ userId, status, username }` | A member's status changed |
| `streak_updated` | `{ clanId, streak, event }` | Streak changed (maintained/broken) |
| `proof_reviewed` | `{ proofId, status, reason }` | Your proof was reviewed |
| `peer_activity` | `{ userId, username, type }` | Peer started their task |
| `pong` | `{ time }` | Heartbeat response |

### Notification types
- `member_completed` — a teammate finished
- `streak_maintained` — full clan completed
- `streak_broken` — someone missed
- `proof_reviewed` — your proof approved/rejected
- `task_reminder` — reminder to submit
- `new_proof_submitted` — (leader) new proof waiting

---

## System Flow

```
User submits proof (image/video)
        ↓
Proof stored in Cloudinary
        ↓
Leader notified via Socket.IO
        ↓
Leader approves / rejects
        ↓
  [Approved]
        ↓
Member status → 'approved'
        ↓
Streak Engine checks: all members approved?
   YES → Streak +1, points awarded, clan notified
   NO  → Cron at midnight UTC evaluates remaining
        ↓
  [Rejected]
        ↓
Member can resubmit
```

---

## Streak Logic

- A clan streak increments only when **every** member's proof is approved on the same day
- Daily cron runs at midnight UTC — any clan where not all members completed gets streak **reset to 0**
- Streak history is logged in `StreakLog` for analytics
- Points: +10 per day completed, +20 bonus on every 7th day (weekly milestone)
- Badges awarded at 100, 500, 1000 total points

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB + Mongoose
- **Auth:** JWT (access + refresh tokens)
- **Real-time:** Socket.IO
- **File Storage:** Cloudinary
- **Scheduler:** node-cron
- **Logging:** Winston
- **Validation:** express-validator
