import { useState, useEffect } from 'react';

export const DEMO_DOCTORS = [
  {
    _id: "demo_d1",
    name: "Emily Wong (Demo)",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily",
    doctorProfile: {
      specialization: "Cardiology",
      affiliation: "City General Hospital",
      bio: "Expert in cardiovascular health with 10 years of experience."
    }
  },
  {
    _id: "demo_d2",
    name: "James Wilson (Demo)",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=James",
    doctorProfile: {
      specialization: "Dermatology",
      affiliation: "Skin Care Clinic",
      bio: "Specializing in treating various skin conditions."
    }
  },
  {
    _id: "demo_d3",
    name: "Robert Brown (Demo)",
    imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Robert",
    doctorProfile: {
      specialization: "Pediatrics",
      affiliation: "Family Health Center",
      bio: "Dedicated to the health and well-being of children."
    }
  }
];

// Helper to generate past logs
const generatePastLogs = (days: number, consistency: number) => {
  const logs = [];
  const today = new Date();
  for (let i = 1; i <= days; i++) {
    if (Math.random() < consistency) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      logs.push({
        date: date.toISOString().split('T')[0],
        status: 'taken',
        time: 'morning'
      });
    }
  }
  return logs;
};

export const DEMO_MEDICATIONS = [
  {
    _id: "demo_med_1",
    name: "Metformin",
    dosage: "500mg",
    purpose: "Diabetes",
    instructions: "Take with food",
    active: true,
    duration: 30,
    startDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    schedule: [
      { time: "morning", withFood: true, quantity: 1 },
      { time: "evening", withFood: true, quantity: 1 }
    ],
    progress: { current: 15, total: 30 },
    streak: 7,
    takenLog: generatePastLogs(7, 1.0) // Perfect streak last 7 days
  },
  {
    _id: "demo_med_2",
    name: "Atorvastatin",
    dosage: "20mg",
    purpose: "Cholesterol",
    instructions: "Take on empty stomach",
    active: true,
    duration: 90,
    startDate: Date.now() - 60 * 24 * 60 * 60 * 1000,
    schedule: [
      { time: "night", withFood: false, quantity: 1 }
    ],
    progress: { current: 22, total: 90 },
    streak: 22,
    takenLog: generatePastLogs(22, 0.9)
  },
  {
    _id: "demo_med_3",
    name: "Losartan",
    dosage: "50mg",
    purpose: "Blood Pressure",
    instructions: "Take at any time",
    active: true,
    duration: 30,
    startDate: Date.now() - 15 * 24 * 60 * 60 * 1000,
    schedule: [
      { time: "morning", withFood: false, quantity: 1 }
    ],
    progress: { current: 8, total: 30 },
    streak: 8,
    takenLog: generatePastLogs(8, 0.8)
  }
];

export const DEMO_CONSULTATION = {
  _id: "demo_cons_1",
  doctorName: "Sharma",
  date: "2024-03-15",
  duration: "25 minutes",
  assessment: "Type 2 Diabetes management review. Blood pressure within target range (128/82 mmHg). Cholesterol levels improved but need monitoring.",
  treatmentPlan: "Continue: Metformin 500mg (twice daily with meals). Adjust: Atorvastatin increased to 20mg nightly. Add: Daily 30-minute walk after dinner. Follow-up: 4 weeks for repeat HbA1c test.",
  doctorNotes: "Patient shows good adherence. Focus on dietary consistency. Reduce processed sugar intake. Monitor for leg cramps as side effect of statin.",
  nextSteps: "Lab tests in 4 weeks. Weight check monthly. Report any dizziness or fatigue."
};

export const DEMO_APPOINTMENTS: any[] = [
  {
    _id: "demo_apt_1",
    date: Date.now() + 3600000 * 24, // tomorrow
    status: "scheduled",
    priority: "high",
    patient: {
      _id: "demo_p1",
      name: "Sarah Jenkins (Demo)",
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    },
    doctorId: "demo_d1",
    doctor: DEMO_DOCTORS[0],
    rescheduleRequest: {
      status: "pending",
      newDate: Date.now() + 3600000 * 48,
      reason: "Conflict"
    }
  },
  {
    _id: "demo_apt_2",
    date: Date.now() + 3600000 * 48, // day after tomorrow
    status: "scheduled",
    priority: "medium",
    patient: {
      _id: "demo_p2",
      name: "Michael Chen (Demo)",
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael",
    },
    doctorId: "demo_d2",
    doctor: DEMO_DOCTORS[1]
  },
  {
    _id: "demo_apt_3",
    date: Date.now() - 3600000 * 24, // yesterday
    status: "completed",
    priority: "low",
    patient: {
      _id: "demo_p3",
      name: "Emma Wilson (Demo)",
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emma",
    },
    doctorId: "demo_d3",
    doctor: DEMO_DOCTORS[2]
  }
];

export function useDemoMode() {
  const [isDemoMode, setIsDemoMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('health-companion-demo-mode');
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });

  useEffect(() => {
    const handleStorageChange = () => {
      const stored = localStorage.getItem('health-companion-demo-mode');
      setIsDemoMode(stored ? JSON.parse(stored) : false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('demo-mode-change', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('demo-mode-change', handleStorageChange);
    };
  }, []);

  const toggleDemoMode = () => {
    const newState = !isDemoMode;
    setIsDemoMode(newState);
    localStorage.setItem('health-companion-demo-mode', JSON.stringify(newState));
    window.dispatchEvent(new Event('demo-mode-change'));
  };

  return { isDemoMode, toggleDemoMode };
}