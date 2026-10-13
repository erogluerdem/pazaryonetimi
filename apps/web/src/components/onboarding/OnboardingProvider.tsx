"use client";

import { useEffect, useState } from "react";
import { UserOnboarding } from "@/components/onboarding/UserOnboarding";

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      if (typeof window !== "undefined" && localStorage.getItem("pazaryonetimi_onboarded") === "true") {
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/onboarding");
      if (response.ok) {
        const data = await response.json();
        if (!data.isCompleted && data.isActive) {
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error("Error checking onboarding status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setShowOnboarding(false);
  };

  if (isLoading) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      {showOnboarding && <UserOnboarding onClose={handleClose} />}
    </>
  );
}
