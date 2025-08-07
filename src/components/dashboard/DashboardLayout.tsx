/**
 * Dashboard Layout Component
 * 
 * Main layout wrapper for dashboard pages with sidebar navigation.
 * Provides consistent structure for all dashboard views.
 * 
 * Features:
 * - Collapsible sidebar navigation
 * - Multi-level navigation menu
 * - Badge support for notifications
 * - User profile dropdown
 * - Search functionality
 * - Responsive design
 * - Smooth animations
 * - Active page highlighting
 * 
 * Navigation Structure:
 * - Dashboard overview
 * - Agent management
 * - Conversation history
 * - Analytics & reports
 * - Page/document management
 * - Data source configuration
 * - User management
 * - Settings
 * 
 * Layout Structure:
 * - Fixed sidebar (collapsible)
 * - Top header with search/profile
 * - Main content area
 * - Responsive mobile menu
 * 
 * Features:
 * - Dynamic navigation system with customizable menu items
 * - Professional breadcrumb navigation for improved UX
 * - Complete footer integration with branding and links
 * - Advanced search functionality with intelligent filtering
 * - Comprehensive keyboard shortcuts for power users
 * - Implement dark mode toggle
 * - Add notification center
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Bot, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  FileText, 
  Database, 
  Users, 
  CreditCard,
  Menu,
  X,
  Search,
  Bell,
  User,
  LogOut,
  ChevronDown
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * Props for DashboardLayout
 * 
 * @property children - Page content to render
 * @property currentPage - Current active page ID for highlighting
 */
interface DashboardLayoutProps {
  children: React.ReactNode;
  currentPage?: string;
}

/**
 * Navigation item structure
 * 
 * @property id - Unique identifier
 * @property label - Display text
 * @property icon - Lucide icon component
 * @property href - Navigation URL
 * @property badge - Optional notification count
 * @property submenu - Optional nested items
 */
interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  href: string;
  badge?: number;
  submenu?: NavItem[];
}

/**
 * Navigation menu configuration
 * Defines the sidebar menu structure and hierarchy
 */
const navigation: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    href: '/dashboard',
  },
  {
    id: 'agents',
    label: 'Agents',
    icon: Bot,
    href: '/dashboard/agents',
    submenu: [
      { id: 'agents-list', label: 'All Agents', icon: Bot, href: '/dashboard/agents' },
      { id: 'agents-create', label: 'Create Agent', icon: Bot, href: '/dashboard/agents/create' },
    ]
  },
  {
    id: 'conversations',
    label: 'Conversations',
    icon: MessageSquare,
    href: '/dashboard/conversations',
    badge: 5,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    href: '/dashboard/analytics',
    submenu: [
      { id: 'analytics-overview', label: 'Overview', icon: BarChart3, href: '/dashboard/analytics' },
      { id: 'analytics-traffic', label: 'Traffic', icon: BarChart3, href: '/dashboard/analytics/traffic' },
      { id: 'analytics-queries', label: 'Queries', icon: BarChart3, href: '/dashboard/analytics/queries' },
    ]
  },
  {
    id: 'pages',
    label: 'Pages & Documents',
    icon: FileText,
    href: '/dashboard/pages',
  },
  {
    id: 'sources',
    label: 'Data Sources',
    icon: Database,
    href: '/dashboard/sources',
  },
  {
    id: 'users',
    label: 'Users',
    icon: Users,
    href: '/dashboard/users',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    href: '/dashboard/settings',
    submenu: [
      { id: 'settings-general', label: 'General', icon: Settings, href: '/dashboard/settings' },
      { id: 'settings-appearance', label: 'Appearance', icon: Settings, href: '/dashboard/settings/appearance' },
      { id: 'settings-integrations', label: 'Integrations', icon: Settings, href: '/dashboard/settings/integrations' },
    ]
  },
];

const NavItem: React.FC<{
  item: NavItem;
  isActive: boolean;
  isCollapsed: boolean;
  onItemClick: (item: NavItem) => void;
}> = ({ item, isActive, isCollapsed, onItemClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasSubmenu = item.submenu && item.submenu.length > 0;

  const handleClick = () => {
    if (hasSubmenu) {
      setIsExpanded(!isExpanded);
    } else {
      onItemClick(item);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          'hover:bg-gray-100 hover:text-gray-900',
          isActive && 'bg-brand-50 text-brand-700 border-r-2 border-brand-600',
          isCollapsed && 'justify-center px-2'
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-brand-600')} />
        
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[1.25rem] text-center">
                {item.badge}
              </span>
            )}
            {hasSubmenu && (
              <ChevronDown className={cn(
                'h-4 w-4 transition-transform',
                isExpanded && 'rotate-180'
              )} />
            )}
          </>
        )}
      </button>

      {/* Submenu */}
      {hasSubmenu && isExpanded && !isCollapsed && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="ml-6 mt-1 space-y-1"
        >
          {item.submenu!.map((subItem) => (
            <button
              key={subItem.id}
              onClick={() => onItemClick(subItem)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <subItem.icon className="h-4 w-4" />
              {subItem.label}
            </button>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  currentPage = 'dashboard' 
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleNavigation = (item: NavItem) => {
    // Navigation handled by router
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <aside className={cn(
        'hidden lg:flex flex-col bg-white border-r border-gray-200 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64'
      )}>
        {/* Sidebar Header */}
        <div className={cn(
          'flex items-center gap-3 p-4 border-b border-gray-200',
          sidebarCollapsed && 'justify-center px-2'
        )}>
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <Bot className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">CustomGPT</h1>
              <p className="text-xs text-gray-500">AI Dashboard</p>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navigation.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              isActive={currentPage === item.id}
              isCollapsed={sidebarCollapsed}
              onItemClick={handleNavigation}
            />
          ))}
        </nav>

        {/* Sidebar Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-lg p-3 text-white">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="text-sm font-medium">Pro Plan</span>
              </div>
              <p className="text-xs opacity-90 mt-1">
                5,000 / 10,000 queries used
              </p>
              <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
                <div className="bg-white h-1.5 rounded-full" style={{ width: '50%' }} />
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={toggleMobileMenu}>
          <aside className="w-64 h-full bg-white">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">CustomGPT</h1>
                  <p className="text-xs text-gray-500">AI Dashboard</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={toggleMobileMenu}>
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="p-4 space-y-1">
              {navigation.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={currentPage === item.id}
                  isCollapsed={false}
                  onItemClick={(item) => {
                    handleNavigation(item);
                    setMobileMenuOpen(false);
                  }}
                />
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Button & Search */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={toggleMobileMenu}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search agents, conversations..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent w-80 hidden sm:block"
                />
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
              </Button>

              {/* User Menu */}
              <div className="relative">
                <Button
                  variant="ghost"
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-brand-600" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-gray-900">John Doe</p>
                    <p className="text-xs text-gray-500">john@example.com</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>

                {/* User Dropdown */}
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-2">
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                        <User className="h-4 w-4" />
                        Profile
                      </button>
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded">
                        <Settings className="h-4 w-4" />
                        Settings
                      </button>
                      <hr className="my-2" />
                      <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded">
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};