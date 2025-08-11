import { useEffect, useRef, forwardRef } from "react";
import { getThemeManager } from '@/lib/voice/themes/ThemeManager';
import { DefaultTheme } from '@/lib/voice/themes/DefaultTheme';
import { throttle, debounce } from '@/lib/utils/throttle';

interface CanvasProps {
  // Classic theme only - no theme switching
}

const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(({}, ref) => {
  const internalRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = (ref as any) || internalRef;
  const themeManagerRef = useRef(getThemeManager());
  const isInitializedRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const themeManager = themeManagerRef.current;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    // Debounce resize to prevent excessive updates
    const debouncedResize = debounce(resizeCanvas, 250);

    resizeCanvas();
    window.addEventListener('resize', debouncedResize);

    // Initialize theme manager with canvas context
    if (!isInitializedRef.current) {
      themeManager.initialize(canvas, context);
      
      // Register default theme if not already registered
      if (!themeManager.getThemeMetadata('default')) {
        themeManager.registerTheme({
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
      }

      // Use default theme only
      themeManager.switchTheme('default');
      isInitializedRef.current = true;
    }

    // Throttled mouse move handler for better performance
    const handleMouseMove = throttle((event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      themeManager.setMousePosition(x, y, canvas.width, canvas.height);
    }, 16); // ~60fps for mouse movements

    const handleMouseEnter = () => {
      themeManager.setHovering(true);
    };

    const handleMouseLeave = () => {
      themeManager.setHovering(false);
    };

    // Add mouse event listeners
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseenter', handleMouseEnter);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    let animationFrameId: number;
    let lastTime = 0;
    const targetFPS = 30; // Target 30 FPS for better performance
    const frameInterval = 1000 / targetFPS;
    
    // Performance monitoring
    let frameCount = 0;
    let fpsTime = performance.now();
    let currentFPS = targetFPS;

    const render = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      
      // Only render if enough time has passed for target FPS
      if (deltaTime >= frameInterval) {
        // Update lastTime, adjusting for any time drift
        lastTime = currentTime - (deltaTime % frameInterval);
        
        // Get current canvas dimensions
        const currentWidth = canvas.width;
        const currentHeight = canvas.height;
        const currentProjCenterX = currentWidth / 2;
        const currentProjCenterY = currentHeight / 2;
        
        // Delegate drawing to theme manager
        themeManager.draw(context, currentWidth, currentHeight, currentProjCenterX, currentProjCenterY, deltaTime);
        
        // Performance monitoring
        frameCount++;
        const now = performance.now();
        if (now - fpsTime >= 1000) {
          currentFPS = frameCount;
          frameCount = 0;
          fpsTime = now;
          
          // Log performance warnings
          if (currentFPS < targetFPS * 0.8) {
            console.warn(`[VOICE-CANVAS] Low FPS detected: ${currentFPS}/${targetFPS}`);
          }
        }
      }
      
      animationFrameId = window.requestAnimationFrame(render);
    };
    
    // Start the animation loop
    animationFrameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', debouncedResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseenter', handleMouseEnter);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  // Expose theme actions for parent component to call
  (Canvas as any).getThemeManager = () => themeManagerRef.current;
  (Canvas as any).onUserSpeaking = () => themeManagerRef.current.onUserSpeaking();
  (Canvas as any).onProcessing = () => themeManagerRef.current.onProcessing();
  (Canvas as any).onAiSpeaking = () => themeManagerRef.current.onAiSpeaking();
  (Canvas as any).reset = () => themeManagerRef.current.reset();

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: 'transparent' }}
    />
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;