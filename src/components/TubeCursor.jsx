import React, { useEffect, useRef } from "react";

function isWebGLAvailable() {
    try {
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl2") || canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
        return !!(window.WebGLRenderingContext && gl);
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

    useEffect(() => {
        let removeClick = null;
        let destroyed = false;

        if (!isWebGLAvailable()) {
            console.warn("WebGL is not available in this browser environment. TubeCursor 3D background gracefully disabled.");
            return;
        }

        (async () => {
            try {
                // Dynamic import from CDN
                const mod = await import(
                    /* webpackIgnore: true */
                    "https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js"
                );
                const TubesCursorCtor = mod.default || mod;

                if (!canvasRef.current || destroyed) return;

                const app = TubesCursorCtor(canvasRef.current, {
                    tubes: {
                        colors: initialColors,
                        lights: {
                            intensity: lightIntensity,
                            colors: lightColors,
                        },
                    },
                });

                appRef.current = app;

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
                console.warn("Failed to load or initialize TubeCursor script:", err);
            }
        })();

        return () => {
            destroyed = true;
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
            {/* Background canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#000'
                }}
            />
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
