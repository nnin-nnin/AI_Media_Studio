# AI Media Studio

An interactive AI education platform for elementary students, featuring Face Swap, Video Generation, and Voice Cloning.

## Technology Stack

- **Frontend**: Vanilla JavaScript (ES Modules), managed by **Vite**.
- **Backend**: Node.js (Express).
- **Database**: **Prisma ORM** (SQLite for Dev, Postgres Compatible for Prod).
- **Storage**: Abstracted File Storage (Local for Dev, adaptable to S3).
- **AI Integration**: Volcengine Ark, DashScope, Tencent COS.

## Project Structure

```
.
├── dist/                 # Production build artifacts (created by npm run build)
├── prisma/              # Database schema and migrations
├── scripts/             # Admin utilities (e.g., create_user.js)
├── src/
│   ├── renderer/        # Frontend (Vite Root)
│   │   ├── components/  # Web Components & UI Logic
│   │   ├── pages/       # Page-specific Scripts
│   │   ├── utils/       # Shared Utilities (API, i18n)
│   │   └── index.html   # Entry Point
│   └── server/          # Backend (Express)
│       ├── ai/          # AI Service Integrations
│       ├── auth/        # Authentication Logic
│       ├── db/          # Database Clients
│       ├── storage/     # File Storage Providers
│       └── server.js    # Entry Point
└── vite.config.js       # Frontend Build Configuration
```

## Setup & Running

### 1. Prerequisites
- Node.js >= 20
- npm >= 10
- uv (for Python Environment)

### 2. Installation (One-Click)

We provide a script to check environment requirements, install all dependencies (Node + Python), initialize the database, and build the frontend.

```bash
./scripts/deploy.sh
```

### 3. Manual Installation (Alternative)
```bash
# Install Node dependencies
npm install

# Install Python dependencies (Faster with uv)
uv sync

# Initialize Database (SQLite)
npx prisma generate
```

### 3. Configuration
Create a `.env` file in the root directory:
```env
PORT=3000
NODE_ENV=development
DEBUG=true
JWT_SECRET=your-secure-secret  # Optional in Dev, Required in Prod
DATABASE_URL="file:../data/ai_course.sqlite"

# AI Service Keys
ARK_API_KEY=...
DASHSCOPE_API_KEY=...
TENCENT_SECRET_ID=...
TENCENT_SECRET_KEY=...
TENCENT_COS_BUCKET=...
TENCENT_COS_REGION=...
```

### 4. Create User
Since auto-creation is disabled for security, manually create your first user:
```bash
node scripts/create_user.js student mypassword123
```

### 5. Run Development Server
Starts both the Backend (Express:3000) and Frontend (Vite:5173).
```bash
npm run dev
```
Access the app at: `http://localhost:5173`

### 6. Production Build
```bash
# Build Frontend
npm run build

# Start Production Server (Serves static files from dist/)
npm start
```

## Architecture Notes

- **Authentication**: JWT-based. Protected routes require `Authorization: Bearer <token>`.
- **Database**: Uses Prisma Client. Data is stored in `data/ai_course.sqlite`.
- **Storage**: Uploads are stored in `data/uploads`. Interface is defined in `src/server/storage/`.
- **AI**: Heavy AI tasks may spawn Python subprocesses (e.g., `src/server/ai/voice-clone.py`).

## License
MIT