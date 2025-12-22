                <motion.div 
                  className="absolute inset-0 bg-destructive/20 flex items-center overflow-hidden z-0 pointer-events-none"
                  initial={{ opacity: 0 }}
                  exit={{ opacity: 1 }}
                >
                  <motion.div 
                    className="whitespace-nowrap text-destructive font-bold text-4xl uppercase opacity-50"
                    initial={{ x: "100%" }}
                    exit={{ x: "-100%", transition: { duration: 0.8, ease: "linear" } }}
                  >
                    CANCELLED CANCELLED CANCELLED CANCELLED CANCELLED
                  </motion.div>
                </motion.div>

      if (role === "patient") {
        await updateProfile({ ... });
        // navigate("/patient"); // Don't navigate away, just show view mode
      } else {
        await updateProfile({ ... });
        // navigate("/doctor");
      }
      toast.success("Profile updated successfully!");
      setIsEditing(false);