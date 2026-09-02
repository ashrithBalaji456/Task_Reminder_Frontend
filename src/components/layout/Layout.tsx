import React, { useEffect, useState } from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';
import { useSidebar } from '../../context/SidebarContext';
import { OfflineBanner } from '../../pwa/components/OfflineBanner';
import { PwaInstallPrompt } from '../../pwa/components/PwaInstallPrompt';
import { NotificationPromptModal } from '../common/NotificationPromptModal';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isCollapsed } = useSidebar();
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  useEffect(() => {
    // Auto-prompt if notifications are supported, not granted, and not dismissed in session
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const isDismissed = sessionStorage.getItem('notification_prompt_dismissed');
      if (Notification.permission !== 'granted' && !isDismissed) {
        // Slight delay so the UI loads smoothly first
        const timer = setTimeout(() => {
          setShowNotificationModal(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-rose-50 via-purple-50 to-amber-50">
      {/* Background Ambient Glow Blobs */}
      <div className="fixed -top-32 -left-32 w-96 h-96 rounded-full bg-rose-300/30 blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 -right-32 w-96 h-96 rounded-full bg-purple-300/30 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-32 left-1/3 w-96 h-96 rounded-full bg-amber-300/20 blur-3xl pointer-events-none" />

      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Workspace Wrapper (shifts smooth margin to make room for fixed sidebar) */}
      <div
        className={`min-h-screen transition-all duration-300 ${
          isCollapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        {/* Main Content Area - Perfectly Centered in Workspace */}
        <main className="pb-24 md:pb-12 pt-6 px-4 sm:px-8 max-w-7xl mx-auto relative z-10">
          <OfflineBanner />
          {children}
        </main>
      </div>

      {/* Mobile Navigation & PWA Prompts */}
      <MobileNav />
      <PwaInstallPrompt />
      <NotificationPromptModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />
    </div>
  );
};
