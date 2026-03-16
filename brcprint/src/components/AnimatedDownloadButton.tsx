"use client";

import React, { useEffect, useRef, useState } from 'react';
import { gsap, Elastic } from 'gsap';
import styles from './AnimatedDownloadButton.module.css';

interface AnimatedDownloadButtonProps {
  onClick: () => void;
  labels?: string[]; // [Download, Downloading, Open File]
}

export default function AnimatedDownloadButton({
  onClick,
  labels = ["Download", "Baixando", "Abrir PDF"]
}: AnimatedDownloadButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const duration = 3000;

  // SVG path state managed through a proxy for GSAP compatibility
  const svgState = useRef({ y: 20, smoothing: 0 });

  const getPoint = (point: number[], i: number, a: number[][], smoothing: number) => {
    let cp = (current: number[], previous: number[] | undefined, next: number[] | undefined, reverse: boolean) => {
      let p = previous || current,
        n = next || current,
        o = {
          length: Math.sqrt(Math.pow(n[0] - p[0], 2) + Math.pow(n[1] - p[1], 2)),
          angle: Math.atan2(n[1] - p[1], n[0] - p[0])
        },
        angle = o.angle + (reverse ? Math.PI : 0),
        length = o.length * smoothing;
      return [current[0] + Math.cos(angle) * length, current[1] + Math.sin(angle) * length];
    };
    let cps = cp(a[i - 1], a[i - 2], point, false),
      cpe = cp(point, a[i - 1], a[i + 1], true);
    return `C ${cps[0]},${cps[1]} ${cpe[0]},${cpe[1]} ${point[0]},${point[1]}`;
  };

  const getPathContent = (update: number, smoothing: number, pointsNew?: number[][]) => {
    let points = pointsNew ? pointsNew : [
      [4, 12],
      [12, update],
      [20, 12]
    ];
    let d = points.reduce((acc, point, i, a) => i === 0 ? `M ${point[0]},${point[1]}` : `${acc} ${getPoint(point, i, a, smoothing)}`, '');
    return `<path d="${d}" />`;
  };

  const updateSvg = () => {
    if (svgRef.current) {
      svgRef.current.innerHTML = getPathContent(svgState.current.y, svgState.current.smoothing);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isLoading) return;

    setIsLoading(true);
    onClick();

    // Animation logic
    gsap.to(svgState.current, {
      smoothing: 0.3,
      duration: (duration * 0.065) / 1000,
      onUpdate: updateSvg
    });

    gsap.to(svgState.current, {
      y: 12,
      duration: (duration * 0.265) / 1000,
      delay: (duration * 0.065) / 1000,
      ease: Elastic.easeOut.config(1.12, 0.4),
      onUpdate: updateSvg
    });

    setTimeout(() => {
      if (svgRef.current) {
        svgRef.current.innerHTML = getPathContent(0, 0, [
          [3, 14],
          [8, 19],
          [21, 6]
        ]);
      }
    }, duration / 2);

    // Reset after animation
    setTimeout(() => {
      setIsLoading(false);
      svgState.current = { y: 20, smoothing: 0 };
      if (svgRef.current) {
        svgRef.current.innerHTML = getPathContent(20, 0);
      }
    }, duration + 500);
  };

  useEffect(() => {
    if (svgRef.current) {
      svgRef.current.innerHTML = getPathContent(20, 0);
    }
  }, []);

  return (
    <button
      ref={buttonRef}
      className={`${styles.button} ${isLoading ? styles.loading : ''}`}
      onClick={handleClick}
      style={{ '--duration': duration } as React.CSSProperties}
    >
      <ul>
        <li>{labels[0]}</li>
        <li>{labels[1]}</li>
        <li>{labels[2]}</li>
      </ul>
      <div>
        <svg ref={svgRef} viewBox="0 0 24 24"></svg>
      </div>
    </button>
  );
}
