import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import OnboardingSplash from './OnboardingSplash';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user?.id) {
      const dismissedKey = `onboarding_dismissed_${user.id}`;
      const dismissed = localStorage.getItem(dismissedKey) === 'true';
      if (!dismissed) {
        setShowOnboarding(true);
      }
    }
  }, [user?.id]);

  const handleOnboardingComplete = (dontShowAgain: boolean) => {
    if (user?.id && dontShowAgain) {
      localStorage.setItem(`onboarding_dismissed_${user.id}`, 'true');
    }
    setShowOnboarding(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
      {showOnboarding && <OnboardingSplash onComplete={handleOnboardingComplete} />}
    </div>
  );
}
