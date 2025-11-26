"use client";

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useCallback,
} from "react";
import { cn } from "@/lib/utils";

// ---------- helpers ----------
const rand = (min: number, max: number): number =>
  Math.random() * (max - min) + min;
const randInt = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min) + min);
const randColor = (): string => `hsl(${randInt(0, 360)}, 100%, 50%)`;

function getValueByRange(range: { min: number; max: number } | number) {
  if (typeof range === "number") return range;
  return rand(range.min, range.max);
}

function getColor(color: string | string[] | undefined): string {
  if (Array.isArray(color)) return color[randInt(0, color.length)] ?? randColor();
  return color ?? randColor();
}

// ---------- particle/firework types & factories ----------
type ParticleType = {
  x: number;
  y: number;
  color: string;
  vx: number;
  vy: number;
  gravity: number;
  friction: number;
  alpha: number;
  decay: number;
  size: number;
  update: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
  isAlive: () => boolean;
};

function createParticle(
  x: number,
  y: number,
  color: string,
  speed: number,
  direction: number,
  gravity: number,
  friction: number,
  size: number,
): ParticleType {
  const vx = Math.cos(direction) * speed;
  const vy = Math.sin(direction) * speed;
  const alpha = 1;
  const decay = rand(0.004, 0.02);

  return {
    x,
    y,
    color,
    vx,
    vy,
    gravity,
    friction,
    alpha,
    decay,
    size,
    update() {
      this.vx *= this.friction;
      this.vy *= this.friction;
      this.vy += this.gravity;
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= this.decay;
    },
    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, this.alpha);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();
    },
    isAlive() {
      return this.alpha > 0.01;
    },
  };
}

type FireworkType = {
  x: number;
  y: number;
  targetY: number;
  color: string;
  vx: number;
  vy: number;
  trail: { x: number; y: number }[];
  trailLength: number;
  exploded: boolean;
  update: () => boolean;
  explode: () => void;
  draw: (ctx: CanvasRenderingContext2D) => void;
};

function createFirework(
  x: number,
  y: number,
  targetY: number,
  color: string,
  speed: number,
  size: number,
  particleSpeed: { min: number; max: number } | number,
  particleSize: { min: number; max: number } | number,
  onExplode: (particles: ParticleType[]) => void,
): FireworkType {
  const angle = -Math.PI / 2 + rand(-0.3, 0.3);
  const vx = Math.cos(angle) * speed;
  const vy = Math.sin(angle) * speed;
  const trail: { x: number; y: number }[] = [];
  const trailLength = randInt(6, 18);

  return {
    x,
    y,
    targetY,
    color,
    vx,
    vy,
    trail,
    trailLength,
    exploded: false,
    update() {
      this.trail.push({ x: this.x, y: this.y });
      if (this.trail.length > this.trailLength) this.trail.shift();
      this.x += this.vx;
      this.y += this.vy;
      this.vy += 0.02;
      // explode when we reach target or start falling back
      if (this.vy >= 0 || this.y <= this.targetY) {
        this.explode();
        return false;
      }
      return true;
    },
    explode() {
      if (this.exploded) return;
      this.exploded = true;
      const numParticles = randInt(40, 140);
      const particles: ParticleType[] = [];
      for (let i = 0; i < numParticles; i++) {
        const particleAngle = rand(0, Math.PI * 2);
        const localParticleSpeed = getValueByRange(particleSpeed);
        const localParticleSize = getValueByRange(particleSize);
        particles.push(
          createParticle(
            this.x,
            this.y,
            this.color,
            localParticleSpeed,
            particleAngle,
            0.06,
            0.985,
            localParticleSize,
          ),
        );
      }
      onExplode(particles);
    },
    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      if (this.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(this.trail[0].x, this.trail[0].y);
        for (const p of this.trail) ctx.lineTo(p.x, p.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = size;
        ctx.lineCap = "round";
        ctx.stroke();
      }
      ctx.restore();
    },
  };
}

// ---------- React component ----------
export type FireworksBackgroundProps = Omit<
  React.ComponentProps<"div">,
  "color"
