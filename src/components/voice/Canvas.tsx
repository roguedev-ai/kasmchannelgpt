import { useEffect, useRef, forwardRef } from "react";

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
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Set up projection center coordinates at the center of the canvas
    const displayWidth = canvas.width;
    const displayHeight = canvas.height;
    const projCenterX = displayWidth / 2;
    const projCenterY = displayHeight / 2;

    let animationFrameId: number;

    const render = () => {
      draw(context, displayWidth, displayHeight, projCenterX, projCenterY);
      animationFrameId = window.requestAnimationFrame(render);
    };
    
    render();

    return () => {
      window.cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ background: '#000000' }}
    />
  );
});

Canvas.displayName = 'Canvas';

export default Canvas;