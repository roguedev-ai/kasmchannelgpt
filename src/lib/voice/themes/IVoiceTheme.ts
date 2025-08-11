/**
 * Voice Theme Interface
 * 
 * Defines the contract that all voice interaction themes must implement.
 * Each theme provides unique visual feedback for different voice states.
 */

export interface IVoiceTheme {
  /**
   * Unique identifier for the theme
   */
  readonly id: string;

  /**
   * Display name for the theme
   */
  readonly name: string;

  /**
   * Theme description
   */
  readonly description: string;

  /**
   * Theme category for UI organization
   */
  readonly category: 'particle' | 'geometric' | 'advanced' | 'artistic';

  /**
   * Performance profile for mobile optimization
   */
  readonly performanceProfile: 'light' | 'medium' | 'heavy';

  /**
   * Initialize the theme with canvas context and dimensions
   */
  init(context: CanvasRenderingContext2D, width: number, height: number): void;

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
  ): void;

  /**
   * User is speaking state
   */
  onUserSpeaking(): void;

  /**
   * Processing/analyzing speech state
   */
  onProcessing(): void;

  /**
   * AI is responding state
   */
  onAiSpeaking(): void;

  /**
   * Reset to idle state
   */
  reset(): void;

  /**
   * Handle mouse/touch position updates
   */
  setMousePosition(x: number, y: number, canvasWidth: number, canvasHeight: number): void;

  /**
   * Handle mouse/touch hover state
   */
  setHovering(hovering: boolean): void;

  /**
   * Cleanup resources when theme is deactivated
   */
  dispose(): void;

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics(): {
    particleCount?: number;
    objectCount?: number;
    memoryUsage?: number;
    averageFPS?: number;
  };
}

/**
 * Theme metadata for UI display
 */
export interface ThemeMetadata {
  id: string;
  name: string;
  description: string;
  category: string;
  performanceProfile: string;
  previewColors: string[];
  previewDescription: string;
}

/**
 * Voice state enumeration
 */
export enum VoiceState {
  IDLE = 'idle',
  USER_SPEAKING = 'userSpeaking',
  PROCESSING = 'processing',
  AI_SPEAKING = 'aiSpeaking'
}

/**
 * Performance settings for different device types
 */
export interface PerformanceSettings {
  targetFPS: number;
  maxParticles: number;
  enableEffects: boolean;
  enableGlow: boolean;
  qualityLevel: 'low' | 'medium' | 'high';
}

/**
 * Theme factory function type
 */
export type ThemeFactory = () => IVoiceTheme;