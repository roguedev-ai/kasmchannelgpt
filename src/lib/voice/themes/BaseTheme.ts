/**
 * Base Theme Class
 * 
 * Provides common functionality and structure for all voice themes.
 * Themes can extend this class to inherit shared behavior.
 */

import { IVoiceTheme, VoiceState, PerformanceSettings } from './IVoiceTheme';
import { PerformanceMonitor, DeviceCapabilityDetector } from '../utils/performance';
import { ThemePerformanceManager, LODSettings } from './PerformanceOptimizations';
import { lerp, clamp } from '../utils/math';

export abstract class BaseTheme implements IVoiceTheme {
  // Abstract properties that must be implemented
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly description: string;
  abstract readonly category: 'particle' | 'geometric' | 'advanced' | 'artistic';
  abstract readonly performanceProfile: 'light' | 'medium' | 'heavy';

  // Common state management
  protected currentState: VoiceState = VoiceState.IDLE;
  protected targetState: VoiceState = VoiceState.IDLE;
  protected stateTransition = 0;
  protected stateTransitionSpeed = 0.1;

  // Mouse/touch interaction
  protected mouseX = 0;
  protected mouseY = 0;
  protected normalizedMouseX = 0; // -1 to 1
  protected normalizedMouseY = 0; // -1 to 1
  protected mouseInfluence = 0;
  protected targetMouseInfluence = 0;
  protected isHovering = false;

  // Canvas context and dimensions
  protected context: CanvasRenderingContext2D | null = null;
  protected canvasWidth = 0;
  protected canvasHeight = 0;
  protected centerX = 0;
  protected centerY = 0;

  // Performance monitoring
  protected performanceMonitor: PerformanceMonitor;
  protected performanceManager: ThemePerformanceManager | null = null;
  protected performanceSettings: PerformanceSettings;
  protected currentLODSettings: LODSettings | null = null;
  protected lastFrameTime = 0;

  // Animation timing
  protected animationTime = 0;
  protected deltaTimeAccumulator = 0;

  constructor() {
    this.performanceMonitor = new PerformanceMonitor();
    
    // Default performance settings (will be overridden by capability detection)
    this.performanceSettings = {
      targetFPS: 30,
      maxParticles: 100,
      enableEffects: true,
      enableGlow: false,
      qualityLevel: 'medium'
    };

    this.initializePerformanceCallbacks();
  }

  /**
   * Initialize the theme with canvas context and dimensions
   */
  init(context: CanvasRenderingContext2D, width: number, height: number): void {
    this.context = context;
    this.updateDimensions(width, height);
    this.initializePerformanceManager();
    this.setupPerformanceSettings();
    this.onInit();
  }

  /**
   * Update canvas dimensions
   */
  protected updateDimensions(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
    
    // Update performance manager with new dimensions
    if (this.performanceManager) {
      this.performanceManager.getManagers().culler.updateBounds(width, height);
    }
  }

  /**
   * Main drawing function called every frame
   */
  draw(
    context: CanvasRenderingContext2D,
    displayWidth: number,
    displayHeight: number,
    projCenterX: number,
    projCenterY: number,
    deltaTime: number
  ): void {
    // Update performance monitoring
    const metrics = this.performanceMonitor.update();
    
    // Update performance manager and check if we should render
    if (this.performanceManager) {
      const perfUpdate = this.performanceManager.update(metrics, displayWidth, displayHeight);
      this.currentLODSettings = perfUpdate.lodSettings;
      
      // Skip rendering if performance manager suggests it
      if (!perfUpdate.shouldRender) {
        return;
      }
    }
    
    // Update dimensions if changed
    if (this.canvasWidth !== displayWidth || this.canvasHeight !== displayHeight) {
      this.updateDimensions(displayWidth, displayHeight);
    }

    // Update animation timing
    this.updateTiming(deltaTime);

    // Update state transitions
    this.updateStateTransition();

    // Update mouse influence
    this.updateMouseInfluence();

    // Clear canvas with theme-specific background
    this.clearCanvas(context, displayWidth, displayHeight);

    // Delegate to theme-specific drawing
    this.onDraw(context, displayWidth, displayHeight, projCenterX, projCenterY, deltaTime);

    // Draw performance overlay if enabled
    if (this.shouldShowPerformanceOverlay()) {
      this.drawPerformanceOverlay(context, metrics);
    }
  }

  /**
   * Handle state changes with smooth transitions
   */
  onUserSpeaking(): void {
    this.setTargetState(VoiceState.USER_SPEAKING);
    this.onStateChange(VoiceState.USER_SPEAKING);
  }

  onProcessing(): void {
    this.setTargetState(VoiceState.PROCESSING);
    this.onStateChange(VoiceState.PROCESSING);
  }

  onAiSpeaking(): void {
    this.setTargetState(VoiceState.AI_SPEAKING);
    this.onStateChange(VoiceState.AI_SPEAKING);
  }

