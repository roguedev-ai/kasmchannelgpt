/**
 * Performance Optimizations for Voice Themes
 * 
 * Advanced performance optimizations including LOD system, render culling,
 * batch rendering, and memory management for maintaining 30+ FPS on all devices.
 */

import { PerformanceMetrics, DeviceCapabilities } from '../utils/performance';

export interface LODSettings {
  level: 0 | 1 | 2; // 0 = high, 1 = medium, 2 = low
  particleReduction: number; // 0-1, percentage reduction
  effectsDisabled: boolean;
  glowDisabled: boolean;
  simplifiedRendering: boolean;
  skipFrames: number; // Skip every N frames for heavy operations
}

export interface CullingBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  near?: number;
  far?: number;
}

export interface RenderBatch {
  color: string;
  particles: Array<{ x: number; y: number; size: number; alpha: number }>;
  glowEnabled: boolean;
  effectsEnabled: boolean;
}

/**
 * Level-of-Detail Manager for Performance Scaling
 */
export class LODManager {
  private currentLOD: LODSettings;
  private frameCount = 0;
  private lastPerformanceCheck = 0;
  private performanceHistory: number[] = [];
  
  private lodProfiles: Record<number, LODSettings> = {
    0: { // High quality
      level: 0,
      particleReduction: 0,
      effectsDisabled: false,
      glowDisabled: false,
      simplifiedRendering: false,
      skipFrames: 0
    },
    1: { // Medium quality
      level: 1,
      particleReduction: 0.3,
      effectsDisabled: false,
      glowDisabled: true,
      simplifiedRendering: false,
      skipFrames: 1
    },
    2: { // Low quality
      level: 2,
      particleReduction: 0.6,
      effectsDisabled: true,
      glowDisabled: true,
      simplifiedRendering: true,
      skipFrames: 2
    }
  };

  constructor(initialLOD = 1) {
    this.currentLOD = this.lodProfiles[initialLOD];
  }

  /**
   * Update LOD based on performance metrics
   */
  updateLOD(metrics: PerformanceMetrics): LODSettings {
    this.frameCount++;
    
    // Check performance every 30 frames (0.5 seconds at 60fps)
    if (this.frameCount - this.lastPerformanceCheck >= 30) {
      this.performanceHistory.push(metrics.fps);
      
      // Keep only last 5 measurements (2.5 seconds)
      if (this.performanceHistory.length > 5) {
        this.performanceHistory.shift();
      }
      
      const avgFPS = this.performanceHistory.reduce((sum, fps) => sum + fps, 0) / this.performanceHistory.length;
      this.adjustLODBasedOnFPS(avgFPS);
      
      this.lastPerformanceCheck = this.frameCount;
    }
    
    return this.currentLOD;
  }

  private adjustLODBasedOnFPS(avgFPS: number): void {
    const targetFPS = 30;
    
    if (avgFPS < targetFPS * 0.7 && this.currentLOD.level < 2) {
      // Performance is poor, reduce quality
      this.currentLOD = this.lodProfiles[Math.min(2, this.currentLOD.level + 1)];
      console.log(`[LOD] Reducing quality to level ${this.currentLOD.level} (FPS: ${avgFPS.toFixed(1)})`);
    } else if (avgFPS > targetFPS * 1.2 && this.currentLOD.level > 0) {
      // Performance is good, can increase quality
      this.currentLOD = this.lodProfiles[Math.max(0, this.currentLOD.level - 1)];
      console.log(`[LOD] Increasing quality to level ${this.currentLOD.level} (FPS: ${avgFPS.toFixed(1)})`);
    }
  }

  getCurrentLOD(): LODSettings {
    return this.currentLOD;
  }

  shouldSkipFrame(): boolean {
    return this.currentLOD.skipFrames > 0 && 
           this.frameCount % (this.currentLOD.skipFrames + 1) !== 0;
  }
}

