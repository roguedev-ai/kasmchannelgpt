'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Wifi, Battery, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemoryUsage, useBatteryLevel, useNetworkQuality } from '@/lib/performance/mobile-optimizations';

interface PerformanceMonitorProps {
  show?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Performance Monitor Component
 * 
 * Displays real-time performance metrics for debugging
 * Only shown in development mode
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  show = process.env.NODE_ENV === 'development',
  position = 'bottom-right'
}) => {
  const [fps, setFps] = useState(60);
  const memoryUsage = useMemoryUsage();
  const { batteryLevel, isCharging } = useBatteryLevel();
  const networkQuality = useNetworkQuality();
  
  // FPS monitoring
  useEffect(() => {
    if (!show) return;
    
    let lastTime = performance.now();
    let frames = 0;
    let animationId: number;
    
    const measureFPS = () => {
      frames++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        setFps(Math.round((frames * 1000) / (currentTime - lastTime)));
        frames = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };
    
    animationId = requestAnimationFrame(measureFPS);
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [show]);
  
  if (!show) return null;
  
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };
  
  const memoryPercentage = memoryUsage
    ? Math.round((memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100)
    : 0;
  
  const memoryMB = memoryUsage
    ? Math.round(memoryUsage.usedJSHeapSize / 1024 / 1024)
    : 0;
  
  return (
    <div
      className={cn(
        'fixed z-50 bg-background/90 backdrop-blur-sm border border-border rounded-lg shadow-lg p-3',
        'text-xs font-mono',
        'min-w-[200px]',
        positionClasses[position]
      )}
    >
      <h3 className="font-semibold text-foreground mb-2">Performance</h3>
      
      {/* FPS */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Activity className="w-3 h-3" />
          <span>FPS</span>
        </div>
        <span className={cn(
          fps >= 50 ? 'text-green-600' : 
          fps >= 30 ? 'text-yellow-600' : 
          'text-red-600'
        )}>
          {fps}
        </span>
      </div>
      
      {/* Memory Usage */}
      {memoryUsage && (
        <div className="flex items-center justify-between mb-1">
          <span>Memory</span>
          <span className={cn(
            memoryPercentage < 70 ? 'text-green-600' :
            memoryPercentage < 90 ? 'text-yellow-600' :
            'text-red-600'
          )}>
            {memoryMB}MB ({memoryPercentage}%)
          </span>
        </div>
      )}
      
      {/* Network */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1">
          <Wifi className="w-3 h-3" />
          <span>Network</span>
        </div>
        <span className={cn(
          networkQuality.effectiveType === '4g' ? 'text-green-600' :
          networkQuality.effectiveType === '3g' ? 'text-yellow-600' :
          'text-red-600'
        )}>
          {networkQuality.effectiveType.toUpperCase()}
        </span>
      </div>
      
      {/* Battery */}
      {batteryLevel !== null && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {isCharging ? <Zap className="w-3 h-3" /> : <Battery className="w-3 h-3" />}
            <span>Battery</span>
          </div>
          <span className={cn(
            batteryLevel > 0.5 ? 'text-green-600' :
            batteryLevel > 0.2 ? 'text-yellow-600' :
            'text-red-600'
          )}>
            {Math.round(batteryLevel * 100)}%
            {isCharging && ' ⚡'}
          </span>
        </div>
      )}
      
      {/* Data Saver */}
      {networkQuality.saveData && (
        <div className="mt-2 text-yellow-600">
          Data Saver Mode Active
        </div>
      )}
    </div>
  );
};