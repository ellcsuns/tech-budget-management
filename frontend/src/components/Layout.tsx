import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
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
      const key = `onboarding_seen_${user.id}`;
      if (!localStorage.getItem(key)) {
        setShowOnboarding(true);
      }
    }
  }, [user?.id]);

  const handleOnboardingComplete = () => {
    if (user?.id) {
      localStorage.setItem(`onboarding_seen_${user.id}`, 'true');
    }
    setShowOnboarding(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-6 py-8">
          {children}
        </div>
      </main>
      {showOnboarding && <OnboardingSplash onComplete={handleOnboardingComplete} />}
    </div>
  );
}