/**
 * Frustum Culling for Off-screen Particle Elimination
 */
export class FrustumCuller {
  private bounds!: CullingBounds;
  private margin = 50; // Extra margin to prevent pop-in
  
  constructor(width: number, height: number, margin = 50) {
    this.margin = margin;
    this.updateBounds(width, height);
  }

  updateBounds(width: number, height: number): void {
    this.bounds = {
      left: -this.margin,
      right: width + this.margin,
      top: -this.margin,
      bottom: height + this.margin,
      near: -200,
      far: 200
    };
  }

  /**
   * Check if a particle is within visible bounds
   */
  isVisible(x: number, y: number, z = 0, size = 0): boolean {
    return (
      x + size >= this.bounds.left &&
      x - size <= this.bounds.right &&
      y + size >= this.bounds.top &&
      y - size <= this.bounds.bottom &&
      (this.bounds.near === undefined || z >= this.bounds.near) &&
      (this.bounds.far === undefined || z <= this.bounds.far)
    );
  }

  /**
   * Filter array of particles to only visible ones
   */
  cullParticles<T extends { x: number; y: number; z?: number; size?: number }>(particles: T[]): T[] {
    return particles.filter(particle => 
      this.isVisible(
        particle.x, 
        particle.y, 
        particle.z || 0, 
        particle.size || 0
      )
    );
  }

  /**
   * Get culling statistics
   */
  getCullingStats<T extends { x: number; y: number }>(particles: T[]): {
    total: number;
    visible: number;
    culled: number;
    cullingRatio: number;
  } {
    const visible = this.cullParticles(particles);
    const culled = particles.length - visible.length;
    
    return {
      total: particles.length,
      visible: visible.length,
      culled,
      cullingRatio: particles.length > 0 ? culled / particles.length : 0
    };
  }
}

/**
 * Batch Renderer for Optimized Drawing
 */
export class BatchRenderer {
  private batches: Map<string, RenderBatch> = new Map();
  private maxBatchSize = 1000;
  
  /**
   * Add particle to appropriate batch
   */
  addToBatch(
    color: string, 
    x: number, 
    y: number, 
    size: number, 
    alpha: number,
    glowEnabled = false,
    effectsEnabled = false
  ): void {
    const batchKey = `${color}_${glowEnabled}_${effectsEnabled}`;
    
    if (!this.batches.has(batchKey)) {
      this.batches.set(batchKey, {
        color,
        particles: [],
        glowEnabled,
        effectsEnabled
      });
    }
    
    const batch = this.batches.get(batchKey)!;
    if (batch.particles.length < this.maxBatchSize) {
      batch.particles.push({ x, y, size, alpha });
    }
  }

  /**
   * Render all batches efficiently
   */
  renderBatches(context: CanvasRenderingContext2D, lodSettings: LODSettings): void {
    Array.from(this.batches.entries()).forEach(([batchKey, batch]) => {
      if (batch.particles.length === 0) return;
      
      context.save();
      context.fillStyle = batch.color;
      
      // Skip effects if disabled by LOD
      const shouldRenderEffects = batch.effectsEnabled && !lodSettings.effectsDisabled;
      const shouldRenderGlow = batch.glowEnabled && !lodSettings.glowDisabled;
      
      if (lodSettings.simplifiedRendering) {
        // Simplified rendering: draw all particles as simple circles
        this.renderSimplifiedBatch(context, batch);
      } else {
        // Full rendering: individual particles with effects
        this.renderFullBatch(context, batch, shouldRenderEffects, shouldRenderGlow);
      }
      
      context.restore();
    });
  }

  private renderSimplifiedBatch(context: CanvasRenderingContext2D, batch: RenderBatch): void {
    context.beginPath();
    batch.particles.forEach(particle => {
      context.globalAlpha = particle.alpha;
      context.moveTo(particle.x + particle.size, particle.y);
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
    });
    context.fill();
  }

