/**
 * Theme Manager
 * 
 * Orchestrates theme switching, loading, and lifecycle management.
 * Provides centralized access to all available voice themes.
 */

import { IVoiceTheme, ThemeMetadata, ThemeFactory, VoiceState } from './IVoiceTheme';

export interface ThemeTransitionOptions {
  duration: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  crossfade: boolean;
}

export interface ThemeRegistration {
  id: string;
  factory: ThemeFactory;
  metadata: ThemeMetadata;
}

/**
 * Theme Manager - Singleton class for managing voice themes
 */
export class ThemeManager {
  private static instance: ThemeManager;
  private registeredThemes: Map<string, ThemeRegistration> = new Map();
  private currentTheme: IVoiceTheme | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  
  // Transition state
  private isTransitioning = false;
  private transitionTheme: IVoiceTheme | null = null;
  private transitionProgress = 0;
  private transitionOptions: ThemeTransitionOptions = {
    duration: 1000,
    easing: 'ease-in-out',
    crossfade: true
  };

  // Event callbacks
  private callbacks: {
    onThemeChange?: (oldTheme: string | null, newTheme: string) => void;
    onTransitionStart?: (from: string | null, to: string) => void;
    onTransitionComplete?: (themeId: string) => void;
    onThemeError?: (error: Error, themeId: string) => void;
  } = {};

