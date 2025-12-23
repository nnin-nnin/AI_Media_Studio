#!/bin/bash

# Deployment Script for AI Media Studio
# Usage: ./scripts/deploy.sh

set -e # Exit on error

echo "========================================"
echo "🚀 Starting AI Media Studio Deployment"
echo "========================================"

# 1. Check Requirements
echo "[1/5] Checking Environment..."
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed."
    exit 1
fi

if ! command -v uv &> /dev/null; then
    echo "❌ Error: uv is not installed. Please install it (curl -LsSf https://astral.sh/uv/install.sh | sh)"
    exit 1
fi

# Check .env
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Creating from example..."
    # Create simple default .env
    cat <<EOF > .env
PORT=3000
NODE_ENV=production
JWT_SECRET=CHANGE_THIS_IN_PRODUCTION_$(date +%s)
DATABASE_URL="file:../data/ai_course.sqlite"
EOF
    echo "✅ Created .env. PLEASE EDIT IT with your API keys!"
else
    echo "✅ .env found"
fi

# 2. Install Node Dependencies
echo "[2/5] Installing Node.js Dependencies..."
npm ci --silent
echo "✅ Node dependencies installed."

# 3. Install Python Dependencies
echo "[3/5] Installing Python Dependencies..."
uv sync
echo "✅ Python dependencies installed."

# 4. Initialize Database
echo "[4/5] Initializing Database..."
# Ensure data dir exists
mkdir -p data/uploads
npx prisma generate
npx prisma db push --accept-data-loss
echo "✅ Database ready."

# 5. Build Frontend
echo "[5/5] Building Frontend..."
npm run build
echo "✅ Frontend built to /dist"

echo "========================================"
echo "🎉 Deployment Complete!"
echo "========================================"
echo "To start the server, run:"
echo "  npm start"
echo ""
echo "Don't forget to create a user if you haven't yet:"
echo "  node scripts/create_user.js <username> <password>"
