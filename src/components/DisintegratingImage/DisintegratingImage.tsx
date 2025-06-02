'use client';
import { useEffect, useRef, useState } from 'react';
import styles from './DisintegratingImage.module.css';

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
    const mousePosRef = useRef({ x: 0, y: 0 });
    const isActivelyMovingRef = useRef(false);
    const mouseMoveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const animationFrameId = useRef<number>(0);
    const distortionAmountRef = useRef(0);


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
                    const img = imageRef.current;
                    if (offCtx && img.naturalWidth > 0 && img.naturalHeight > 0) { // Ensure image has dimensions
                        offCtx.clearRect(0, 0, newWidth, newHeight); // Clear before redrawing

                        const imgAspectRatio = img.naturalWidth / img.naturalHeight;
                        const canvasAspectRatio = newWidth / newHeight;

                        let sx = 0;
                        let sy = 0;
                        let sWidth = img.naturalWidth;
                        let sHeight = img.naturalHeight;

                        if (imgAspectRatio > canvasAspectRatio) { // Image is wider than canvas proportionately
                            sHeight = img.naturalHeight;
                            sWidth = sHeight * canvasAspectRatio;
                            sx = (img.naturalWidth - sWidth) / 2;
                        } else if (imgAspectRatio < canvasAspectRatio) { // Image is taller than canvas proportionately
                            sWidth = img.naturalWidth;
                            sHeight = sWidth / canvasAspectRatio;
                            sy = (img.naturalHeight - sHeight) / 2;
                        }
                        // If aspect ratios are equal, sx, sy, sWidth, sHeight remain as img.naturalWidth/Height

                        offCtx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, newWidth, newHeight);
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
            // Always draw the base image first. 
            // The main animate loop already clears the visibleCanvas.
            ctx.drawImage(source, 0, 0, canvasWidth, canvasHeight);

            // If no distortion, we're done as the base image is drawn.
            if (amount <= 0 || canvasWidth <= 0 || canvasHeight <= 0) {
                return;
            }

            const verticalWaveFrequency = 0.02;
            const mouseYSensitivity = 0.03;
            const horizontalInfluenceWidthFactor = 0.18;
            const verticalInfluenceHeightFactor = 0.15;
            const maxPixelShift = 60; // Max Pixel Shift

            const horizontalInfluenceWidth = canvasWidth * horizontalInfluenceWidthFactor;
            const verticalInfluenceHeight = canvasHeight * verticalInfluenceHeightFactor;

            const sliceHeight = 15;   // Square Block Size
            const segmentWidth = 15;  // Square Block Size

            for (let y = 0; y < canvasHeight; y += sliceHeight) {
                const sinPhase = y * verticalWaveFrequency + mousePos.y * mouseYSensitivity;
                const sinValue = Math.sin(sinPhase);

                const distYToMouse = Math.abs((y + sliceHeight / 2) - mousePos.y);
                const verticalGaussInfluence = Math.exp(-Math.pow(distYToMouse / verticalInfluenceHeight, 2.0));

                for (let x = 0; x < canvasWidth; x += segmentWidth) {
                    const segmentCenterX = x + segmentWidth / 2;
                    const distXToMouse = segmentCenterX - mousePos.x;
                    const gaussInfluence = Math.exp(-Math.pow(distXToMouse / horizontalInfluenceWidth, 2.0));

                    const combinedInfluence = gaussInfluence * verticalGaussInfluence;

                    // Conditional Block Displacement
                    if (combinedInfluence > 0.05) {
                        const currentPixelShift = amount * combinedInfluence * sinValue * maxPixelShift;
                        const idealGlobalSourceX = x - currentPixelShift;

                        let currentDrawDestX = x;
                        let remainingDestWidth = segmentWidth;

                        // 1. Handle left overhang 
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

                        // 3. Handle right overhang
                        if (remainingDestWidth > 0) {
                            if (canvasWidth > 0) {
                                ctx.drawImage(source, canvasWidth - 1, y, 1, sliceHeight, currentDrawDestX, y, remainingDestWidth, sliceHeight);
                            }
                        }
                    } // else, if combinedInfluence is too low, do nothing for this block - base image shows through.
                }
            }
        };

        let isActive = true;

        const animate = () => {
            if (!isActive || !visibleCtx || !visibleCanvas) return;
            resizeCanvas();

            if (!isActivelyMovingRef.current && distortionAmountRef.current > 0) {
                distortionAmountRef.current = Math.max(0, distortionAmountRef.current - 0.025);
            }

            visibleCtx.clearRect(0, 0, visibleCanvas.width, visibleCanvas.height);

            const sourceCanvas = offScreenCanvasRef.current;
            if (sourceCanvas && sourceCanvas.width > 0 && sourceCanvas.height > 0) {
                if (distortionAmountRef.current > 0 && mousePosRef.current) {
                    applySlitScanDistortion(visibleCtx, sourceCanvas, distortionAmountRef.current, mousePosRef.current, visibleCanvas.width, visibleCanvas.height);
                } else {
                    visibleCtx.drawImage(sourceCanvas, 0, 0, visibleCanvas.width, visibleCanvas.height);
                }
                if (!isCanvasDrawingImage && visibleCanvas.width > 0 && visibleCanvas.height > 0) {
                    setIsCanvasDrawingImage(true);
                }
            } else {
                // If sourceCanvas isn't ready, clear to avoid drawing stale frames.
            }

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

        mousePosRef.current = { x: newX, y: newY };

        isActivelyMovingRef.current = true;
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