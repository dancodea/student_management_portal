# FUTMINNA Unified Student Registration & Result Management System

A decoupled 3-tier cloud application built with **Next.js 15 (App Router, TypeScript, Tailwind CSS)**, **Prisma ORM**, and **MySQL**, deployed on **Amazon Web Services (AWS)** using **EC2**, **RDS (MySQL)**, and **Amazon S3**.

This system unifies and expands upon:
- **`student-registration-system-groupb`**: Undergrad student biodata enrollment, matriculation numbering, and departmental structuring.
- **`school_result_management`**: Master gradebooks, WAEC/5-point CGPA grading scale, academic broadsheets, class rankings, and printable result slips.

---

## Architecture Topology

```
                       [ Internet / Student & Admin Browser ]
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   │                                           │
                   ▼ (Port 80 / 443 HTTP/S)                    ▼ (Direct Upload via S3 Presigned URL)
    ┌──────────────────────────────────────────────┐  ┌────────────────────────────────────┐
    │             AWS EC2 Instance                 │  │          Amazon S3 Bucket          │
    │         (Amazon Linux 2023 / Ubuntu)         │  │   (student-portal-passports-prod)  │
    │  ┌────────────────────────────────────────┐  │  │                                    │
    │  │   Nginx Reverse Proxy (Port 80/443)    │  │  │  - /passports/UG201042_photo.jpg   │
    │  └───────────────────┬────────────────────┘  │  │  - Strict CORS for EC2 domain      │
    │                      │ Proxy Pass (Port 3000)│  └─────────────────▲──────────────────┘
    │  ┌───────────────────▼────────────────────┐  │                    │
    │  │  Next.js Standalone Node App (PM2)     │──┼────────────────────┘ (AWS SDK / S3 Client)
    │  └───────────────────┬────────────────────┘  │
    └──────────────────────┼───────────────────────┘
                           │ Port 3306 (MySQL)
                           ▼
    ┌──────────────────────────────────────────────┐
    │             AWS RDS Instance                 │
    │          Managed MySQL Database              │
    │       (Security Group: EC2 Access Only)      │
    └──────────────────────────────────────────────┘
```

---

## Key Features

### 1. Student Portal (`/student/...`)
- **Self-Registration with S3 Passport Upload (`/register`):** Students enter their details (Name, Matric No, Department, Level, Email, Gender) and upload their passport photo directly to **Amazon S3** (with local fallback).
- **Dashboard (`/student/dashboard`):** Displays student biodata, passport photo, enrolled courses count, current semester GPA, and cumulative CGPA.
- **Course Registration (`/student/courses`):** Live credit load counter that validates minimum and maximum credit units (15–24 units), submit/lock registration, and view registration status.
- **My Results (`/student/results`):** Course-by-course breakdown of CA (40), Exam (60), Total (100), Letter Grade, Grade Points, and Weighted Points. Includes status check for Senate results publishing.
- **Printable A4 Result Slip (`/student/print-result`):** Official institutional letterhead with university crest, student passport photo, grades table, GPA/CGPA summary, verification watermark, and signature lines.

### 2. Admin Portal (`/admin/...`)
- **Zero-Overhead Curricula:** Faculties, departments, and course curricula across 100L–500L are pre-seeded in the database so administrators don't have to spend time manually setting up basic course structures.
- **Academic Session & Semester Control (`/admin/sessions`):** Set current active session, switch active semesters, toggle the course registration window (OPEN/CLOSED), and toggle result release (DRAFT/PUBLISHED).
- **Course Gradebook & Bulk CSV Upload (`/admin/scores`):** Inline Continuous Assessment (0–40) and Exam (0–60) grade entry. Includes bulk CSV import (`matric_no,ca_score,exam_score`) for offline Excel entry.
- **Class Broadsheet & Rankings (`/admin/broadsheet`):** Master horizontal matrix showing all students in a department alongside all course grades, semester GPAs, and competitive class rankings (1st, 2nd, etc.).
- **Enrolled Student Directory (`/admin/students`):** Search and filter all registered students by department and level, view passport photos, and inspect enrollment records.

---

## Grading Scale (5.0 CGPA Standard)

$$\text{GPA} = \frac{\sum (\text{Course Credit Units} \times \text{Grade Points})}{\sum \text{Course Credit Units}}$$

| Score Range | Grade | Grade Point | Academic Remark |
|:---:|:---:|:---:|:---|
| 70% – 100% | **A** | 5.0 | Excellent |
| 60% – 69% | **B** | 4.0 | Very Good |
| 50% – 59% | **C** | 3.0 | Good |
| 45% – 49% | **D** | 2.0 | Fair |
| 40% – 44% | **E** | 1.0 | Pass |
| 0% – 39% | **F** | 0.0 | Fail |