  private constructor() {
    this.registerBuiltInThemes();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager();
    }
    return ThemeManager.instance;
  }

  /**
   * Initialize with canvas context
   */
  initialize(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): void {
    this.canvas = canvas;
    this.context = context;
    
    // Initialize current theme if one is set
    if (this.currentTheme && this.context) {
      this.currentTheme.init(this.context, canvas.width, canvas.height);
    }
  }

  /**
   * Register a new theme
   */
  registerTheme(registration: ThemeRegistration): void {
    if (this.registeredThemes.has(registration.id)) {
      console.warn(`Theme ${registration.id} is already registered. Overwriting.`);
    }
    
    this.registeredThemes.set(registration.id, registration);
    console.log(`Registered theme: ${registration.id}`);
  }

  /**
   * Unregister a theme
   */
  unregisterTheme(themeId: string): boolean {
    if (this.currentTheme?.id === themeId) {
      console.warn(`Cannot unregister active theme: ${themeId}`);
      return false;
    }
    
    return this.registeredThemes.delete(themeId);
  }

  /**
   * Get all available themes metadata
   */
  getAvailableThemes(): ThemeMetadata[] {
    return Array.from(this.registeredThemes.values()).map(reg => reg.metadata);
  }

  /**
   * Get theme metadata by ID
   */
  getThemeMetadata(themeId: string): ThemeMetadata | null {
    const registration = this.registeredThemes.get(themeId);
    return registration ? registration.metadata : null;
  }

  /**
   * Switch to a new theme
   */
  async switchTheme(themeId: string, transitionOptions?: Partial<ThemeTransitionOptions>): Promise<boolean> {
    if (this.isTransitioning) {
      console.warn('Theme transition already in progress');
      return false;
    }

    const registration = this.registeredThemes.get(themeId);
    if (!registration) {
      const error = new Error(`Theme not found: ${themeId}`);
      this.callbacks.onThemeError?.(error, themeId);
      return false;
    }

    // If this is the current theme, no need to switch
    if (this.currentTheme?.id === themeId) {
      return true;
    }

    try {
      // Update transition options
      this.transitionOptions = { ...this.transitionOptions, ...transitionOptions };

      // Create new theme instance
      const newTheme = registration.factory();
      
      // Initialize with current context if available
      if (this.context && this.canvas) {
        newTheme.init(this.context, this.canvas.width, this.canvas.height);
      }

      // Start transition
      await this.performThemeTransition(newTheme);
      
      return true;
    } catch (error) {
      console.error(`Failed to switch to theme ${themeId}:`, error);
      this.callbacks.onThemeError?.(error as Error, themeId);
      return false;
    }
  }

  /**
   * Get current active theme
   */
  getCurrentTheme(): IVoiceTheme | null {
    return this.currentTheme;
  }

  /**
   * Get current theme ID
   */
  getCurrentThemeId(): string | null {
    return this.currentTheme?.id || null;
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: Partial<typeof this.callbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Draw current theme (delegated from Canvas component)
   */
  draw(
    context: CanvasRenderingContext2D,
    displayWidth: number,
    displayHeight: number,
    projCenterX: number,
    projCenterY: number,
    deltaTime: number
  ): void {
    if (this.isTransitioning && this.transitionOptions.crossfade) {
      this.drawTransition(context, displayWidth, displayHeight, projCenterX, projCenterY, deltaTime);
    } else if (this.currentTheme) {
      this.currentTheme.draw(context, displayWidth, displayHeight, projCenterX, projCenterY, deltaTime);
    }
  }

  /**
   * Forward state changes to current theme
   */
  onUserSpeaking(): void {
    this.currentTheme?.onUserSpeaking();
    this.transitionTheme?.onUserSpeaking();
  }

  onProcessing(): void {
    this.currentTheme?.onProcessing();
    this.transitionTheme?.onProcessing();
  }

  onAiSpeaking(): void {
    this.currentTheme?.onAiSpeaking();
    this.transitionTheme?.onAiSpeaking();
  }

  reset(): void {
    this.currentTheme?.reset();
    this.transitionTheme?.reset();
  }

  /**
   * Forward mouse events to current theme
   */
  setMousePosition(x: number, y: number, canvasWidth: number, canvasHeight: number): void {
    this.currentTheme?.setMousePosition(x, y, canvasWidth, canvasHeight);
    this.transitionTheme?.setMousePosition(x, y, canvasWidth, canvasHeight);
  }

  setHovering(hovering: boolean): void {
    this.currentTheme?.setHovering(hovering);
    this.transitionTheme?.setHovering(hovering);
  }

  /**
   * Get performance metrics from current theme
   */
  getPerformanceMetrics() {
    return this.currentTheme?.getPerformanceMetrics() || {};
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.currentTheme?.dispose();
    this.transitionTheme?.dispose();
    this.currentTheme = null;
    this.transitionTheme = null;
    this.isTransitioning = false;
  }

  // Private methods

  /**
   * Register built-in themes
   */
  private registerBuiltInThemes(): void {
    // Import themes dynamically to avoid circular dependencies
    import('./DefaultTheme').then(({ DefaultTheme }) => {
      this.registerTheme({
        id: 'default',
        factory: () => new DefaultTheme(),
        metadata: {
          id: 'default',
          name: 'Classic Sphere',
          description: 'The original 3D particle sphere with smooth color transitions',
          category: 'particle',
          performanceProfile: 'medium',
          previewColors: ['#4285F4', '#34A853', '#EA4335'],
          previewDescription: 'Rotating particle sphere with dynamic colors'
        }
      });
    });

    import('./StarfieldTheme').then(({ StarfieldTheme }) => {
      this.registerTheme({
        id: 'starfield',
        factory: () => new StarfieldTheme(),
        metadata: {
          id: 'starfield',
          name: 'Cosmic Starfield',
          description: 'Twinkling stars, dynamic constellations, and flowing nebula clouds',
          category: 'particle',
          performanceProfile: 'medium',
          previewColors: ['#FFFFFF', '#ADD8E6', '#FFD700', '#FFC0CB'],
          previewDescription: 'Immersive space environment with stars and constellations'
        }
      });
    });

    import('./JarvisTheme').then(({ JarvisTheme }) => {
      this.registerTheme({
        id: 'jarvis',
        factory: () => new JarvisTheme(),
        metadata: {
          id: 'jarvis',
          name: 'J.A.R.V.I.S.',
          description: 'Advanced AI interface with arc reactor, HUD elements, and energy particles',
          category: 'advanced',
          performanceProfile: 'heavy',
          previewColors: ['#00A2E8', '#00FFFF', '#FF6500', '#FF00FF'],
          previewDescription: 'Iron Man-inspired technological interface with arc reactor'
        }
      });
    });

    import('./LegoTheme').then(({ LegoTheme }) => {
      this.registerTheme({
        id: 'lego',
        factory: () => new LegoTheme(),
        metadata: {
          id: 'lego',
          name: 'LEGO Blocks',
          description: '3D building blocks that construct and deconstruct with satisfying physics',
          category: 'artistic',
          performanceProfile: 'medium',
          previewColors: ['#C4281C', '#0D69AB', '#12852B', '#F5CD2F'],
          previewDescription: 'Interactive LEGO blocks building structures with authentic colors'
        }
      });
    });

    import('./StarWarsTheme').then(({ StarWarsTheme }) => {
      this.registerTheme({
        id: 'starwars',
        factory: () => new StarWarsTheme(),
        metadata: {
          id: 'starwars',
          name: 'Star Wars',
          description: 'Lightsabers, holograms, and the Force in a galaxy far, far away',
          category: 'advanced',
          performanceProfile: 'heavy',
          previewColors: ['#00A2FF', '#FF0000', '#00FF00', '#9333EA'],
          previewDescription: 'Epic Star Wars experience with lightsabers and hologram effects'
        }
      });
    });

    import('./OceanWaveTheme').then(({ OceanWaveTheme }) => {
      this.registerTheme({
        id: 'ocean',
        factory: () => new OceanWaveTheme(),
        metadata: {
          id: 'ocean',
          name: 'Ocean Waves',
          description: 'Calming underwater environment with waves, bubbles, and marine life',
          category: 'particle',
          performanceProfile: 'medium',
          previewColors: ['#0077BE', '#00BCF2', '#C8E6FF', '#98CB3B'],
          previewDescription: 'Serene ocean experience with realistic wave physics and bubbles'
        }
      });
    });

    import('./NFTTheme').then(({ NFTTheme }) => {
      this.registerTheme({
        id: 'nft',
        factory: () => new NFTTheme(),
        metadata: {
          id: 'nft',
          name: 'NFT Art',
          description: 'Vibrant digital art with morphing shapes, dynamic gradients, and artistic trails',
          category: 'artistic',
          performanceProfile: 'heavy',
          previewColors: ['#FF00FF', '#00FFFF', '#FFFF00', '#8000FF', '#FF0080'],
          previewDescription: 'Bold NFT-style aesthetics with morphing geometric shapes'
        }
      });
    });

    import('./NothingPhoneTheme').then(({ NothingPhoneTheme }) => {
      this.registerTheme({
        id: 'nothing',
        factory: () => new NothingPhoneTheme(),
        metadata: {
          id: 'nothing',
          name: 'Nothing Phone',
          description: 'Minimalist design inspired by Nothing Phone with clean dots and typography',
          category: 'artistic',
          performanceProfile: 'light',
          previewColors: ['#FFFFFF', '#F5F5F5', '#C8C8C8', '#808080', '#000000'],
          previewDescription: 'Clean minimalist interface with Glyph-inspired dot patterns'
        }
      });
    });

    import('./MinecraftTheme').then(({ MinecraftTheme }) => {
      this.registerTheme({
        id: 'minecraft',
        factory: () => new MinecraftTheme(),
        metadata: {
          id: 'minecraft',
          name: 'Minecraft',
          description: 'Blocky voxel world with building, breaking, and crafting animations',
          category: 'artistic',
          performanceProfile: 'medium',
          previewColors: ['#7CBD52', '#FEF63F', '#A28A4E', '#63EDE5', '#888888'],
          previewDescription: 'Interactive voxel blocks with authentic Minecraft aesthetics'
        }
      });
    });

    import('./FuturisticTheme').then(({ FuturisticTheme }) => {
      this.registerTheme({
        id: 'futuristic',
        factory: () => new FuturisticTheme(),
        metadata: {
          id: 'futuristic',
          name: 'Futuristic',
          description: 'High-tech cyberpunk interface with holograms, wireframes, and data streams',
          category: 'advanced',
          performanceProfile: 'heavy',
          previewColors: ['#00FFFF', '#FF00FF', '#FFFF00', '#00FF00', '#0096FF'],
          previewDescription: 'Cyberpunk-inspired holographic displays and wireframe models'
        }
      });
    });

    import('./VintageModernTheme').then(({ VintageModernTheme }) => {
      this.registerTheme({
        id: 'vintage-modern',
        factory: () => new VintageModernTheme(),
        metadata: {
          id: 'vintage-modern',
          name: 'Vintage Modern',
          description: 'Retro aesthetics meets modern design with film grain and neon glow',
          category: 'artistic',
          performanceProfile: 'medium',
          previewColors: ['#FF6F91', '#FF9A00', '#ED75FF', '#5FE1FA', '#FFF176'],
          previewDescription: 'Nostalgic blend of retro TV effects with modern animations'
        }
      });
    });

    import('./AuroraTheme').then(({ AuroraTheme }) => {
      this.registerTheme({
        id: 'aurora',
        factory: () => new AuroraTheme(),
        metadata: {
          id: 'aurora',
          name: 'Aurora Borealis',
          description: 'Ethereal northern lights with flowing ribbons and magnetic fields',
          category: 'particle',
          performanceProfile: 'heavy',
          previewColors: ['#00FF00', '#0064FF', '#9300D3', '#FF0064', '#5FE1FA'],
          previewDescription: 'Mesmerizing aurora borealis with realistic light bands'
        }
      });
    });

    console.log('ThemeManager: Built-in themes registered');
  }

  /**
   * Perform theme transition
   */
  private async performThemeTransition(newTheme: IVoiceTheme): Promise<void> {
    const oldTheme = this.currentTheme;
    const oldThemeId = oldTheme?.id || null;
    
    this.isTransitioning = true;
    this.transitionTheme = newTheme;
    this.transitionProgress = 0;

    // Notify callbacks
    this.callbacks.onTransitionStart?.(oldThemeId, newTheme.id);

    // If crossfade is disabled, immediately switch
    if (!this.transitionOptions.crossfade) {
      this.completeTransition(newTheme, oldTheme);
      return;
    }

    // Animate transition
    return new Promise((resolve) => {
      const startTime = performance.now();
      const { duration, easing } = this.transitionOptions;

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        let progress = Math.min(elapsed / duration, 1);

        // Apply easing
        progress = this.applyEasing(progress, easing);
        this.transitionProgress = progress;

        if (progress >= 1) {
          this.completeTransition(newTheme, oldTheme);
          resolve();
        } else {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Complete theme transition
   */
  private completeTransition(newTheme: IVoiceTheme, oldTheme: IVoiceTheme | null): void {
    // Clean up old theme
    oldTheme?.dispose();

    // Set new theme as current
    this.currentTheme = newTheme;
    this.transitionTheme = null;
    this.isTransitioning = false;
    this.transitionProgress = 0;

    // Notify callbacks
    this.callbacks.onThemeChange?.(oldTheme?.id || null, newTheme.id);
    this.callbacks.onTransitionComplete?.(newTheme.id);

    console.log(`Theme switched to: ${newTheme.id}`);
  }

  /**
   * Draw crossfade transition between themes
   */
  private drawTransition(
    context: CanvasRenderingContext2D,
    displayWidth: number,
    displayHeight: number,
    projCenterX: number,
    projCenterY: number,
    deltaTime: number
  ): void {
    // Create temporary canvases for each theme
    const tempCanvas1 = document.createElement('canvas');
    const tempCanvas2 = document.createElement('canvas');
    tempCanvas1.width = tempCanvas2.width = displayWidth;
    tempCanvas1.height = tempCanvas2.height = displayHeight;
    
    const tempCtx1 = tempCanvas1.getContext('2d');
    const tempCtx2 = tempCanvas2.getContext('2d');

    if (!tempCtx1 || !tempCtx2) return;

    // Draw old theme to first canvas
    if (this.currentTheme) {
      this.currentTheme.draw(tempCtx1, displayWidth, displayHeight, projCenterX, projCenterY, deltaTime);
    }

    // Draw new theme to second canvas
    if (this.transitionTheme) {
      this.transitionTheme.draw(tempCtx2, displayWidth, displayHeight, projCenterX, projCenterY, deltaTime);
    }

    // Clear main canvas
    context.clearRect(0, 0, displayWidth, displayHeight);

    // Draw old theme with fading alpha
    context.globalAlpha = 1 - this.transitionProgress;
    context.drawImage(tempCanvas1, 0, 0);

    // Draw new theme with increasing alpha
    context.globalAlpha = this.transitionProgress;
    context.drawImage(tempCanvas2, 0, 0);

    // Reset alpha
    context.globalAlpha = 1;
  }

  /**
   * Apply easing function to transition progress
   */
  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'linear':
        return t;
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return t * (2 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return t;
    }
  }
}

/**
 * Convenience function to get theme manager instance
 */
export const getThemeManager = () => ThemeManager.getInstance();