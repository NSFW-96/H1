"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export interface CanvasRevealEffectProps {
  colors?: [number, number, number][];
  dotSize?: number;
  animationSpeed?: number;
  containerClassName?: string;
}

export const CanvasRevealEffect = ({
  colors = [[255, 255, 255]],
  dotSize = 3,
  animationSpeed = 10,
  containerClassName
}: CanvasRevealEffectProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === container) {
          canvas.width = entry.contentRect.width;
          canvas.height = entry.contentRect.height;
        }
      }
    });

    resizeObserver.observe(container);

    const numberOfDots = Math.floor((canvas.width * canvas.height) / 1000);
    const dots: Dot[] = [];

    class Dot {
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: [number, number, number];
      size: number;

      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = Math.random() * 0.2 - 0.1;
        this.vy = Math.random() * 0.2 - 0.1;
        this.color = colors[Math.floor(Math.random() * colors.length)];
        this.size = dotSize;
      }

      update() {
        this.x += this.vx * animationSpeed;
        this.y += this.vy * animationSpeed;

        if (this.x < 0 || this.x > canvas.width) {
          this.vx = -this.vx;
        }

        if (this.y < 0 || this.y > canvas.height) {
          this.vy = -this.vy;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.5)`;
        ctx.shadowColor = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, 0.5)`;
        ctx.shadowBlur = 5;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Initialize dots
    for (let i = 0; i < numberOfDots; i++) {
      dots.push(new Dot());
    }

    // Animation loop
    function animate() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      dots.forEach((dot) => {
        dot.update();
        dot.draw();
      });

      requestAnimationFrame(animate);
    }

    animate();

    return () => {
      resizeObserver.disconnect();
    };
  }, [colors, dotSize, animationSpeed]);

  return (
    <div ref={containerRef} className={cn("h-full w-full absolute inset-0", containerClassName)}>
      <canvas
        ref={canvasRef}
        className="h-full w-full absolute inset-0"
      />
    </div>
  );
}; 