---

## Default Demo Accounts

| Role | Username / Matric No | Password | Description |
|:---|:---|:---|:---|
| **Administrator** | `admin` | `admin123` | Full access to school management and gradebook |
| **Student** | `UG/20/1042` | `password123` | Musa Ibrahim (Computer Engineering, 300L) |
| **Student** | `UG/21/1105` | `password123` | Aisha Bello (Cyber Security Science, 200L) |

---

## Local Development Quickstart

```bash
# 1. Navigate to the project directory
cd unified-school-portal

# 2. Install dependencies
npm install

# 3. Setup database (SQLite for local zero-config testing)
npx prisma db push
npm run prisma:seed

# 4. Start Next.js development server
npm run dev

# 5. Open browser at http://localhost:3000
```

---

## AWS Cloud Deployment Guide (EC2 + RDS + S3)

### Step 1: Provision Amazon RDS (MySQL)
1. In the AWS Console, launch an **Amazon RDS MySQL** instance:
   - Template: **Free Tier** (`db.t3.micro`).
   - Master username: `admin`
   - Master password: `your_strong_password`
   - Database name: `school_portal_db`
   - Public Access: **No** (Enforces internal VPC security).
2. Note your **RDS Endpoint URL** once the status changes to *Available*:
   `groupb-student-db.cotg0g886gp1.us-east-1.rds.amazonaws.com`

### Step 2: Create Amazon S3 Bucket for Passport Photos
1. Open the Amazon S3 Console and create a bucket:
   - Bucket name: e.g. `futminna-student-passports-prod`
   - Region: `us-east-1`
   - Block all public access: On or Off depending on whether you want direct public URLs or presigned URLs.
2. In the **Permissions** tab under **Cross-Origin Resource Sharing (CORS)**, paste:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": []
  }
]
```

### Step 3: Launch & Configure Amazon EC2 Instance
1. Launch an EC2 instance:
   - Name: `FUTMINNA-School-Portal-Server`
   - OS: **Amazon Linux 2023** or **Ubuntu 24.04 LTS**
   - Instance Type: `t2.micro` or `t3.small`
2. Configure **EC2 Security Group (`ec2-web-sec-group`)**:
   - Inbound rules:
     - SSH (Port 22) &rarr; *Your IP only*
     - HTTP (Port 80) &rarr; *0.0.0.0/0 (Anywhere)*
     - HTTPS (Port 443) &rarr; *0.0.0.0/0 (Anywhere)*
3. **Cross-Link Security Groups:**
   - In the **RDS Security Group (`rds-sec-group`)**, edit inbound rules:
     - Type: MySQL/Aurora (Port 3306)
     - Source: Select **`ec2-web-sec-group`** ID (e.g. `sg-0abc123456789`).

### Step 4: Deploy Next.js to EC2
1. Connect to EC2 over SSH:
   ```bash
   ssh -i your-key.pem ec2-user@<EC2-PUBLIC-IP>
   ```
2. Clone or transfer the project to the EC2 host.
3. Create the protected runtime environment file at `/etc/unified-school-portal.env`:
   ```env
   DATABASE_URL="mysql://<RDS_USER>:<URL_ENCODED_PASSWORD>@<RDS_ENDPOINT>:3306/<DATABASE_NAME>"
   JWT_SECRET="<long-random-secret>"
   AWS_REGION="us-east-1"
   AWS_S3_BUCKET="<S3_BUCKET>"
   ```
   Protect it with `sudo chown root:root /etc/unified-school-portal.env && sudo chmod 600 /etc/unified-school-portal.env`. Attach an EC2 instance profile granting access to the S3 bucket; do not put AWS access keys on the instance.
4. Initialize an empty RDS database once, after confirming the endpoint and backup:
   ```bash
   npx prisma db push --schema=prisma/schema.mysql.prisma
   ```
   This creates the schema; it does not transfer the existing local SQLite data. Plan and verify that data migration separately before using production.
5. From the checked out project directory, run `chmod +x deploy.sh && ./deploy.sh`. The app listens on port 3000 for an ALB target group. Allow inbound 3000 on the EC2 security group only from the ALB security group; do not expose it to the internet. Configure the ALB health check path as `/api/health`.

The Docker image uses the MySQL Prisma schema and Next.js standalone output. Deployment no longer seeds demo accounts or changes the database schema automatically. See `deploy.sh` for the host prerequisites.
