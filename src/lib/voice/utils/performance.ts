/**
 * Performance monitoring utilities for voice themes
 * 
 * Provides performance tracking, FPS monitoring, and device capability detection
 */

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage?: number;
  particleCount?: number;
  objectCount?: number;
  drawCalls?: number;
}

export interface DeviceCapabilities {
  isMobile: boolean;
  isLowPowerDevice: boolean;
  supportsWebGL: boolean;
  hardwareConcurrency: number;
  memoryGB?: number;
  performanceLevel: 'low' | 'medium' | 'high';
}

/**
 * Performance monitor for tracking FPS and frame timing
 */
export class PerformanceMonitor {
  private frameCount = 0;
  private lastTime = 0;
  private currentFPS = 60;
  private frameTime = 16.67;
  private fpsHistory: number[] = [];
  private frameTimeHistory: number[] = [];
  private maxHistorySize = 60; // Keep 1 second of history at 60fps
  private warningThreshold = 0.8;
  private criticalThreshold = 0.6;

  private callbacks: {
    onFPSUpdate?: (fps: number) => void;
    onPerformanceWarning?: (metrics: PerformanceMetrics) => void;
    onPerformanceCritical?: (metrics: PerformanceMetrics) => void;
  } = {};

  constructor(targetFPS = 60) {
    this.lastTime = performance.now();
  }

  /**
   * Call this every frame to update performance metrics
   */
  update(): PerformanceMetrics {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.frameTime = deltaTime;
    
    // Update FPS calculation
    this.frameCount++;
    const fps = 1000 / deltaTime;
    this.fpsHistory.push(fps);
    this.frameTimeHistory.push(deltaTime);

    // Keep history size manageable
    if (this.fpsHistory.length > this.maxHistorySize) {
      this.fpsHistory.shift();
      this.frameTimeHistory.shift();
    }

    // Calculate average FPS over recent history
    const avgFPS = this.fpsHistory.reduce((sum, fps) => sum + fps, 0) / this.fpsHistory.length;
    this.currentFPS = avgFPS;

    // Check for performance issues
    const targetFPS = 30; // Conservative target for voice themes
    const performanceRatio = avgFPS / targetFPS;

    if (performanceRatio < this.criticalThreshold) {
      this.callbacks.onPerformanceCritical?.({
        fps: avgFPS,
        frameTime: deltaTime
      });
    } else if (performanceRatio < this.warningThreshold) {
      this.callbacks.onPerformanceWarning?.({
        fps: avgFPS,
        frameTime: deltaTime
      });
    }

    // Update callbacks
    if (this.frameCount % 30 === 0) { // Update every 30 frames (~0.5 seconds)
      this.callbacks.onFPSUpdate?.(avgFPS);
    }

    this.lastTime = currentTime;

    return {
      fps: avgFPS,
      frameTime: deltaTime
    };
  }

  /**
   * Set performance monitoring callbacks
   */
  setCallbacks(callbacks: typeof this.callbacks) {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    return {
      fps: this.currentFPS,
      frameTime: this.frameTime
    };
  }

  /**
   * Reset performance tracking
   */
  reset() {
    this.frameCount = 0;
    this.fpsHistory = [];
    this.frameTimeHistory = [];
    this.lastTime = performance.now();
  }
}

/**
 * Detect device capabilities for performance optimization
 */
export class DeviceCapabilityDetector {
  private static instance: DeviceCapabilityDetector;
  private capabilities: DeviceCapabilities | null = null;

  static getInstance(): DeviceCapabilityDetector {
    if (!DeviceCapabilityDetector.instance) {
      DeviceCapabilityDetector.instance = new DeviceCapabilityDetector();
    }
    return DeviceCapabilityDetector.instance;
  }

  /**
   * Detect and cache device capabilities
   */
  async detectCapabilities(): Promise<DeviceCapabilities> {
    if (this.capabilities) {
      return this.capabilities;
    }

    const isMobile = this.detectMobile();
    const supportsWebGL = this.detectWebGL();
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    
    let memoryGB: number | undefined;
    if ('memory' in (navigator as any)) {
      memoryGB = (navigator as any).memory.jsHeapSizeLimit / (1024 ** 3);
    }

    // Performance benchmarking
    const performanceLevel = await this.benchmarkPerformance();
    const isLowPowerDevice = this.detectLowPowerDevice(hardwareConcurrency, memoryGB, performanceLevel);

    this.capabilities = {
      isMobile,
      isLowPowerDevice,
      supportsWebGL,
      hardwareConcurrency,
      memoryGB,
      performanceLevel
    };

    return this.capabilities;
  }

