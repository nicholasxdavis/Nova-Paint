document.addEventListener("DOMContentLoaded", () => {
    // ... existing code ...
    // Key bindings
    document.addEventListener("keydown", (e) => {
        // Brush Size adjustment: [ for decrease, ] for increase
        if (e.key === "[" || e.key === "]") {
            e.preventDefault();
            const brushSizeSlider = document.getElementById("brush-size-slider");
            let currentBrushSize = parseInt(brushSizeSlider.value);
            if (e.key === "[" && currentBrushSize > parseInt(brushSizeSlider.min)) {
                brushSizeSlider.value = currentBrushSize - 1;
            } else if (e.key === "]" && currentBrushSize < parseInt(brushSizeSlider.max)) {
                brushSizeSlider.value = currentBrushSize + 1;
            }
            // Apply the new brush size
            const event = new Event("input");
            brushSizeSlider.dispatchEvent(event);
        }

        // Undo: Ctrl + Z
        if (e.ctrlKey && e.key === "z") {
            undo();
        }

        // Redo: Ctrl + Shift + Z or Ctrl + Y
        if (e.ctrlKey && (e.key === "y" || (e.shiftKey && e.key === "Z"))) {
            redo();
        }

        // Save: Ctrl + S
        if (e.ctrlKey && e.key === "s") {
            e.preventDefault(); // Prevent browser default save behavior
            downloadImage();
        }

        // Copy: Ctrl + C
        if (e.ctrlKey && e.key === "c") {
            e.preventDefault(); // Prevent browser default copy behavior
            copyImage();
        }

        // Paste: Ctrl + V
        if (e.ctrlKey && e.key === "v") {
            e.preventDefault(); // Prevent browser default paste behavior
            pasteImage();
        }
    });

    // Function to copy the current canvas image
    function copyImage() {
        const compositeCanvas = document.createElement("canvas");
        const compositeCtx = compositeCanvas.getContext("2d");
        compositeCanvas.width = canvas.width;
        compositeCanvas.height = canvas.height;
        compositeCtx.drawImage(layers[activeLayerIndex].canvas, 0, 0);
        const imageData = compositeCanvas.toDataURL();
        localStorage.setItem("copiedImage", imageData);
    }

    // Function to paste the copied image onto the canvas
    function pasteImage() {
        const imageData = localStorage.getItem("copiedImage");
        if (imageData) {
            const img = new Image();
            img.onload = function () {
                ctx.drawImage(img, 0, 0);
            };
            img.src = imageData;
        }
    }

    // ... existing code ...
});