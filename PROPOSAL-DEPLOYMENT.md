# PROPOSAL DEPLOYMENT
## Sistem Manajemen HRGA (Human Resources & General Affairs)

---

## 1. RINGKASAN EKSEKUTIF

### 1.1 Overview Project
Sistem Manajemen HRGA adalah aplikasi web full-stack yang dirancang untuk mengelola perjanjian, vendor, dan administrasi departemen HRGA. Sistem ini dibangun dengan arsitektur modern menggunakan React.js untuk frontend dan Node.js/Express untuk backend.

### 1.2 Tujuan Deployment
- Menyediakan aplikasi HRGA yang dapat diakses 24/7
- Meningkatkan efisiensi operasional melalui sistem terpusat
- Memastikan keamanan dan ketersediaan data
- Mempermudah kolaborasi antar departemen

---

## 2. SPESIFIKASI TEKNIS

### 2.1 Arsitektur Aplikasi
```
┌─────────────────┐
│   FRONTEND      │  React.js + Tailwind CSS
│   (Port 3000)   │  
└────────┬────────┘
         │ HTTP/HTTPS
         │
┌────────▼────────┐
│   BACKEND       │  Node.js + Express
│   (Port 5000)   │  REST API
└────────┬────────┘
         │
┌────────▼────────┐
│   DATABASE      │  MongoDB
│   (Port 27017)  │  
└─────────────────┘
```

### 2.2 Technology Stack

#### Frontend
- **Framework**: React.js 19.0.0
- **Styling**: Tailwind CSS 3.4.17
- **UI Components**: Radix UI
- **Form Management**: React Hook Form 7.56.2
- **HTTP Client**: Axios 1.8.4
- **Routing**: React Router DOM 7.5.1
- **State Management**: React Context API
- **Charts**: Recharts 3.6.0