  reset(): void {
    this.setTargetState(VoiceState.IDLE);
    this.onStateChange(VoiceState.IDLE);
    this.onReset();
  }

  /**
   * Handle mouse/touch position updates
   */
  setMousePosition(x: number, y: number, canvasWidth: number, canvasHeight: number): void {
    this.mouseX = x;
    this.mouseY = y;
    this.normalizedMouseX = (x / canvasWidth) * 2 - 1; // -1 to 1
    this.normalizedMouseY = (y / canvasHeight) * 2 - 1; // -1 to 1
    this.targetMouseInfluence = this.isHovering ? 1 : 0.3;
    this.onMouseMove(x, y, this.normalizedMouseX, this.normalizedMouseY);
  }

  /**
   * Handle hover state changes
   */
  setHovering(hovering: boolean): void {
    this.isHovering = hovering;
    this.targetMouseInfluence = hovering ? 1 : 0;
    this.onHoverChange(hovering);
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.onDispose();
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    const baseMetrics = this.performanceMonitor.getCurrentMetrics();
    const themeMetrics = this.getThemeSpecificMetrics();
    return { ...baseMetrics, ...themeMetrics };
  }

  // Protected methods for subclasses to override

  /**
   * Theme-specific initialization
   */
  protected onInit(): void {}

  /**
   * Theme-specific drawing logic
   */
  protected abstract onDraw(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    centerX: number,
    centerY: number,
    deltaTime: number
  ): void;

  /**
   * Called when state changes
   */
  protected onStateChange(newState: VoiceState): void {}

  /**
   * Called when reset
   */
  protected onReset(): void {}

  /**
   * Called when mouse moves
   */
  protected onMouseMove(x: number, y: number, normalizedX: number, normalizedY: number): void {}

  /**
   * Called when hover state changes
   */
  protected onHoverChange(hovering: boolean): void {}

  /**
   * Called when disposing
   */
  protected onDispose(): void {}

  /**
   * Get theme-specific performance metrics
   */
  protected getThemeSpecificMetrics(): Record<string, any> {
    return {};
  }

  /**
   * Clear canvas with theme-specific background
   */
  protected clearCanvas(context: CanvasRenderingContext2D, width: number, height: number): void {
    context.clearRect(0, 0, width, height);
  }

  // Private helper methods

  private async setupPerformanceSettings(): Promise<void> {
    try {
      const detector = DeviceCapabilityDetector.getInstance();
      const capabilities = await detector.detectCapabilities();
      
      // Adjust performance settings based on device capabilities
      if (capabilities.performanceLevel === 'low' || capabilities.isLowPowerDevice) {
        this.performanceSettings = {
          targetFPS: 24,
          maxParticles: this.getOptimalParticleCount('low'),
          enableEffects: false,
          enableGlow: false,
          qualityLevel: 'low'
        };
      } else if (capabilities.performanceLevel === 'medium') {
        this.performanceSettings = {
          targetFPS: 30,
          maxParticles: this.getOptimalParticleCount('medium'),
          enableEffects: true,
          enableGlow: false,
          qualityLevel: 'medium'
        };
      } else {
        this.performanceSettings = {
          targetFPS: 60,
          maxParticles: this.getOptimalParticleCount('high'),
          enableEffects: true,
          enableGlow: true,
          qualityLevel: 'high'
        };
      }
    } catch (error) {
      console.warn('Failed to detect device capabilities, using default settings:', error);
    }
  }

  private initializePerformanceManager(): void {
    this.performanceManager = new ThemePerformanceManager(this.canvasWidth, this.canvasHeight);
  }

  private getOptimalParticleCount(quality: 'low' | 'medium' | 'high'): number {
    const baseCount = {
      light: { low: 30, medium: 80, high: 150 },
      medium: { low: 50, medium: 120, high: 250 },
      heavy: { low: 20, medium: 60, high: 120 }
    };

    return baseCount[this.performanceProfile][quality];
  }

  private initializePerformanceCallbacks(): void {
    this.performanceMonitor.setCallbacks({
      onPerformanceWarning: (metrics) => {
        console.warn(`[${this.id}] Performance warning:`, metrics);
        this.adjustPerformanceSettings(0.8);
      },
      onPerformanceCritical: (metrics) => {
        console.error(`[${this.id}] Critical performance:`, metrics);
        this.adjustPerformanceSettings(0.6);
      }
    });
  }

  private adjustPerformanceSettings(factor: number): void {
    this.performanceSettings.maxParticles = Math.floor(this.performanceSettings.maxParticles * factor);
    this.performanceSettings.enableEffects = false;
    this.performanceSettings.enableGlow = false;
  }

  private setTargetState(state: VoiceState): void {
    if (this.targetState !== state) {
      this.targetState = state;
      this.stateTransition = 0;
    }
  }

