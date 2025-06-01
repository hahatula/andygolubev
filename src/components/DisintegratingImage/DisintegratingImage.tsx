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
    const [isCanvasDrawingImage, setIsCanvasDrawingImage] = useState(false);
    // Store mousePos in a ref for the animation loop to access directly
    const mousePosRef = useRef({ x: 0, y: 0 });
    const isActivelyMovingRef = useRef(false);
    const mouseMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameId = useRef<number>(0);
    const particles = useRef<Particle[]>([]);
    const distortionAmountRef = useRef(0);
    const lastMousePosRef = useRef({ x: 0, y: 0 });
    const mouseVelocityRef = useRef({ x: 0, y: 0 });


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

        // Ensure canvas is sized correctly and off-screen canvas is prepared
        const resizeCanvas = () => {
            if (containerRef.current && canvasRef.current && imageRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const newWidth = Math.max(1, containerRect.width); // Ensure positive dimensions
                const newHeight = Math.max(1, containerRect.height); // Ensure positive dimensions

                let offScreenResizedOrCreated = false;

                // Manage offScreenCanvas
                if (!offScreenCanvasRef.current && isImageLoaded && newWidth > 0 && newHeight > 0) {
                    // Create offScreenCanvas if it doesn't exist, image is loaded, and dimensions are valid
                    const offScreenCanvas = document.createElement('canvas');
                    offScreenCanvas.width = newWidth;
                    offScreenCanvas.height = newHeight;
                    offScreenCanvasRef.current = offScreenCanvas;
                    offScreenResizedOrCreated = true;
                } else if (offScreenCanvasRef.current && (offScreenCanvasRef.current.width !== newWidth || offScreenCanvasRef.current.height !== newHeight)) {
                    // Resize existing offScreenCanvas
                    offScreenCanvasRef.current.width = newWidth;
                    offScreenCanvasRef.current.height = newHeight;
                    offScreenResizedOrCreated = true;
                }

                // If offScreenCanvas was created or resized, and image is loaded, redraw it.
                if (offScreenResizedOrCreated && offScreenCanvasRef.current && imageRef.current && isImageLoaded) {
                    const offCtx = offScreenCanvasRef.current.getContext('2d');
                    if (offCtx) {
                        offCtx.clearRect(0, 0, newWidth, newHeight); // Clear before redrawing
                        offCtx.drawImage(imageRef.current, 0, 0, newWidth, newHeight);
                    }
                }

                // Manage visibleCanvas
                if (canvasRef.current.width !== newWidth || canvasRef.current.height !== newHeight) {
                    canvasRef.current.width = newWidth;
                    canvasRef.current.height = newHeight;
                }
            }
        };
        resizeCanvas(); // Initial size and off-screen canvas setup if image already loaded

        const applySlitScanDistortion = (
            ctx: CanvasRenderingContext2D,
            source: HTMLCanvasElement,
            amount: number,
            mousePos: { x: number, y: number },
            canvasWidth: number,
            canvasHeight: number
        ) => {
            if (amount <= 0 || canvasWidth <= 0 || canvasHeight <= 0) {
                ctx.drawImage(source, 0, 0, canvasWidth, canvasHeight);
                return;
            }

            ctx.clearRect(0, 0, canvasWidth, canvasHeight); // Clear for the new effect

            const verticalWaveFrequency = 0.02; // How many waves vertically
            const mouseYSensitivity = 0.03;    // How mouse Y shifts wave phase
            const horizontalInfluenceWidthFactor = 0.18; // Factor of canvasWidth for Gaussian spread
            const verticalInfluenceHeightFactor = 0.15; // NEW: Factor of canvasHeight for vertical Gaussian spread
            const maxPixelShift = 70;         // Max horizontal shift

            const horizontalInfluenceWidth = canvasWidth * horizontalInfluenceWidthFactor;
            const verticalInfluenceHeight = canvasHeight * verticalInfluenceHeightFactor; // NEW

            // Draw in thin horizontal slices/scanlines
            const sliceHeight = 4; // Effectively per-scanline - Increased from 1

            for (let y = 0; y < canvasHeight; y += sliceHeight) {
                const sinPhase = y * verticalWaveFrequency + mousePos.y * mouseYSensitivity;
                const sinValue = Math.sin(sinPhase);

                // NEW: Calculate vertical influence
                const distYToMouse = Math.abs((y + sliceHeight / 2) - mousePos.y);
                const verticalGaussInfluence = Math.exp(-Math.pow(distYToMouse / verticalInfluenceHeight, 2.0));

                // Draw this slice in segments to apply varying offset
                const segmentWidth = 8; // Process in small horizontal chunks - Increased from 4
                for (let x = 0; x < canvasWidth; x += segmentWidth) {
                    const segmentCenterX = x + segmentWidth / 2;
                    const distXToMouse = segmentCenterX - mousePos.x;
                    const gaussInfluence = Math.exp(-Math.pow(distXToMouse / horizontalInfluenceWidth, 2.0));
                    const currentPixelShift = amount * gaussInfluence * verticalGaussInfluence * sinValue * maxPixelShift;

                    const idealGlobalSourceX = x - currentPixelShift;

                    let currentDrawDestX = x;
                    let remainingDestWidth = segmentWidth;

                    // 1. Handle left overhang (if ideal source starts before image 0)
                    if (idealGlobalSourceX < 0 && remainingDestWidth > 0) {
                        const overhangWidth = Math.min(remainingDestWidth, -idealGlobalSourceX);
                        if (overhangWidth > 0) {
                            ctx.drawImage(source, 0, y, 1, sliceHeight, currentDrawDestX, y, overhangWidth, sliceHeight);
                            currentDrawDestX += overhangWidth;
                            remainingDestWidth -= overhangWidth;
                        }
                    }

                    // 2. Handle the part that samples from within the image
                    if (remainingDestWidth > 0) {
                        const sourceXForValidPart = Math.max(0, idealGlobalSourceX);
                        const sourceAvailableWidth = canvasWidth - sourceXForValidPart;

                        const drawableWidthFromValidSource = Math.min(remainingDestWidth, sourceAvailableWidth);

                        if (drawableWidthFromValidSource > 0) {
                            ctx.drawImage(source, sourceXForValidPart, y, drawableWidthFromValidSource, sliceHeight, currentDrawDestX, y, drawableWidthFromValidSource, sliceHeight);
                            currentDrawDestX += drawableWidthFromValidSource;
                            remainingDestWidth -= drawableWidthFromValidSource;
                        }
                    }

                    // 3. Handle right overhang (if there's still dest width left, source ran out)
                    if (remainingDestWidth > 0) {
                        // This remainingDestWidth must be filled by the last pixel of the source image
                        // Ensure source image has width before accessing canvasWidth - 1
                        if (canvasWidth > 0) {
                            ctx.drawImage(source, canvasWidth - 1, y, 1, sliceHeight, currentDrawDestX, y, remainingDestWidth, sliceHeight);
                        } else {
                            // Fallback if canvasWidth is 0, though unlikely with prior checks
                            // Potentially fill with a default color or leave transparent if this state is possible
                        }
                    }
                }
            }
        };

        const createParticles = (x: number, y: number) => {
            const sourceCanvas = offScreenCanvasRef.current;
            if (!sourceCanvas) return;
            const sourceCtx = sourceCanvas.getContext('2d');
            if (!sourceCtx) return;
            const particleCount = 20;
            const radius = 80;

            const { x: velX, y: velY } = mouseVelocityRef.current;
            const movementMagnitude = Math.sqrt(velX * velX + velY * velY);

            const particleAngleSpreadForMovement = Math.PI / 2; // For actual particle flight direction
            const samplingConeAngleForTail = Math.PI / 2;   // Angle for the cone shape of initial positions

            for (let i = 0; i < particleCount; i++) {
                let particleSourceX, particleSourceY;
                let emissionAngle;

                if (movementMagnitude > 0.5) { // Active movement: TAIL logic
                    const tailBaseAngle = Math.atan2(velY, velX) + Math.PI;

                    const distAlongTailAxis = Math.random() * radius;
                    const maxPerpOffset = distAlongTailAxis * Math.tan(samplingConeAngleForTail / 2);
                    const actualPerpOffset = (Math.random() - 0.5) * 2 * maxPerpOffset;

                    const cosTail = Math.cos(tailBaseAngle);
                    const sinTail = Math.sin(tailBaseAngle);

                    particleSourceX = x + cosTail * distAlongTailAxis - sinTail * actualPerpOffset;
                    particleSourceY = y + sinTail * distAlongTailAxis + cosTail * actualPerpOffset;

                    emissionAngle = tailBaseAngle + (Math.random() - 0.5) * particleAngleSpreadForMovement;

                } else { // Stationary or slow movement: circular burst logic
                    const randomSamplingAngle = Math.random() * Math.PI * 2;
                    const randomSamplingDist = Math.random() * radius;
                    particleSourceX = x + Math.cos(randomSamplingAngle) * randomSamplingDist;
                    particleSourceY = y + Math.sin(randomSamplingAngle) * randomSamplingDist;

                    emissionAngle = Math.random() * Math.PI * 2;
                }

                // Ensure particleSourceX and particleSourceY are defined before using them
                if (typeof particleSourceX === 'number' && typeof particleSourceY === 'number' &&
                    particleSourceX >= 0 && particleSourceX < sourceCanvas.width &&
                    particleSourceY >= 0 && particleSourceY < sourceCanvas.height) {
                    try {
                        const pixelData = sourceCtx.getImageData(Math.floor(particleSourceX), Math.floor(particleSourceY), 1, 1).data;
                        const hsb = rgbToHsb(pixelData[0], pixelData[1], pixelData[2]);

                        particles.current.push({
                            x: particleSourceX, y: particleSourceY, originalX: particleSourceX, originalY: particleSourceY,
                            h: hsb.h, s: hsb.s, b: hsb.v,
                            size: Math.random() * 3 + 4,
                            speed: Math.random() * 2 + 0.5,
                            angle: emissionAngle,
                            life: 0,
                            maxLife: Math.random() * 60 + 40,
                        });
                    } catch (e) { /* ignore error & continue */ }
                } else { /* ignore particle & continue */ }
            }
        };

        let isActive = true;
        const sOffsetInitial = 10;
        const bOffsetInitial = -10;
        const colorTransitionDuration = 0.3;

        const animate = () => {
            if (!isActive || !visibleCtx || !visibleCanvas) return;
            resizeCanvas(); // Call resize at the start of each frame

            // Update mouse velocity
            const currentFrameMouseX = mousePosRef.current.x;
            const currentFrameMouseY = mousePosRef.current.y;

            if (isActivelyMovingRef.current) {
                mouseVelocityRef.current.x = currentFrameMouseX - lastMousePosRef.current.x;
                mouseVelocityRef.current.y = currentFrameMouseY - lastMousePosRef.current.y;
            } else {
                mouseVelocityRef.current.x *= 0.95; // Decay factor
                mouseVelocityRef.current.y *= 0.95;
                if (Math.abs(mouseVelocityRef.current.x) < 0.1) mouseVelocityRef.current.x = 0;
                if (Math.abs(mouseVelocityRef.current.y) < 0.1) mouseVelocityRef.current.y = 0;
            }
            lastMousePosRef.current = { x: currentFrameMouseX, y: currentFrameMouseY };

            // Decay distortion if mouse is not moving
            if (!isActivelyMovingRef.current && distortionAmountRef.current > 0) {
                distortionAmountRef.current = Math.max(0, distortionAmountRef.current - 0.025); // Slightly faster decay
            }

            visibleCtx.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height);

            const sourceCanvas = offScreenCanvasRef.current;
            if (sourceCanvas && sourceCanvas.width > 0 && sourceCanvas.height > 0) { // Ensure source is valid
                if (distortionAmountRef.current > 0 && mousePosRef.current) {
                    // applySlitScanDistortion(visibleCtx, sourceCanvas, distortionAmountRef.current, mousePosRef.current, visibleCanvas.width, visibleCanvas.height);
                    applySlitScanDistortion(visibleCtx, sourceCanvas, distortionAmountRef.current, mousePosRef.current, visibleCanvas.width, visibleCanvas.height);
                } else {
                    visibleCtx.drawImage(sourceCanvas, 0, 0, visibleCanvas.width, visibleCanvas.height);
                }
                if (!isCanvasDrawingImage && visibleCanvas.width > 0 && visibleCanvas.height > 0) {
                    setIsCanvasDrawingImage(true);
                }
            } else {
                // If sourceCanvas isn't ready, clear to avoid drawing stale frames.
                // This case should be rare with the new resizeCanvas logic.
            }

            if (isActivelyMovingRef.current && offScreenCanvasRef.current) { // Ensure offScreenCanvas is available for particle creation
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
        const newX = e.clientX - rect.left;
        const newY = e.clientY - rect.top;

        // If starting to move after a stop, initialize lastMousePos to current to avoid a jump in velocity
        if (!isActivelyMovingRef.current) {
            lastMousePosRef.current = { x: newX, y: newY };
        }
        mousePosRef.current = { x: newX, y: newY };

        isActivelyMovingRef.current = true;
        // Ramp up distortion immediately on move
        distortionAmountRef.current = Math.min(1, distortionAmountRef.current + 0.20); // Faster ramp-up

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
            <img
                ref={imageRef}
                src={src}
                alt={alt}
                className={styles.image}
                style={{
                    opacity: isCanvasDrawingImage ? 0 : 1,
                    transition: 'opacity 0.5s ease-out'
                }}
            />
            {isImageLoaded && <canvas ref={canvasRef} className={styles.canvas} />}
        </div>
    );
} 