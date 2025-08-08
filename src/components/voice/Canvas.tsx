import { useEffect, useRef, forwardRef } from "react";
import { particleActions } from '@/lib/voice/particle-manager';
import { throttle, debounce } from '@/lib/utils/throttle';

interface CanvasProps {
  draw: (context: CanvasRenderingContext2D, displayWidth: number, displayHeight: number, projCenterX: number, projCenterY: number) => void;
}

const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(({ draw }, ref) => {
  const internalRef = useRef<HTMLCanvasElement>(null);
  const canvasRef = (ref as any) || internalRef;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Update projection center coordinates when canvas resizes
      const displayWidth = canvas.width;
      const displayHeight = canvas.height;
      const projCenterX = displayWidth / 2;
      const projCenterY = displayHeight / 2;
    };
    
    // Debounce resize to prevent excessive updates
    const debouncedResize = debounce(resizeCanvas, 250);

    resizeCanvas();
    window.addEventListener('resize', debouncedResize);

    // Set up projection center coordinates at the center of the canvas
    const displayWidth = canvas.width;
    const displayHeight = canvas.height;
    const projCenterX = displayWidth / 2;
    const projCenterY = displayHeight / 2;

    // Throttled mouse move handler for better performance
    const handleMouseMove = throttle((event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      particleActions.setMousePosition(x, y, canvas.width, canvas.height);
    }, 16); // ~60fps for mouse movements

    const handleMouseEnter = () => {
      particleActions.setHovering(true);
    };

    const handleMouseLeave = () => {
      particleActions.setHovering(false);
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
        
        draw(context, currentWidth, currentHeight, currentProjCenterX, currentProjCenterY);
        
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
  }, [draw]);

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