  private updateStateTransition(): void {
    if (this.currentState !== this.targetState) {
      this.stateTransition += this.stateTransitionSpeed;
      if (this.stateTransition >= 1) {
        this.currentState = this.targetState;
        this.stateTransition = 1;
      }
    }
  }

  private updateMouseInfluence(): void {
    this.mouseInfluence = lerp(this.mouseInfluence, this.targetMouseInfluence, 0.1);
  }

  private updateTiming(deltaTime: number): void {
    this.deltaTimeAccumulator += deltaTime;
    this.animationTime += deltaTime;
  }

  private shouldShowPerformanceOverlay(): boolean {
    // Only show in development or when explicitly enabled
    return process.env.NODE_ENV === 'development' && 
           localStorage.getItem('voice-performance-overlay') === 'true';
  }

  private drawPerformanceOverlay(context: CanvasRenderingContext2D, metrics: any): void {
    context.save();
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(10, 10, 200, 80);
    context.fillStyle = 'white';
    context.font = '12px monospace';
    context.fillText(`Theme: ${this.name}`, 15, 25);
    context.fillText(`FPS: ${Math.round(metrics.fps)}`, 15, 40);
    context.fillText(`Frame: ${Math.round(metrics.frameTime)}ms`, 15, 55);
    context.fillText(`State: ${this.currentState}`, 15, 70);
    context.fillText(`Mouse: ${Math.round(this.mouseInfluence * 100)}%`, 15, 85);
    context.restore();
  }

  // Protected utility methods for subclasses

  /**
   * Get color interpolated between states
   */
  protected getStateColor(idleColor: string, activeColor: string): string {
    if (this.stateTransition === 0) return idleColor;
    if (this.stateTransition === 1) return activeColor;
    
    // Simple color interpolation (for more complex colors, use Color class)
    return activeColor; // Simplified for now
  }

  /**
   * Get value interpolated by mouse influence
   */
  protected getMouseInfluencedValue(baseValue: number, influencedValue: number): number {
    return lerp(baseValue, influencedValue, this.mouseInfluence);
  }

  /**
   * Check if effects should be enabled based on performance settings
   */
  protected shouldEnableEffects(): boolean {
    if (this.currentLODSettings) {
      return !this.currentLODSettings.effectsDisabled;
    }
    return this.performanceSettings.enableEffects;
  }

  /**
   * Check if glow effects should be enabled
   */
  protected shouldEnableGlow(): boolean {
    if (this.currentLODSettings) {
      return !this.currentLODSettings.glowDisabled;
    }
    return this.performanceSettings.enableGlow;
  }

  /**
   * Get maximum particle count for performance
   */
  protected getMaxParticles(): number {
    const baseMax = this.performanceSettings.maxParticles;
    if (this.currentLODSettings) {
      return Math.floor(baseMax * (1 - this.currentLODSettings.particleReduction));
    }
    return baseMax;
  }

  /**
   * Get current LOD level for theme-specific optimizations
   */
  protected getCurrentLODLevel(): number {
    return this.currentLODSettings?.level || 1;
  }

  /**
   * Check if simplified rendering should be used
   */
  protected shouldUseSimplifiedRendering(): boolean {
    return this.currentLODSettings?.simplifiedRendering || false;
  }

  /**
   * Get performance managers for advanced optimizations
   */
  protected getPerformanceManagers() {
    return this.performanceManager?.getManagers() || null;
  }

  /**
   * Check if a particle is visible (for culling)
   */
  protected isParticleVisible(x: number, y: number, z = 0, size = 0): boolean {
    const managers = this.getPerformanceManagers();
    if (managers?.culler) {
      return managers.culler.isVisible(x, y, z, size);
    }
    return true; // No culling available, assume visible
  }

  /**
   * Filter particles to only visible ones
   */
  protected cullParticles<T extends { x: number; y: number; z?: number; size?: number }>(particles: T[]): T[] {
    const managers = this.getPerformanceManagers();
    if (managers?.culler) {
      return managers.culler.cullParticles(particles);
    }
    return particles; // No culling available, return all
  }

  /**
   * Add particle to batch renderer for optimized drawing
   */
  protected addToBatch(
    color: string,
    x: number,
    y: number, 
    size: number,
    alpha: number,
    glowEnabled = false,
    effectsEnabled = false
  ): void {
    const managers = this.getPerformanceManagers();
    if (managers?.batchRenderer) {
      managers.batchRenderer.addToBatch(color, x, y, size, alpha, glowEnabled, effectsEnabled);
    }
  }

  /**
   * Render all batches (call at end of draw)
   */
  protected renderBatches(context: CanvasRenderingContext2D): void {
    const managers = this.getPerformanceManagers();
    if (managers?.batchRenderer && this.currentLODSettings) {
      managers.batchRenderer.renderBatches(context, this.currentLODSettings);
      managers.batchRenderer.clearBatches();
    }
  }
}