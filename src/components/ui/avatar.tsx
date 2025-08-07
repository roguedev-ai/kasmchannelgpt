/**
 * Avatar Component
 * 
 * Reusable avatar component that displays agent avatars with fallback to default icons.
 * Supports different sizes, shapes, and fallback icons for various use cases.
 * 
 * Features:
 * - Image loading with error handling
 * - Multiple size variants
 * - Customizable fallback icons
 * - Consistent styling across the application
 * - Accessibility support
 */

'use client';

import React from 'react';
import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Agent } from '@/types';

export interface AvatarProps {
  /** Agent/project data containing avatar information */
  agent?: Agent | null;
  /** Avatar image URL (alternative to agent prop) */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Size variant */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Shape variant */
  shape?: 'circle' | 'rounded' | 'square';
  /** Fallback icon type */
  fallback?: 'bot' | 'user' | 'none';
  /** Whether this avatar represents a selected/active state */
  isSelected?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Avatar size configurations
 */
const sizeVariants = {
  xs: {
    container: 'w-4 h-4',
    icon: 'w-2 h-2'
  },
  sm: {
    container: 'w-6 h-6', 
    icon: 'w-3 h-3'
  },
  md: {
    container: 'w-8 h-8',
    icon: 'w-4 h-4'
  },
  lg: {
    container: 'w-10 h-10',
    icon: 'w-5 h-5'
  },
  xl: {
    container: 'w-12 h-12',
    icon: 'w-6 h-6'
  }
};

/**
 * Avatar shape configurations
 */
const shapeVariants = {
  circle: 'rounded-full',
  rounded: 'rounded-lg', 
  square: 'rounded-none'
};

/**
 * Avatar Component
 * 
 * Displays agent avatar with proper fallbacks and error handling.
 * 
 * @param agent - Agent object containing avatar settings
 * @param src - Direct image URL (overrides agent avatar)
 * @param alt - Alt text for accessibility
 * @param size - Size variant (xs, sm, md, lg, xl)
 * @param shape - Shape variant (circle, rounded, square)
 * @param fallback - Fallback icon type
 * @param isSelected - Whether avatar represents selected state
 * @param className - Additional CSS classes
 */
export const Avatar: React.FC<AvatarProps> = ({
  agent,
  src,
  alt,
  size = 'md',
  shape = 'circle',
  fallback = 'bot',
  isSelected = false,
  className
}) => {
  const [imageError, setImageError] = React.useState(false);
  
  // Determine the avatar URL from props or agent settings
  const avatarUrl = src || agent?.settings?.chatbot_avatar;
  
  // Generate alt text if not provided
  const altText = alt || (agent?.project_name ? `${agent.project_name} avatar` : 'Avatar');
  
  // Get size and shape classes
  const sizeClasses = sizeVariants[size];
  const shapeClass = shapeVariants[shape];
  
  // Determine background color based on state
  const backgroundClass = isSelected 
    ? 'bg-brand-600' 
    : 'bg-gray-200 hover:bg-gray-300 transition-colors';
  
  // Handle image load error
  const handleImageError = () => {
    setImageError(true);
  };
  
  // Reset error state when avatar URL changes
  React.useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);
  
  // Render fallback icon
  const renderFallbackIcon = () => {
    if (fallback === 'none') return null;
    
    const iconClass = cn(
      sizeClasses.icon,
      isSelected ? 'text-white' : 'text-gray-600'
    );
    
    switch (fallback) {
      case 'user':
        return <User className={iconClass} />;
      case 'bot':
      default:
        return <Bot className={iconClass} />;
    }
  };
  
  return (
    <div className={cn(
      'flex items-center justify-center flex-shrink-0 overflow-hidden',
      sizeClasses.container,
      shapeClass,
      backgroundClass,
      className
    )}>
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={altText}
          className="w-full h-full object-cover"
          onError={handleImageError}
          loading="lazy"
        />
      ) : (
        renderFallbackIcon()
      )}
    </div>
  );
};

/**
 * Agent Avatar Component
 * 
 * Specialized avatar component for agent/project displays.
 * Uses 'bot' fallback by default and extracts name for alt text.
 * 
 * @param agent - Agent object
 * @param size - Size variant
 * @param isSelected - Selection state
 * @param className - Additional classes
 */
export const AgentAvatar: React.FC<{
  agent?: Agent | null;
  size?: AvatarProps['size'];
  isSelected?: boolean;
  className?: string;
}> = ({ agent, size = 'md', isSelected = false, className }) => {
  return (
    <Avatar
      agent={agent}
      size={size}
      shape="circle"
      fallback="bot"
      isSelected={isSelected}
      alt={agent?.project_name ? `${agent.project_name} avatar` : 'Agent avatar'}
      className={className}
    />
  );
};

/**
 * User Avatar Component
 * 
 * Specialized avatar component for user displays.
 * Uses 'user' fallback by default.
 * 
 * @param src - Avatar image URL
 * @param size - Size variant  
 * @param className - Additional classes
 */
export const UserAvatar: React.FC<{
  src?: string;
  size?: AvatarProps['size'];
  className?: string;
}> = ({ src, size = 'md', className }) => {
  return (
    <Avatar
      src={src}
      size={size}
      shape="circle"
      fallback="user"
      alt="User avatar"
      className={className}
    />
  );
};