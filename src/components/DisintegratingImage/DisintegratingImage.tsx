'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './DisintegratingImage.module.css';

// Helper functions for RGB <-> HSB conversion
// Assumes R, G, B are 0-255; H is 0-360, S and B (V) are 0-100
function rgbToHsb(r: number, g: number, b: number): { h: number, s: number, v: number } {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s: number, v = max; // v is brightness/value
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    if (max === min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), v: Math.round((v / 255) * 100) };
}

function hsbToRgb(h: number, s: number, v: number): { r: number, g: number, b: number } {
    s /= 100; // Convert S and V from 0-100 to 0-1 range for calculation
    v /= 100;
    let r = 0, g = 0, b = 0;
    const i = Math.floor((h / 60) % 6);
    const f = (h / 60) - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

interface Particle {
    x: number;
    y: number;
    originalX: number;
    originalY: number;
    size: number;
    h: number; // Hue (0-360)
    s: number; // Saturation (0-100)
    b: number; // Brightness/Value (0-100)
    speed: number;
    angle: number;
    life: number;
    maxLife: number;
}

interface DisintegratingImageProps {
    src: string;
    alt: string;
    className?: string;
}

export default function DisintegratingImage({ src, alt, className }: DisintegratingImageProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const offScreenCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const [isImageLoaded, setIsImageLoaded] = useState(false);
    // Store mousePos in a ref for the animation loop to access directly
    const mousePosRef = useRef({ x: 0, y: 0 });
    const isActivelyMovingRef = useRef(false);
    const mouseMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameId = useRef<number>(0);
    const particles = useRef<Particle[]>([]);

    // Effect to prepare the off-screen canvas once the image is loaded
    useEffect(() => {
        if (isImageLoaded && imageRef.current && containerRef.current) {
            const image = imageRef.current;
            const container = containerRef.current;
            const offScreenCanvas = document.createElement('canvas');
            const containerRect = container.getBoundingClientRect();
            if (containerRect.width > 0 && containerRect.height > 0) {
                offScreenCanvas.width = containerRect.width;
                offScreenCanvas.height = containerRect.height;
                const ctx = offScreenCanvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(image, 0, 0, offScreenCanvas.width, offScreenCanvas.height);
                    offScreenCanvasRef.current = offScreenCanvas;
                }
            }
        }
    }, [isImageLoaded]);

    // Effect to handle image loading state for the main <img>
    useEffect(() => {
        const image = imageRef.current;
        if (!image) return;
        const handleImageLoad = () => setIsImageLoaded(true);
        if (image.complete && image.naturalHeight !== 0) handleImageLoad();
        else {
            image.addEventListener('load', handleImageLoad);
            image.addEventListener('error', () => { }); // Basic error handling
            return () => {
                image.removeEventListener('load', handleImageLoad);
                image.removeEventListener('error', () => { });
            };
        }
    }, []);

    // Single useEffect to manage the animation loop lifecycle
    useEffect(() => {
        if (!isImageLoaded) return;

        const visibleCanvas = canvasRef.current;
        const visibleCtx = visibleCanvas?.getContext('2d');
        const container = containerRef.current;

        if (!visibleCanvas || !visibleCtx || !container) return;

        // Ensure canvas is sized correctly
        const resizeCanvas = () => {
            if (containerRef.current && canvasRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                if (canvasRef.current.width !== containerRect.width || canvasRef.current.height !== containerRect.height) {
                    canvasRef.current.width = containerRect.width;
                    canvasRef.current.height = containerRect.height;
                }
            }
        };
        resizeCanvas(); // Initial size

        // Keep a ref to the animation function to ensure it's stable if needed, though not strictly necessary here
        // as it uses refs for dynamic data.
        const createParticles = (x: number, y: number) => {
            const sourceCanvas = offScreenCanvasRef.current;
            if (!sourceCanvas) return;
            const sourceCtx = sourceCanvas.getContext('2d');
            if (!sourceCtx) return;
            const particleCount = 10;
            const radius = 50;
            for (let i = 0; i < particleCount; i++) {
                const angle = (Math.PI * 2 * i) / particleCount;
                const distance = Math.random() * radius;
                const particleX = x + Math.cos(angle) * distance;
                const particleY = y + Math.sin(angle) * distance;
                if (particleX >= 0 && particleX < sourceCanvas.width && particleY >= 0 && particleY < sourceCanvas.height) {
                    try {
                        const pixelData = sourceCtx.getImageData(Math.floor(particleX), Math.floor(particleY), 1, 1).data;
                        const hsb = rgbToHsb(pixelData[0], pixelData[1], pixelData[2]);
                        particles.current.push({
                            x: particleX, y: particleY, originalX: particleX, originalY: particleY,
                            h: hsb.h, s: hsb.s, b: hsb.v,
                            size: Math.random() * 3 + 4,
                            speed: Math.random() * 2 + 0.5,
                            angle: Math.random() * Math.PI * 2,
                            life: 0,
                            maxLife: Math.random() * 60 + 40,
                        });
                    } catch (e) { continue; }
                } else { continue; }
            }
        };

        let isActive = true; // Flag to control the loop
        const sOffsetInitial = 10;  // Initial saturation boost
        const bOffsetInitial = -10; // Initial brightness reduction
        const colorTransitionDuration = 0.2; // 20% of life to transition from modified HSB to true HSB

        const animate = () => {
            if (!isActive || !visibleCtx || !visibleCanvas) return;
            resizeCanvas();
            visibleCtx.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height);

            if (isActivelyMovingRef.current) {
                createParticles(mousePosRef.current.x, mousePosRef.current.y);
            }

            particles.current = particles.current.filter((particle) => {
                particle.life++;
                if (particle.life >= particle.maxLife) return false;

                const progress = particle.life / particle.maxLife;
                let currentH, currentS, currentB;

                // Calculate initial modified HSB for this particle (once, effectively)
                const initialS = Math.min(100, Math.max(0, particle.s + sOffsetInitial));
                const initialB = Math.min(100, Math.max(0, particle.b + bOffsetInitial));

                if (progress < colorTransitionDuration) {
                    const transitionProgress = progress / colorTransitionDuration;
                    currentH = particle.h;
                    currentS = Math.floor(initialS * (1 - transitionProgress) + particle.s * transitionProgress);
                    currentB = Math.floor(initialB * (1 - transitionProgress) + particle.b * transitionProgress);
                } else {
                    currentH = particle.h;
                    currentS = particle.s;
                    currentB = particle.b;
                }

                const rgb = hsbToRgb(currentH, currentS, currentB);
                visibleCtx.fillStyle = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                visibleCtx.globalAlpha = 1 - progress; // Overall fade out

                particle.x += Math.cos(particle.angle) * particle.speed;
                particle.y += Math.sin(particle.angle) * particle.speed + progress * 2;
                visibleCtx.fillRect(particle.x, particle.y, particle.size, particle.size);
                visibleCtx.globalAlpha = 1.0;
                return true;
            });

            if (isActive) {
                animationFrameId.current = requestAnimationFrame(animate);
            }
        };

        // Start the animation loop if canvas has dimensions
        if (visibleCanvas.width > 0 && visibleCanvas.height > 0) {
            animate();
        } else {
            // If canvas has no dimensions yet, try to start animation after a short delay, 
            // hoping layout has settled. This is a fallback.
            const startTimeout = setTimeout(() => {
                if (canvasRef.current && canvasRef.current.width > 0 && canvasRef.current.height > 0) {
                    animate();
                }
            }, 100);
            return () => clearTimeout(startTimeout);
        }

        return () => {
            isActive = false; // Stop the loop
            if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
            if (mouseMoveTimeoutRef.current) clearTimeout(mouseMoveTimeoutRef.current); // Also clear this on unmount
        };
    }, [isImageLoaded]); // Only re-setup animation if isImageLoaded changes

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        mousePosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

        isActivelyMovingRef.current = true;
        if (mouseMoveTimeoutRef.current) clearTimeout(mouseMoveTimeoutRef.current);
        mouseMoveTimeoutRef.current = setTimeout(() => {
            isActivelyMovingRef.current = false;
        }, 150); // Adjust as needed
    };

    const handleMouseLeave = () => {
        isActivelyMovingRef.current = false;
        if (mouseMoveTimeoutRef.current) clearTimeout(mouseMoveTimeoutRef.current);
    }

    return (
        <div
            ref={containerRef}
            className={className ? `${styles.container} ${className}` : styles.container}
            onMouseLeave={handleMouseLeave}
            onMouseMove={handleMouseMove}
        >
            <img ref={imageRef} src={src} alt={alt} className={styles.image} />
            {isImageLoaded && <canvas ref={canvasRef} className={styles.canvas} />}
        </div>
    );
} 