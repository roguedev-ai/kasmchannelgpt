'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  MessageCircle, 
  History, 
  Bot, 
  Settings,
  Home,
  User
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileNavigationProps {
  className?: string;
  unreadCount?: number;
  onHistoryClick?: () => void;
  onAgentClick?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  badge?: number | string;
  isActive?: boolean;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({
  className,
  unreadCount = 0,
  onHistoryClick,
  onAgentClick
}) => {
  const router = useRouter();
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      id: 'chat',
      label: 'Chat',
      icon: MessageCircle,
      href: '/',
      isActive: pathname === '/'
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      onClick: onHistoryClick,
      badge: unreadCount > 0 ? unreadCount : undefined
    },
    {
      id: 'agents',
      label: 'Agents',
      icon: Bot,
      onClick: onAgentClick
    },
    {
      id: 'profile',
      label: 'Profile', 
      icon: User,
      href: '/profile',
      isActive: pathname?.startsWith('/profile')
    },
    {
      id: 'more',
      label: 'More',
      icon: Settings,
      href: '/settings',
      isActive: pathname?.startsWith('/settings')
    }
  ];

  const handleItemClick = (item: NavItem) => {
    if (item.onClick) {
      item.onClick();
    } else if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <div className={cn(
      'fixed bottom-0 left-0 right-0 z-50',
      'bg-background border-t border-border',
      'safe-area-pb', // Custom utility for safe area padding
      className
    )}>
      <nav className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                'flex flex-col items-center justify-center',
                'px-3 py-2 rounded-lg transition-colors',
                'min-h-[48px] min-w-[48px]', // Touch target size
                'relative',
                isActive 
                  ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/20' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
              aria-label={item.label}
            >
              <Icon className={cn(
                'w-5 h-5 mb-1',
                isActive && 'text-brand-600 dark:text-brand-400'
              )} />
              
              <span className={cn(
                'text-xs font-medium',
                isActive && 'text-brand-600 dark:text-brand-400'
              )}>
                {item.label}
              </span>
              
              {/* Badge for notifications */}
              {item.badge && (
                <span className={cn(
                  'absolute -top-1 -right-1',
                  'bg-red-500 text-white text-xs',
                  'rounded-full min-w-[18px] h-[18px]',
                  'flex items-center justify-center',
                  'font-semibold'
                )}>
                  {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};

/**
 * Mobile header component for page titles and actions
 */
interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftClick?: () => void;
  onRightClick?: () => void;
  className?: string;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftClick,
  onRightClick,
  className
}) => {
  return (
    <header className={cn(
      'sticky top-0 z-40',
      'bg-background/95 backdrop-blur-sm',
      'border-b border-border',
      'safe-area-pt', // Custom utility for safe area padding
      className
    )}>
      <div className="flex items-center justify-between min-h-[56px] px-4">
        {/* Left section */}
        <div className="flex items-center">
          {leftIcon && (
            <button
              onClick={onLeftClick}
              className="p-2 -ml-2 mr-2 rounded-lg hover:bg-accent flex items-center justify-center"
              aria-label="Back or menu"
            >
              {leftIcon}
            </button>
          )}
          
          <div className="min-w-0 flex-1">
            <h1 className="font-semibold text-foreground truncate">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground truncate">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right section */}
        {rightIcon && (
          <button
            onClick={onRightClick}
            className="p-2 -mr-2 rounded-lg hover:bg-accent flex items-center justify-center"
            aria-label="Actions or settings"
          >
            {rightIcon}
          </button>
        )}
      </div>
    </header>
  );
};