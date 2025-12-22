import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { Heart, Shield, Activity, ArrowRight } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="p-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground">
            HC
          </div>
          Health Companion
        </div>
        <div className="flex gap-4">
          <Button variant="ghost" onClick={() => navigate("/auth")}>Sign In</Button>
          <Button onClick={() => navigate("/auth")}>Get Started</Button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl space-y-8"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent pb-2">
            Healthcare Simplified.
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Manage your medications, book appointments, and connect with your doctor seamlessly. 
            A secure platform for modern healthcare.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button size="lg" className="text-lg px-8 h-14 rounded-full" onClick={() => navigate("/auth")}>
              Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-16 text-left">
            <div className="glass p-6 rounded-2xl space-y-4">
              <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Track Health</h3>
              <p className="text-muted-foreground">Monitor your vitals and medication adherence with intuitive dashboards.</p>
            </div>
            <div className="glass p-6 rounded-2xl space-y-4">
              <div className="h-12 w-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600 dark:text-green-400">
                <Heart className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Easy Care</h3>
              <p className="text-muted-foreground">Book appointments and receive digital prescriptions instantly.</p>
            </div>
            <div className="glass p-6 rounded-2xl space-y-4">
              <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold">Secure Data</h3>
              <p className="text-muted-foreground">Your health data is encrypted and accessible only to you and your doctor.</p>
            </div>
          </div>
        </motion.div>
      </main>

      <footer className="p-6 text-center text-muted-foreground text-sm">
        © 2024 Health Companion. All rights reserved.
      </footer>
    </div>
  );
}