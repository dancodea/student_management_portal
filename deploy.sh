#!/usr/bin/env bash
# ==============================================================================
# FUTMINNA Unified School Portal - Automated AWS EC2 Deployment Script
# Supports: Amazon Linux 2023, Amazon Linux 2, Ubuntu 22.04 / 24.04 LTS
# ==============================================================================
set -e

echo "🚀 Starting AWS EC2 Deployment for Unified School Portal..."

# 1. Update OS Packages & Install Node.js, Git, Nginx, PM2
if command -v dnf &> /dev/null; then
    echo "📦 Detected Amazon Linux (dnf). Installing dependencies..."
    sudo dnf update -y
    sudo dnf install -y git nginx
    # Install Node.js 20 LTS via NodeSource
    sudo dnf install -y nodejs npm
elif command -v apt &> /dev/null; then
    echo "📦 Detected Ubuntu/Debian (apt). Installing dependencies..."
    sudo apt update -y
    sudo apt install -y git nginx curl
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install PM2 globally
sudo npm install -g pm2

# 2. Setup Application Directory
APP_DIR="/var/www/unified-school-portal"
echo "📂 Setting up app directory at $APP_DIR..."
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

# 3. Copy application files into web directory
cp -r ./* $APP_DIR/ || true
cd $APP_DIR

# 4. Install Project Dependencies & Build Next.js
echo "🔨 Installing application dependencies..."
npm install

echo "🗄️ Running Prisma Database Migrations against RDS..."
# Ensure DATABASE_URL is set in .env with your RDS MySQL endpoint
npx prisma generate
npx prisma db push
npm run prisma:seed

echo "🏗️ Building Next.js production bundle..."
npm run build

# 5. Configure PM2 Process Manager
echo "⚙️ Starting Next.js server with PM2..."
pm2 delete unified-school-portal 2>/dev/null || true
pm2 start npm --name "unified-school-portal" -- start
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME || true

# 6. Configure Nginx Reverse Proxy
echo "🌐 Configuring Nginx reverse proxy..."
if [ -d "/etc/nginx/conf.d" ]; then
    sudo cp nginx.conf /etc/nginx/conf.d/unified-school-portal.conf
elif [ -d "/etc/nginx/sites-available" ]; then
    sudo cp nginx.conf /etc/nginx/sites-available/unified-school-portal
    sudo ln -sf /etc/nginx/sites-available/unified-school-portal /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
fi

sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "=============================================================================="
echo "🎉 Deployment Complete!"
echo "Your application is now live on Port 80 on your EC2 Public IP / DNS."
echo "=============================================================================="
