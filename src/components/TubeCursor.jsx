import React, { useEffect, useRef, useState } from "react";

function isWebGLAvailable() {
    try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        if (!gl) return false;
        if (gl.isContextLost && gl.isContextLost()) return false;
        return true;
    } catch (e) {
        return false;
    }
}

const TubeCursor = ({
    initialColors = ["#f967fb", "#53bc28", "#6958d5"],
    lightColors = ["#83f36e", "#fe8a2e", "#ff008a", "#60aed5"],
    lightIntensity = 200,
    enableRandomizeOnClick = true,
    className = "",
}) => {
    const canvasRef = useRef(null);
    const appRef = useRef(null);
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        let removeClick = null;
        let destroyed = false;
        let loadTimeout = null;

        document.body.style.backgroundColor = "#000";

        if (!isWebGLAvailable()) {
            console.warn("WebGL is not available in this browser environment. TubeCursor disabled.");
            setHasError(true);
            return;
        }

        // Global error handler to catch async errors originating from tubes1.min.js
        const handleAsyncError = (event) => {
            const errorMsg = event?.reason?.message || event?.message || "";
            const errorStack = event?.reason?.stack || event?.error?.stack || "";
            const isTubesError = errorMsg.includes("fromArray") || 
                                 errorMsg.includes("tubes1") || 
                                 errorMsg.includes("WebGL") || 
                                 errorMsg.includes("adapters") ||
                                 errorMsg.includes("reading '0'") ||
                                 errorStack.includes("tubes1");
            
            if (isTubesError) {
                console.warn("TubeCursor caught runtime WebGL/WebGPU error, gracefully disabling 3D effect:", errorMsg);
                document.body.style.backgroundColor = "#000"; // FORCE BLACK
                setHasError(true);
                if (event.preventDefault) event.preventDefault();
            }
        };

        window.addEventListener("unhandledrejection", handleAsyncError);
        window.addEventListener("error", handleAsyncError);

        let initTimer = null;

        (async () => {
            // Wait 200ms for DOM painting to prevent 0-dimension canvas geometry crashes
            initTimer = setTimeout(async () => {
                if (destroyed) return;
                try {
                    // Dynamic import from CDN
                    const mod = await import(
                        /* webpackIgnore: true */
                        "https://cdn.jsdelivr.net/npm/threejs-components@0.0.30/build/cursors/tubes1.min.js"
                    );
                    const TubesCursorCtor = mod.default || mod;

                    if (!canvasRef.current || destroyed) return;

                    let app = null;
                    try {
                        app = TubesCursorCtor(canvasRef.current, {
                            tubes: {
                                colors: initialColors,
                                lights: {
                                    intensity: lightIntensity,
                                    colors: lightColors,
                                },
                            },
                        });
                    } catch (renderError) {
                        console.warn("TubeCursor WebGL initialization failed:", renderError);
                        setHasError(true);
                        return;
                    }

                    if (!app) {
                        setHasError(true);
                        return;
                    }

                    appRef.current = app;
                    
                    // If we reach here without a synchronous crash, wait 500ms to ensure no async crashes 
                    // happen before fading the canvas in, to completely prevent the white flash.
                    loadTimeout = setTimeout(() => {
                        if (!destroyed) setIsLoaded(true);
                    }, 500);

                    if (enableRandomizeOnClick && canvasRef.current) {
                        const handler = () => {
                            try {
                                if (!appRef.current || !appRef.current.tubes) return;
                                const colors = randomColors(initialColors.length);
                                const lights = randomColors(lightColors.length);
                                appRef.current.tubes.setColors(colors);
                                appRef.current.tubes.setLightsColors(lights);
                            } catch (e) {
                                console.warn("Error randomizing TubeCursor colors:", e);
                            }
                        };
                        const element = canvasRef.current;
                        element.addEventListener("click", handler);
                        removeClick = () => element.removeEventListener("click", handler);
                    }
                } catch (err) {
                    console.warn("Failed to load or execute TubeCursor script:", err);
                    setHasError(true);
                }
            }, 200);
        })();

        return () => {
            destroyed = true;
            if (initTimer) clearTimeout(initTimer);
            if (loadTimeout) clearTimeout(loadTimeout);
            window.removeEventListener("unhandledrejection", handleAsyncError);
            window.removeEventListener("error", handleAsyncError);
            if (removeClick) removeClick();
            try {
                if (appRef.current && typeof appRef.current.dispose === "function") {
                    appRef.current.dispose();
                }
            } catch (e) {
                // ignore dispose error
            }
            appRef.current = null;
        };
    }, [initialColors, lightColors, lightIntensity, enableRandomizeOnClick]);

    return (
        <div
            className={`tube-cursor-wrapper ${className}`}
            style={{
                position: 'absolute',
                inset: 0,
                overflow: 'hidden',
                zIndex: 0,
                backgroundColor: '#000'
            }}
        >
            {!hasError && (
                <canvas
                    ref={canvasRef}
                    style={{
                        display: 'block',
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#000',
                        opacity: isLoaded ? 1 : 0,
                        transition: 'opacity 0.5s ease-in'
                    }}
                />
            )}
        </div>
    );
};

function randomColors(count) {
    return new Array(count).fill(0).map(
        () =>
            "#" +
            Math.floor(Math.random() * 16777215)
                .toString(16)
                .padStart(6, "0")
    );
}

export default TubeCursor;