  private renderFullBatch(
    context: CanvasRenderingContext2D, 
    batch: RenderBatch,
    renderEffects: boolean,
    renderGlow: boolean
  ): void {
    batch.particles.forEach(particle => {
      context.save();
      context.globalAlpha = particle.alpha;
      
      // Render glow first if enabled
      if (renderGlow && particle.alpha > 0.5) {
        const glowGradient = context.createRadialGradient(
          particle.x, particle.y, 0,
          particle.x, particle.y, particle.size * 3
        );
        glowGradient.addColorStop(0, batch.color);
        glowGradient.addColorStop(1, 'transparent');
        
        context.fillStyle = glowGradient;
        context.globalAlpha = particle.alpha * 0.3;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size * 3, 0, Math.PI * 2);
        context.fill();
      }
      
      // Render main particle
      context.globalAlpha = particle.alpha;
      context.fillStyle = batch.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
      
      context.restore();
    });
  }

  /**
   * Clear all batches
   */
  clearBatches(): void {
    Array.from(this.batches.values()).forEach(batch => {
      batch.particles = [];
    });
  }

  /**
   * Get batch statistics
   */
  getBatchStats(): {
    batchCount: number;
    totalParticles: number;
    avgBatchSize: number;
    largestBatch: number;
  } {
    const batchCount = this.batches.size;
    let totalParticles = 0;
    let largestBatch = 0;
    
    Array.from(this.batches.values()).forEach(batch => {
      totalParticles += batch.particles.length;
      largestBatch = Math.max(largestBatch, batch.particles.length);
    });
    
    return {
      batchCount,
      totalParticles,
      avgBatchSize: batchCount > 0 ? totalParticles / batchCount : 0,
      largestBatch
    };
  }
}

/**
 * Memory Usage Monitor and Optimizer
 */
export class MemoryOptimizer {
  private lastGCTime = 0;
  private gcInterval = 10000; // 10 seconds
  private memoryPressureThreshold = 0.85; // 85% of heap limit
  
  /**
   * Check memory usage and trigger cleanup if needed
   */
  checkMemoryPressure(): { pressure: number; shouldCleanup: boolean } {
    const currentTime = performance.now();
    let pressure = 0;
    let shouldCleanup = false;
    
    // Check if memory API is available
    if ('memory' in (performance as any)) {
      const memInfo = (performance as any).memory;
      pressure = memInfo.usedJSHeapSize / memInfo.jsHeapSizeLimit;
      shouldCleanup = pressure > this.memoryPressureThreshold;
    }
    
    // Force cleanup based on time interval
    if (currentTime - this.lastGCTime > this.gcInterval) {
      shouldCleanup = true;
      this.lastGCTime = currentTime;
    }
    
    return { pressure, shouldCleanup };
  }

  /**
   * Suggest memory optimization actions
   */
  getOptimizationSuggestions(pressure: number): {
    reduceParticles: boolean;
    clearCaches: boolean;
    disableEffects: boolean;
    simplifyRendering: boolean;
  } {
    return {
      reduceParticles: pressure > 0.7,
      clearCaches: pressure > 0.8,
      disableEffects: pressure > 0.75,
      simplifyRendering: pressure > 0.85
    };
  }
}

/**
 * Animation Frame Controller for Battery Optimization
 */
export class AnimationController {
  private isVisible = true;
  private targetFPS = 30;
  private actualInterval = 1000 / 30; // ~33ms
  private lastFrameTime = 0;
  private frameBudget = 16.67; // ~60fps budget, but we target lower
  
  constructor(targetFPS = 30) {
    this.setTargetFPS(targetFPS);
    this.setupVisibilityHandling();
  }

  /**
   * Set target FPS and update timing
   */
  setTargetFPS(fps: number): void {
    this.targetFPS = Math.max(10, Math.min(60, fps)); // Clamp between 10-60
    this.actualInterval = 1000 / this.targetFPS;
  }

