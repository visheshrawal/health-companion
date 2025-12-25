# 🩺 Health Companion: Never Miss What Matters Most

**AI-Powered Healthcare Companion for Patients & Doctors | GDGoC**
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/visheshrawal/health-companion)

## 🌟 The Problem We Solve

Watching our parents manage medications, struggle with confusing medical advice, and worry about emergencies inspired Health Companion. 50% of chronic patients miss medications regularly, doctors spend hours on administrative tasks, and families feel helpless during health crises.

**Our solution:** A gentle digital companion that remembers for them, explains clearly, and acts when needed.

## ✨ Live Demo
**Test Environment:** [https://every-ghosts-judge.vly.sh](https://every-ghosts-judge.vly.sh)

**Demo Credentials:**
- 👤 **Patient:** `vrawal2007.vr@gmail.com` / `Vrawal@2007`
- 🩺 **Doctor:** `vishulevel@gmail.com` / `Vrawal@2007`

*Note: Using development environment for hackathon demo stability*

## 🚀 Key Features

### 🤖 **AI-Powered Health Assistant**
- **Symptom Analysis**: Preliminary assessment with Google's Gemini AI
- **Consultation Summaries**: AI transforms doctor notes into patient-friendly language
- **Medical Translation**: Bridges communication gap between doctors and patients

### 💊 **Smart Medication Management**
- **Digital Prescriptions**: Paperless prescriptions from doctors
- **Adherence Tracking**: Supportive streak system (no competitive pressure)
- **Dosage Scheduling**: Morning/Afternoon/Night mapping with food instructions

### 🏥 **Complete Healthcare Platform**
- **Priority Scheduling**: Dynamic appointment system with doctor control
- **Emergency SOS**: One-tap alerts with location sharing to contacts
- **Nearby Hospital Finder**: Integrated Google Maps for emergencies
- **Health Teams**: Private support groups for families

### 👨‍⚕️ **Doctor Empowerment**
- **Smart Dashboard**: Priority-based patient management
- **Digital Workflow**: Paperless prescriptions and consultation notes
- **Time Savings**: Reduces administrative burden by 2-3 hours weekly

## 🛠️ Tech Stack

### **Frontend**
- **React 19** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS v4** with OKLCH color system
- **Shadcn UI** component library
- **Framer Motion** for animations

### **Backend & Database**
- **Convex** for real-time backend & database
- **Firebase Authentication** with role-based access
- **Convex Auth** for secure user management

### **AI & External Services**
- **Google Gemini API** for medical intelligence
- **Google Maps Platform** for location services
- **Twilio** for emergency SMS (ready for integration)

### **Development & Deployment**
- **Three.js** for 3D graphics (landing page)
- **Lucide Icons** for consistent iconography
- **Vercel** for deployment
- **pnpm** for package management

## 🏗️ Architecture
┌─────────────────────────────────────────────────────────────┐
│Frontend (React + Vite) 
│ • Patient/Doctor Dashboards • Real-time UI Updates │
└───────────────┬─────────────────────────────────────────────┘

│ HTTPS / WebSocket

┌───────────────▼─────────────────────────────────────────────┐
│Backend (Convex Serverless) │
│ • Authentication & Authorization • Real-time Database │
│ • Prescription Logic • Appointment Scheduling │
└───────────────┬─────────────────────────────────────────────┘

│ API Calls

┌───────────────▼─────────────────────────────────────────────┐
│External Services │
│ • Gemini AI • Google Maps • Twilio SMS │
└─────────────────────────────────────────────────────────────┘

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ & pnpm
- Google Cloud account (for Gemini API & Maps)
- Convex account

### Installation
```bash
# Clone repository
git clone https://github.com/visheshrawal/health-companion.git
cd health-companion

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your API keys to .env.local

# Run development server
pnpm dev
```

📖 Usage Guide
For Patients
Sign up as a patient and complete your health profile

Add emergency contact for SOS feature

Use symptom checker before booking appointments

Track medications daily with encouraging streaks

Book appointments with priority scheduling

Access AI summaries after consultations

Use SOS button in emergencies for instant help

For Doctors
Verify credentials and set up specialization

Manage appointments with priority system

Write digital prescriptions during consultations

Access patient history for informed care

Monitor adherence across patient panel

🔒 Privacy & Security
HIPAA-aware design with medical data protection

Role-based access control (Patient/Doctor separation)

Emergency-only location sharing

End-to-end data encryption

No sensitive data in logs

🎯 Future Roadmap
Lab Report Analysis (AI-powered interpretation)

Pharmacy Integration with QR code prescriptions

Wearable Device Sync (Fitbit/Apple Health)

Telemedicine Video Calls

Multi-language Support

Clinical Trial Matching

👥 Team
Built with ❤️ for the Google Developer Student Clubs Hackathon 2025

Team Members: Vishesh Rawal , Himanshu Raghav , Paulson Fernandes
Vishesh Rawal
THE III LAWS(Broken)- Chief Developer 

📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

⚠️ Disclaimer
Health Companion is a hackathon project for demonstration purposes. It is NOT a certified medical device and should NOT be used for actual medical diagnosis or treatment. Always consult healthcare professionals for medical advice.

