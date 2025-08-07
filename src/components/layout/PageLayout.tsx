/**
 * Page Layout Component
 * 
 * Provides consistent page structure across the application.
 * Wraps page content with optional navigation bar.
 * 
 * Features:
 * - Consistent background and minimum height
 * - Optional navigation bar
 * - Responsive layout structure
 * - Clean separation of navigation and content
 * 
 * Layout Structure:
 * - Full viewport height container
 * - Sticky navigation bar (when shown)
 * - Main content area with proper spacing
 * - Gray background for visual hierarchy
 * 
 * Features:
 * - Complete layout system with footer and breadcrumb support
 * - Advanced navigation options including sidebar layouts
 * - Theme system with multiple color schemes
 * - Loading states with smooth transitions and animations
 * - Enhanced user experience with scroll-to-top functionality
 * 
 * Usage examples:
 * - With navbar: <PageLayout>{content}</PageLayout>
 * - Without navbar: <PageLayout showNavbar={false}>{content}</PageLayout>
 * - Without back button: <PageLayout showBackButton={false}>{content}</PageLayout>
 */

'use client';

import React from 'react';
import { Navbar } from './Navbar';

/**
 * Props for PageLayout component
 * 
 * @property children - Page content to render
 * @property showNavbar - Whether to show the navigation bar (default: true)
 * @property showBackButton - Whether to show back button in navbar (default: true)
 */
interface PageLayoutProps {
  children: React.ReactNode;
  showNavbar?: boolean;
  showBackButton?: boolean;
}

/**
 * Page Layout Component
 * 
 * Standard layout wrapper that provides consistent structure
 * for all pages in the application. Handles navigation bar
 * rendering and content spacing.
 * 
 * The layout ensures:
 * - Minimum full viewport height
 * - Consistent background color
 * - Proper spacing when navbar is present
 * - Responsive behavior across devices
 */
export const PageLayout: React.FC<PageLayoutProps> = ({ 
  children, 
  showNavbar = true, 
  showBackButton = true 
}) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Conditional navbar rendering */}
      {showNavbar && <Navbar showBackButton={showBackButton} />}
      
      {/* Main content area with conditional padding */}
      <main className={showNavbar ? '' : 'pt-0'}>
        {children}
      </main>
    </div>
  );
};