import { useEffect, useRef } from 'react';

interface ConfettiPiece {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  opacity: number;
}

export function ConfettiCanvas({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    const height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const colors = ['#a855f7', '#06b6d4', '#f97316', '#ec4899', '#3b82f6', '#10b981', '#eab308', '#ffffff'];
    const count = 75;
    const pieces: ConfettiPiece[] = [];

    for (let i = 0; i < count; i++) {
      pieces.push({
        x: width / 2 + (Math.random() - 0.5) * 100,
        y: height / 3 + (Math.random() - 0.5) * 60,
        w: Math.random() * 8 + 4,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 12,
        vy: -Math.random() * 10 - 4,
        rot: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 15,
        opacity: 1,
      });
    }

    let animationFrame: number;
    let frameCount = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      frameCount++;

      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravidade
        p.vx *= 0.98; // arrasto
        p.rot += p.vRot;

        if (frameCount > 80) {
          p.opacity -= 0.015;
        }

        if (p.opacity > 0) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      });

      if (frameCount < 160) {
        animationFrame = requestAnimationFrame(render);
      }
    };

    animationFrame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 z-50 h-full w-full"
    />
  );
}