> & {
  canvasProps?: React.ComponentProps<"canvas">;
  population?: number; // how many fireworks per "unit" — higher = more frequent
  color?: string | string[];
  fireworkSpeed?: { min: number; max: number } | number;
  fireworkSize?: { min: number; max: number } | number;
  particleSpeed?: { min: number; max: number } | number;
  particleSize?: { min: number; max: number } | number;
  autoPlay?: boolean;
};

const FireworksBackground = forwardRef<HTMLDivElement, FireworksBackgroundProps>(
  (
    {
      canvasProps,
      className,
      population = 1,
      color,
      fireworkSpeed = { min: 2, max: 8 },
      fireworkSize = { min: 1, max: 4 },
      particleSpeed = { min: 2, max: 6 },
      particleSize = { min: 1, max: 2 },
      autoPlay = true,
      ...props
    },
    ref,
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLDivElement | null>(null);
    useImperativeHandle(ref, () => containerRef.current as HTMLDivElement);

   useEffect(() => {
  const canvas = canvasRef.current;
  const container = containerRef.current;
  if (!canvas || !container) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // scale for device pixel ratio to keep sharp edges
  const setSize = () => {
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  setSize();
  const resizeObserver = new ResizeObserver(setSize);
  resizeObserver.observe(container);

  const fireworks: FireworkType[] = [];
  const explosions: ParticleType[] = [];
  const timeouts: number[] = [];
  let rafId = 0;

  const handleExplosion = (particles: ParticleType[]) =>
    explosions.push(...particles);

  // <-- IMPORTANT: plain function (no hook) defined inside the effect
  const launchFirework = () => {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const maxX = rect.width;
    const maxY = rect.height;
    const x = rand(maxX * 0.1, maxX * 0.9);
    const y = maxY;
    const targetY = rand(maxY * 0.1, maxY * 0.45);
    const fireworkColor = getColor(color);
    const speed = getValueByRange(fireworkSpeed);
    const size = getValueByRange(fireworkSize);
    fireworks.push(
      createFirework(
        x,
        y,
        targetY,
        fireworkColor,
        speed,
        size,
        particleSpeed,
        particleSize,
        handleExplosion,
      ),
    );

    // schedule next launch
    const timeout = window.setTimeout(
      launchFirework,
      Math.max(80, rand(600, 1000) / Math.max(1, population)),
    );
    timeouts.push(timeout);
  };

  if (autoPlay) launchFirework();

  const animate = () => {
    const rect = container.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    for (let i = fireworks.length - 1; i >= 0; i--) {
      const fw = fireworks[i];
      if (!fw.update()) fireworks.splice(i, 1);
      else fw.draw(ctx);
    }

    for (let i = explosions.length - 1; i >= 0; i--) {
      const p = explosions[i];
      p.update();
      if (p.isAlive()) p.draw(ctx);
      else explosions.splice(i, 1);
    }

    rafId = requestAnimationFrame(animate);
  };

  animate();

  const handlePointer = (e: PointerEvent) => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = rect.height; // launch from bottom
    const targetY = e.clientY - rect.top;
    const fireworkColor = getColor(color);
    const speed = getValueByRange(fireworkSpeed);
    const size = getValueByRange(fireworkSize);
    fireworks.push(
      createFirework(
        x,
        y,
        targetY,
        fireworkColor,
        speed,
        size,
        particleSpeed,
        particleSize,
        handleExplosion,
      ),
    );
  };

  container.addEventListener("pointerdown", handlePointer);

  return () => {
    // cleanup everything
    resizeObserver.disconnect();
    container.removeEventListener("pointerdown", handlePointer);
    for (const t of timeouts) clearTimeout(t);
    cancelAnimationFrame(rafId);
    fireworks.length = 0;
    explosions.length = 0;
  };
}, [
  population,
  color,
  autoPlay,
  fireworkSpeed,
  fireworkSize,
  particleSpeed,
  particleSize,
]);

    return (
      <div
        ref={containerRef}
        data-slot="fireworks-background"
        className={cn("relative w-full h-full overflow-hidden", className)}
        {...props}
      >
        <canvas {...canvasProps} ref={canvasRef} className={cn("absolute inset-0 w-full h-full", canvasProps?.className)} />
      </div>
    );
  },
);

FireworksBackground.displayName = "FireworksBackground";

export { FireworksBackground };
export default FireworksBackground;
