import React, { useEffect } from 'react';
import { BrowserRouter, useNavigate, useLocation } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { SidebarProvider } from './context/SidebarContext';
import { AppRoutes } from './routes/AppRoutes';

function CapacitorBackHandler() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let cleanup: (() => void) | undefined;

    CapApp.addListener('backButton', () => {
      const exitRoutes = ['/', '/dashboard', '/login'];
      if (exitRoutes.includes(location.pathname)) {
        CapApp.exitApp();
      } else {
        navigate(-1);
      }
    }).then((listener) => {
      cleanup = () => listener.remove();
    });

    return () => {
      if (cleanup) cleanup();
    };
  }, [navigate, location]);

  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <CapacitorBackHandler />
      <ToastProvider>
        <AuthProvider>
          <SidebarProvider>
            <AppRoutes />
          </SidebarProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
