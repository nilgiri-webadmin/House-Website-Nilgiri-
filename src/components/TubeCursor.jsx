import React, { useEffect, useRef } from "react";

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

        (async () => {
            try {
                // Dynamic import from CDN as per the original component
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

                if (enableRandomizeOnClick) {
                    const handler = () => {
                        const colors = randomColors(initialColors.length);
                        const lights = randomColors(lightColors.length);
                        app.tubes.setColors(colors);
                        app.tubes.setLightsColors(lights);
                    };
                    // Bind click to canvas or container instead of body to respect section isolation? 
                    // Actually, if it's a cursor effect, usually it reacts to mouse movement globally or within area.
                    // Example code had click listener on document.body for randomizing colors.
                    // We can keep it or scope it. Let's scope it to the canvas parent if possible, or keep global if intended interaction.
                    // User said "in that specific area". Let's enable it on the canvas element click.
                    const element = canvasRef.current;
                    element.addEventListener("click", handler);
                    removeClick = () => element.removeEventListener("click", handler);
                }
            } catch (err) {
                console.error("Failed to load TubeCursor script", err);
            }
        })();

        return () => {
            destroyed = true;
            if (removeClick) removeClick();
            try {
                if (appRef.current && appRef.current.dispose) {
                    appRef.current.dispose();
                }
                appRef.current = null;
            } catch (e) {
                // ignore
            }
        };
    }, [initialColors, lightColors, lightIntensity, enableRandomizeOnClick]);

    return (
        <div className={`tube-cursor-wrapper ${className}`} style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
            {/* Background canvas */}
            <canvas
                ref={canvasRef}
                style={{ display: 'block', width: '100%', height: '100%' }}
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
