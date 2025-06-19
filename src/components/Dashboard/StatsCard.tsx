import React from 'react';
import { DivideIcon as LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'cyan' | 'purple';
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'blue',
  className = ''
}) => {
  const colorClasses = {
    blue: {
      bg: 'from-blue-600/20 to-blue-500/10',
      border: 'border-blue-500/30',
      icon: 'bg-blue-500',
      text: 'text-blue-400',
      glow: 'glow-blue'
    },
    emerald: {
      bg: 'from-emerald-600/20 to-emerald-500/10',
      border: 'border-emerald-500/30',
      icon: 'bg-emerald-500',
      text: 'text-emerald-400',
      glow: 'glow-emerald'
    },
    amber: {
      bg: 'from-amber-600/20 to-amber-500/10',
      border: 'border-amber-500/30',
      icon: 'bg-amber-500',
      text: 'text-amber-400',
      glow: 'glow-amber'
    },
    red: {
      bg: 'from-red-600/20 to-red-500/10',
      border: 'border-red-500/30',
      icon: 'bg-red-500',
      text: 'text-red-400',
      glow: 'glow-red'
    },
    cyan: {
      bg: 'from-cyan-600/20 to-cyan-500/10',
      border: 'border-cyan-500/30',
      icon: 'bg-cyan-500',
      text: 'text-cyan-400',
      glow: 'hover:shadow-cyan-500/20'
    },
    purple: {
      bg: 'from-purple-600/20 to-purple-500/10',
      border: 'border-purple-500/30',
      icon: 'bg-purple-500',
      text: 'text-purple-400',
      glow: 'hover:shadow-purple-500/20'
    }
  };

  const colors = colorClasses[color];

  return (
    <div className={`
      relative p-6 rounded-xl bg-gradient-to-br ${colors.bg} 
      border ${colors.border} backdrop-blur-sm
      hover:shadow-xl hover:${colors.glow} transition-all duration-300
      group cursor-pointer
      ${className}
    `}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 ${colors.icon} rounded-lg flex items-center justify-center shadow-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          
          {trend && (
            <div className={`flex items-center space-x-1 text-sm ${
              trend.isPositive ? 'text-emerald-400' : 'text-red-400'
            }`}>
              <span>{trend.isPositive ? '+' : ''}{trend.value}%</span>
              <div className={`w-2 h-2 rounded-full ${
                trend.isPositive ? 'bg-emerald-400' : 'bg-red-400'
              }`}></div>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="text-sm font-medium text-gray-400 mb-1">{title}</h3>
          <p className="text-3xl font-bold text-gray-100 mb-1">{value}</p>
          {subtitle && (
            <p className={`text-sm ${colors.text}`}>{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
};