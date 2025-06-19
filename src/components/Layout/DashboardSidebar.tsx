import React, { useState } from 'react';
import { 
  Upload, 
  BarChart3, 
  Settings, 
  Download, 
  Image as ImageIcon,
  Activity,
  Target,
  Zap,
  ChevronRight,
  Home,
  FileText,
  TrendingUp,
  Layers
} from 'lucide-react';

interface DashboardSidebarProps {
  collapsed: boolean;
  onNavigate?: (section: string) => void;
  activeSection?: string;
}

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  active?: boolean;
  children?: SidebarItem[];
  onClick?: () => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ 
  collapsed, 
  onNavigate,
  activeSection = 'upload'
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>(['analysis']);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    onNavigate?.(sectionId);
  };

  const sidebarItems: SidebarItem[] = [
    {
      id: 'upload',
      label: 'Upload Images',
      icon: <Upload className="w-5 h-5" />,
      onClick: () => scrollToSection('upload-section')
    },
    {
      id: 'analysis',
      label: 'Analysis',
      icon: <Activity className="w-5 h-5" />,
      children: [
        {
          id: 'overview',
          label: 'Overview',
          icon: <BarChart3 className="w-4 h-4" />,
          onClick: () => scrollToSection('stats-section')
        },
        {
          id: 'quality',
          label: 'Quality Metrics',
          icon: <Target className="w-4 h-4" />,
          onClick: () => scrollToSection('histogram-section')
        },
        {
          id: 'settings',
          label: 'Threshold Settings',
          icon: <Settings className="w-4 h-4" />,
          onClick: () => scrollToSection('settings-section')
        },
      ]
    },
    {
      id: 'results',
      label: 'Image Results',
      icon: <ImageIcon className="w-5 h-5" />,
      onClick: () => scrollToSection('results-section')
    },
    {
      id: 'export',
      label: 'Export Data',
      icon: <Download className="w-5 h-5" />,
      onClick: () => scrollToSection('export-section')
    },
  ];

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const isActive = activeSection === item.id;
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id} className="animate-fade-in-up" style={{ animationDelay: `${level * 0.1}s` }}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else if (item.onClick) {
              item.onClick();
            }
          }}
          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300 group ${
            isActive 
              ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg glow-blue' 
              : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
          } ${level > 0 ? 'ml-4 pl-8' : ''}`}
        >
          <div className="flex items-center space-x-3">
            <div className={`transition-all duration-300 ${
              isActive ? 'text-white scale-110' : 'text-slate-400 group-hover:text-slate-200 group-hover:scale-105'
            }`}>
              {item.icon}
            </div>
            {!collapsed && (
              <span className="font-semibold">{item.label}</span>
            )}
          </div>
          
          {!collapsed && (
            <div className="flex items-center space-x-2">
              {item.badge && (
                <span className="badge-primary">
                  {item.badge}
                </span>
              )}
              {hasChildren && (
                <ChevronRight 
                  className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} 
                />
              )}
            </div>
          )}
        </button>

        {/* Children */}
        {hasChildren && isExpanded && !collapsed && (
          <div className="mt-2 space-y-1 animate-fade-in-up">
            {item.children!.map(child => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <aside className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-slate-800/95 backdrop-blur-sm border-r border-slate-700/50 transition-all duration-300 z-40 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      <div className="p-4 h-full overflow-y-auto">
        <nav className="space-y-2">
          {sidebarItems.map(item => renderSidebarItem(item))}
        </nav>

        {/* Bottom Section */}
        {!collapsed && (
          <div className="absolute bottom-4 left-4 right-4 animate-fade-in-up delay-500">
            <div className="p-4 bg-gradient-to-r from-blue-600/20 to-cyan-600/20 rounded-xl border border-blue-500/30 backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-200">GPU Accelerated</p>
                  <p className="text-xs text-blue-300">WebGL Processing Active</p>
                  <div className="flex items-center space-x-1 mt-1">
                    <div className="status-online" />
                    <span className="text-xs text-emerald-400 font-medium">Ready</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};