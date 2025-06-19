import React, { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardSidebar } from './DashboardSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('upload');

  const handleNavigate = (section: string) => {
    setActiveSection(section);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header */}
      <DashboardHeader 
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
        sidebarCollapsed={sidebarCollapsed}
      />
      
      <div className="flex">
        {/* Sidebar */}
        <DashboardSidebar 
          collapsed={sidebarCollapsed} 
          onNavigate={handleNavigate}
          activeSection={activeSection}
        />
        
        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        } pt-16`}>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};