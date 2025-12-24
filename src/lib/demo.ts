import { useState, useEffect } from 'react';

export const DEMO_APPOINTMENTS = [
  {
    _id: "demo_apt_1",
    date: Date.now() + 3600000 * 24, // tomorrow
    status: "scheduled",
    priority: "high",
    patient: {
      _id: "demo_p1",
      name: "Sarah Jenkins (Demo)",
      imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
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
    }
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
    }
  }
];

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