  /**
   * Check if frame should be rendered
   */
  shouldRenderFrame(): boolean {
    if (!this.isVisible) return false;
    
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    
    if (deltaTime >= this.actualInterval) {
      this.lastFrameTime = currentTime;
      return true;
    }
    
    return false;
  }

  /**
   * Get frame timing info
   */
  getFrameTiming(): {
    targetFPS: number;
    interval: number;
    isVisible: boolean;
    shouldThrottle: boolean;
  } {
    return {
      targetFPS: this.targetFPS,
      interval: this.actualInterval,
      isVisible: this.isVisible,
      shouldThrottle: !this.isVisible || this.targetFPS < 30
    };
  }

  private setupVisibilityHandling(): void {
    // Handle page visibility for battery optimization
    document.addEventListener('visibilitychange', () => {
      this.isVisible = !document.hidden;
      
      // Reduce FPS when not visible
      if (!this.isVisible) {
        this.setTargetFPS(10); // Very low FPS when hidden
      } else {
        this.setTargetFPS(30); // Normal FPS when visible
      }
    });
    
    // Handle focus/blur for additional optimization
    window.addEventListener('focus', () => {
      this.isVisible = true;
      this.setTargetFPS(30);
    });
    
    window.addEventListener('blur', () => {
      this.setTargetFPS(20); // Reduced but not hidden
    });
  }
}

/**
 * Complete Performance Optimization Suite
 */
export class ThemePerformanceManager {
  private lodManager: LODManager;
  private culler: FrustumCuller;
  private batchRenderer: BatchRenderer;
  private memoryOptimizer: MemoryOptimizer;
  private animationController: AnimationController;
  
  constructor(canvasWidth: number, canvasHeight: number) {
    this.lodManager = new LODManager();
    this.culler = new FrustumCuller(canvasWidth, canvasHeight);
    this.batchRenderer = new BatchRenderer();
    this.memoryOptimizer = new MemoryOptimizer();
    this.animationController = new AnimationController();
  }

  /**
   * Update all performance systems
   */
  update(metrics: PerformanceMetrics, canvasWidth?: number, canvasHeight?: number): {
    lodSettings: LODSettings;
    shouldRender: boolean;
    memoryPressure: number;
    optimizationActive: boolean;
  } {
    // Update LOD based on performance
    const lodSettings = this.lodManager.updateLOD(metrics);
    
    // Update culling bounds if canvas size changed
    if (canvasWidth && canvasHeight) {
      this.culler.updateBounds(canvasWidth, canvasHeight);
    }
    
    // Check memory pressure
    const { pressure, shouldCleanup } = this.memoryOptimizer.checkMemoryPressure();
    
    // Check if we should render this frame
    const shouldRender = this.animationController.shouldRenderFrame() && !this.lodManager.shouldSkipFrame();
    
    return {
      lodSettings,
      shouldRender,
      memoryPressure: pressure,
      optimizationActive: lodSettings.level > 0 || pressure > 0.7 || !shouldRender
    };
  }

  /**
   * Get all performance managers for direct access
   */
  getManagers() {
    return {
      lod: this.lodManager,
      culler: this.culler,
      batchRenderer: this.batchRenderer,
      memory: this.memoryOptimizer,
      animation: this.animationController
    };
  }

  /**
   * Get comprehensive performance report
   */
  getPerformanceReport(): {
    lod: LODSettings;
    culling: any;
    batching: any;
    memory: { pressure: number; shouldCleanup: boolean };
    animation: any;
  } {
    const { pressure, shouldCleanup } = this.memoryOptimizer.checkMemoryPressure();
    
    return {
      lod: this.lodManager.getCurrentLOD(),
      culling: {}, // Will be populated when particles are processed
      batching: this.batchRenderer.getBatchStats(),
      memory: { pressure, shouldCleanup },
      animation: this.animationController.getFrameTiming()
    };
  }
}