#### Backend
- **Runtime**: Node.js (v16+ recommended)
- **Framework**: Express.js 4.18.2
- **Database**: MongoDB 8.0.3 (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: 
  - Helmet.js (security headers)
  - CORS
  - Express Rate Limiter
  - Express Mongo Sanitize
- **File Upload**: Multer
- **Email**: Nodemailer 8.0.5
- **Scheduling**: Node-cron 4.2.1

### 2.3 Fitur Utama Aplikasi
1. **Manajemen Pengguna & Authentication**
   - Login/Logout dengan JWT
   - Role-based access (Admin, User, Department Head)
   - Password hashing dengan bcrypt

2. **Manajemen Agreement/Perjanjian**
   - CRUD perjanjian
   - Upload dokumen (PDF)
   - Tracking status dan expiry date
   - Notifikasi otomatis

3. **Manajemen Vendor**
   - Database vendor
   - Contact management
   - Agreement history

4. **Dashboard & Analytics**
   - Statistik real-time
   - Charts dan visualisasi data
   - Export data ke Excel

5. **Notifikasi & Email**
   - Automated email notifications
   - Expiry reminders
   - Status updates

6. **Department Settings**
   - Konfigurasi multi-department
   - Custom workflows

---

## 3. SPESIFIKASI SERVER

### 3.1 Minimum Requirements

#### Option 1: VPS/Cloud Server (Recommended)
- **CPU**: 2 vCPU cores
- **RAM**: 8 GB
- **Storage**: 50 GB SSD
- **OS**: Ubuntu 22.04 LTS / CentOS 8+
- **Network**: 100 Mbps
- **Bandwidth**: Unlimited / 1 TB/month

**Provider Options:**
- DigitalOcean Droplet ($24/month)
- AWS EC2 t3.medium
- Google Cloud Compute Engine e2-medium
- Azure Virtual Machine B2s
- Vultr High Frequency
- Alibaba Cloud ECS

#### Option 2: Shared Hosting (Budget)
- **Requirements**:
  - Node.js support (v16+)
  - MongoDB hosting or connection
  - SSL certificate included
  - SSH access

**Provider Options:**
- Heroku (Dyno + MongoDB Atlas)
- Railway.app
- Render.com
- Fly.io

### 3.2 Production Requirements
- **CPU**: 4 vCPU cores
- **RAM**: 8 GB
- **Storage**: 100 GB SSD
- **Backup**: Daily automated backups
- **CDN**: CloudFlare atau sejenisnya
- **Load Balancer**: (untuk scaling horizontal)

---

## 4. INFRASTRUKTUR & DEPLOYMENT

### 4.1 Deployment Architecture

#### Option A: Single Server (Small Scale)
```
Server (Ubuntu 22.04)
├── Nginx (Reverse Proxy + Static Files)
├── PM2 (Process Manager untuk Node.js)
├── MongoDB (Database)
├── Certbot (SSL/TLS)
└── Backend + Frontend (compiled)
```

#### Option B: Distributed (Medium-Large Scale)
```
┌────────────────┐
│   CloudFlare   │ (CDN + DDoS Protection)
└───────┬────────┘
        │
┌───────▼────────┐
│  Load Balancer │ (Nginx/HAProxy)
└───────┬────────┘
        │
        ├─► Frontend Server (Nginx)
        │   └── React build files
        │
        ├─► Backend Server 1 (PM2)
        ├─► Backend Server 2 (PM2)
        │
        └─► Database Server
            └── MongoDB Replica Set
```

### 4.2 Software Requirements

#### Server Software
```bash
- Node.js v18.x atau v20.x LTS
- npm atau yarn (package manager)
- MongoDB v6.0+ atau MongoDB Atlas
- Nginx v1.18+
- PM2 (production process manager)
- Git (version control)
- Certbot (Let's Encrypt SSL)
```

### 4.3 Domain & SSL
- **Domain**: hrga.namaPerusahaan.com
- **SSL Certificate**: Let's Encrypt (Free) atau Commercial SSL
- **DNS**: CloudFlare (recommended untuk CDN & protection)

---

## 5. LANGKAH-LANGKAH DEPLOYMENT

### 5.1 Persiapan Server

#### Step 1: Initial Server Setup
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl git build-essential

# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update
sudo apt install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Install PM2
sudo npm install -g pm2
```

### 5.2 Deploy Backend

```bash
# Clone repository
cd /var/www
sudo git clone [REPOSITORY_URL] hrga

# Setup Backend
cd /var/www/hrga/app/backend
npm install --production

# Create production .env
sudo nano .env
```

**Production .env Configuration:**
```env
# Database
MONGO_URL=mongodb://localhost:27017
DB_NAME=hrga_production

# CORS
CORS_ORIGINS=https://hrga.yourdomain.com

# JWT Secret (generate strong secret)
JWT_SECRET=[GENERATE_STRONG_SECRET_KEY]

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=[your-email@gmail.com]
SMTP_PASS=[your-app-password]

# Server
PORT=5000
NODE_ENV=production
```

```bash
# Start backend dengan PM2
pm2 start src/server.js --name hrga-backend
pm2 save
pm2 startup
```

### 5.3 Deploy Frontend

```bash
# Build Frontend
cd /var/www/hrga/app/frontend

# Update API URL (create .env.production)
echo "REACT_APP_API_URL=https://hrga.yourdomain.com/api" > .env.production

# Build production
npm run build

# Move build to Nginx directory
sudo cp -r build /var/www/hrga-frontend
```

### 5.4 Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/hrga
```

**Nginx Configuration:**
```nginx
# Backend API
server {
    listen 80;
    server_name api.hrga.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;
}

# Frontend
server {
    listen 80;
    server_name hrga.yourdomain.com;

    root /var/www/hrga-frontend;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    client_max_body_size 10M;
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hrga /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 5.5 Setup SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d hrga.yourdomain.com -d api.hrga.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### 5.6 Setup Firewall

```bash
# UFW Firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## 6. KONFIGURASI DATABASE

### 6.1 MongoDB Security

```bash
# Connect to MongoDB
mongosh

# Create admin user
use admin
db.createUser({
  user: "hrgaAdmin",
  pwd: "[STRONG_PASSWORD]",
  roles: [{ role: "userAdminAnyDatabase", db: "admin" }]
})

# Create application user
use hrga_production
db.createUser({
  user: "hrgaApp",
  pwd: "[STRONG_PASSWORD]",
  roles: [{ role: "readWrite", db: "hrga_production" }]
})
```

### 6.2 Seed Initial Data

```bash
cd /var/www/hrga/app/backend
node src/utils/seed.js
```

---

## 7. MONITORING & MAINTENANCE

### 7.1 Monitoring Setup

#### PM2 Monitoring
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs hrga-backend

# Check status
pm2 status
```

#### System Monitoring Tools
```bash
# Install monitoring tools
sudo apt install -y htop iotop nethogs

# Install log monitoring
sudo npm install -g pm2-logrotate
pm2 install pm2-logrotate
```

### 7.2 Backup Strategy

#### Database Backup Script
```bash
sudo nano /usr/local/bin/backup-hrga-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="hrga_production"

mkdir -p $BACKUP_DIR

# Create backup
mongodump --db $DB_NAME --out $BACKUP_DIR/$TIMESTAMP

# Compress backup
tar -czf $BACKUP_DIR/hrga_$TIMESTAMP.tar.gz -C $BACKUP_DIR $TIMESTAMP
rm -rf $BACKUP_DIR/$TIMESTAMP

# Keep only last 7 days
find $BACKUP_DIR -name "hrga_*.tar.gz" -mtime +7 -delete

echo "Backup completed: hrga_$TIMESTAMP.tar.gz"
```

```bash
# Make executable
sudo chmod +x /usr/local/bin/backup-hrga-db.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-hrga-db.sh
```

### 7.3 Log Management

```bash
# Configure PM2 log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
```

---

## 8. KEAMANAN (SECURITY)

### 8.1 Security Checklist

- [x] **Environment Variables**: Semua credential di .env file (tidak di-commit ke Git)
- [x] **JWT Secret**: Gunakan secret key yang kuat dan unik
- [x] **Password Hashing**: Implementasi bcrypt sudah ada
- [x] **CORS**: Restrict origins di production
- [x] **Rate Limiting**: Sudah diimplementasi di backend
- [x] **Helmet.js**: Security headers sudah diterapkan
- [x] **MongoDB Sanitization**: Protection dari NoSQL injection
- [x] **SSL/HTTPS**: Wajib untuk production
- [x] **Firewall**: UFW atau iptables
- [x] **File Upload**: Validasi file type dan size
- [ ] **DDoS Protection**: CloudFlare atau sejenisnya
- [ ] **Monitoring**: Setup alerting untuk anomali

### 8.2 Regular Security Updates

```bash
# Update system packages (weekly)
sudo apt update && sudo apt upgrade -y

# Update npm packages (monthly, with testing)
cd /var/www/hrga/app/backend
npm outdated
npm update

# Audit vulnerabilities
npm audit
npm audit fix
```

---

## 9. BIAYA ESTIMASI

### 9.1 Option 1: Cloud VPS (Self-Managed)

| Item | Provider | Spesifikasi | Biaya/Bulan |
|------|----------|-------------|-------------|
| VPS Server | DigitalOcean | 2 vCPU, 4GB RAM, 50GB SSD | $24 |
| Domain | Namecheap | .com domain | $1.17 |
| SSL Certificate | Let's Encrypt | Free | $0 |
| Backup Storage | DigitalOcean | 50GB Spaces | $5 |
| CloudFlare CDN | CloudFlare | Free Plan | $0 |
| **Total** | | | **~$30/bulan** |

### 9.2 Option 2: Managed Platform (PaaS)

| Item | Provider | Spesifikasi | Biaya/Bulan |
|------|----------|-------------|-------------|
| Backend Hosting | Render.com | Standard Plan | $25 |
| Database | MongoDB Atlas | M10 Cluster | $57 |
| Frontend CDN | Vercel | Pro Plan | $20 |
| **Total** | | | **~$102/bulan** |

### 9.3 Option 3: On-Premise (Existing Infrastructure)

| Item | Keterangan | Biaya |
|------|------------|-------|
| Server Hardware | Menggunakan server existing | $0 |
| Internet | Dedicated IP & bandwidth | Varies |
| Maintenance | IT Staff time | Internal |
| Electricity | 24/7 operation | Varies |
| **Total** | | **Internal Cost** |

### 9.4 Biaya Setup Awal (One-time)

| Item | Biaya |
|------|-------|
| Initial Setup & Configuration | $100-200 |
| Testing & QA | $50-100 |
| Documentation & Training | $50-100 |
| **Total Setup** | **$200-400** |

---

## 10. TIMELINE DEPLOYMENT

### Phase 1: Persiapan (1-2 hari)
- [ ] Pembelian/setup server
- [ ] Setup domain dan DNS
- [ ] Persiapan credentials (email, database, JWT secret)

### Phase 2: Installation (1 hari)
- [ ] Install software dependencies
- [ ] Setup database
- [ ] Configure server security

### Phase 3: Deployment (1 hari)
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Configure Nginx
- [ ] Setup SSL certificate

### Phase 4: Testing (1-2 hari)
- [ ] Functional testing
- [ ] Security testing
- [ ] Performance testing
- [ ] Load testing

### Phase 5: Launch (0.5 hari)
- [ ] Database seeding
- [ ] Final checks
- [ ] Go live
- [ ] Monitoring setup

**Total Estimasi: 4-6 hari kerja**

---

## 11. DISASTER RECOVERY PLAN

### 11.1 Backup Strategy
- **Database**: Daily automated backup (retention 30 days)
- **Files**: Weekly backup of uploaded files
- **Code**: Version control dengan Git
- **Configuration**: Backup file konfigurasi

### 11.2 Recovery Procedures

#### Database Recovery
```bash
# Restore from backup
mongorestore --db hrga_production /var/backups/mongodb/[TIMESTAMP]/hrga_production
```

#### Application Recovery
```bash
# Rollback to previous version
cd /var/www/hrga
git log --oneline
git checkout [COMMIT_HASH]
pm2 restart hrga-backend
```

### 11.3 High Availability Options (Optional)
- MongoDB Replica Set (3+ nodes)
- Multiple backend instances dengan load balancer
- Database failover automation
- Geographic redundancy

---

## 12. SUPPORT & MAINTENANCE

### 12.1 Maintenance Schedule

**Daily:**
- Monitor system health
- Check error logs
- Review security alerts

**Weekly:**
- Review performance metrics
- Check disk usage
- System updates

**Monthly:**
- Dependency updates
- Security audit
- Backup verification
- Performance optimization

### 12.2 Support Contact

**Technical Support:**
- Email: support@yourcompany.com
- Phone: +62-xxx-xxxx-xxxx
- Response Time: 24 hours (business days)

**Emergency Support:**
- 24/7 Phone: +62-xxx-xxxx-xxxx
- Critical issues: <2 hour response

---

## 13. TERMS & CONDITIONS

### 13.1 Service Level Agreement (SLA)
- **Uptime Target**: 99.5% (monthly)
- **Planned Maintenance**: Max 4 hours/month
- **Backup Retention**: 30 days
- **Security Updates**: Within 48 hours of release

### 13.2 Limitations
- User concurrent connections: Based on server capacity
- File upload size: 10MB per file
- Storage: 50GB included (expandable)
- Email sending: 500 emails/day (SMTP limitation)

---

## 14. APPROVAL & SIGN-OFF

### 14.1 Project Stakeholders

**Prepared by:**
- Name: ______________________
- Position: Developer/DevOps Engineer
- Date: ______________________
- Signature: ______________________

**Reviewed by:**
- Name: ______________________
- Position: IT Manager
- Date: ______________________
- Signature: ______________________

**Approved by:**
- Name: ______________________
- Position: Director/CTO
- Date: ______________________
- Signature: ______________________

---

## 15. APPENDIX

### A. Useful Commands Reference

```bash
# PM2 Commands
pm2 start/stop/restart hrga-backend
pm2 logs hrga-backend
pm2 monit
pm2 save

# Nginx Commands
sudo nginx -t                    # Test configuration
sudo systemctl restart nginx     # Restart Nginx
sudo systemctl status nginx      # Check status

# MongoDB Commands
mongosh                          # Connect to MongoDB
use hrga_production             # Switch database
db.stats()                      # Database statistics

# System Commands
df -h                           # Disk usage
free -m                         # Memory usage
htop                            # Process monitor
```

### B. Troubleshooting Guide

**Problem: Backend tidak bisa connect ke database**
```bash
# Check MongoDB status
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
sudo systemctl restart mongod
```

**Problem: Frontend tidak bisa akses API**
```bash
# Check backend is running
pm2 status

# Check Nginx configuration
sudo nginx -t

# Check backend logs
pm2 logs hrga-backend
```

**Problem: High CPU/Memory usage**
```bash
# Check processes
htop

# Check PM2 processes
pm2 monit

# Restart application
pm2 restart hrga-backend
```

### C. Contact & Resources

**Project Repository:** [Git repository URL]

**Documentation:**
- Backend API: `/api/docs`
- User Manual: `/docs/user-manual.pdf`

**External Resources:**
- Node.js: https://nodejs.org
- MongoDB: https://www.mongodb.com
- Nginx: https://nginx.org
- PM2: https://pm2.keymetrics.io

---

## KESIMPULAN

Proposal deployment ini memberikan panduan lengkap untuk men-deploy aplikasi HRGA ke production server. Dengan mengikuti langkah-langkah yang telah diuraikan, sistem akan dapat beroperasi dengan aman, efisien, dan scalable.

Kami merekomendasikan **Option 1 (Cloud VPS)** untuk balance antara cost, flexibility, dan control. Deployment dapat diselesaikan dalam 4-6 hari kerja dengan biaya setup awal $200-400 dan operational cost ~$30/bulan.

Untuk informasi lebih lanjut atau diskusi teknis, silakan hubungi tim development.

---

**Document Version:** 1.0  
**Last Updated:** 3 Juni 2026  
**Status:** Draft for Review
