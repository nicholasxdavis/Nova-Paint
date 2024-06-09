document.addEventListener("DOMContentLoaded", () => {
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
    };
}