  private detectMobile(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private detectWebGL(): boolean {
    try {
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch {
      return false;
    }
  }

  private detectLowPowerDevice(cores: number, memoryGB?: number, performanceLevel?: string): boolean {
    // Heuristics for low-power device detection
    if (cores <= 2) return true;
    if (memoryGB && memoryGB < 2) return true;
    if (performanceLevel === 'low') return true;
    return false;
  }

  private async benchmarkPerformance(): Promise<'low' | 'medium' | 'high'> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      let operations = 0;
      const maxTime = 50; // 50ms benchmark window

      const benchmark = () => {
        const currentTime = performance.now();
        if (currentTime - startTime >= maxTime) {
          // Classify performance based on operations completed
          if (operations < 100000) {
            resolve('low');
          } else if (operations < 500000) {
            resolve('medium');
          } else {
            resolve('high');
          }
          return;
        }

        // Simple mathematical operations
        for (let i = 0; i < 1000; i++) {
          Math.sin(Math.random() * Math.PI * 2);
          operations++;
        }

        requestAnimationFrame(benchmark);
      };

      requestAnimationFrame(benchmark);
    });
  }

  /**
   * Get cached capabilities or detect if not available
   */
  getCapabilities(): DeviceCapabilities | null {
    return this.capabilities;
  }
}

/**
 * Memory pool for efficient particle/object management
 */
export class ObjectPool<T> {
  private available: T[] = [];
  private inUse = new Set<T>();
  private createFn: () => T;
  private resetFn?: (obj: T) => void;
  private maxSize: number;

  constructor(createFn: () => T, resetFn?: (obj: T) => void, initialSize = 10, maxSize = 1000) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.maxSize = maxSize;

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      this.available.push(this.createFn());
    }
  }

  /**
   * Get an object from the pool
   */
  acquire(): T {
    let obj: T;

    if (this.available.length > 0) {
      obj = this.available.pop()!;
    } else if (this.inUse.size < this.maxSize) {
      obj = this.createFn();
    } else {
      // Pool is full, reuse oldest object
      const oldest = this.inUse.values().next().value;
      if (oldest) {
        this.release(oldest);
        obj = oldest;
      } else {
        // Fallback: create new object if somehow there's nothing to reuse
        obj = this.createFn();
      }
    }

    this.inUse.add(obj);
    return obj;
  }

  /**
   * Return an object to the pool
   */
  release(obj: T): void {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj);
      if (this.resetFn) {
        this.resetFn(obj);
      }
      this.available.push(obj);
    }
  }

  /**
   * Get pool statistics
   */
  getStats() {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size
    };
  }

  /**
   * Clear the entire pool
   */
  clear(): void {
    this.available = [];
    this.inUse.clear();
  }
}

/**
 * Utility to get optimal performance settings based on device capabilities
 */
export const getOptimalSettings = async (): Promise<{
  targetFPS: number;
  maxParticles: number;
  enableEffects: boolean;
  enableGlow: boolean;
  qualityLevel: 'low' | 'medium' | 'high';
}> => {
  const detector = DeviceCapabilityDetector.getInstance();
  const capabilities = await detector.detectCapabilities();

  if (capabilities.performanceLevel === 'low' || capabilities.isLowPowerDevice) {
    return {
      targetFPS: 24,
      maxParticles: 50,
      enableEffects: false,
      enableGlow: false,
      qualityLevel: 'low'
    };
  } else if (capabilities.performanceLevel === 'medium') {
    return {
      targetFPS: 30,
      maxParticles: 150,
      enableEffects: true,
      enableGlow: false,
      qualityLevel: 'medium'
    };
  } else {
    return {
      targetFPS: 60,
      maxParticles: 300,
      enableEffects: true,
      enableGlow: true,
      qualityLevel: 'high'
    };
  }
};