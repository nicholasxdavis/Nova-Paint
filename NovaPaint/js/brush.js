document.addEventListener("DOMContentLoaded", () => {
    const brushSizes = document.querySelectorAll(".brush-size");
    const brushSizeSlider = document.getElementById("brush-size-slider");
    const brushSizeValue = document.getElementById("brush-size-value");
    let currentBrushSize = 25; // Default brush size

    // Update the brush size based on the slider input
    brushSizeSlider.addEventListener("input", (e) => {
        currentBrushSize = e.target.value;
        brushSizeValue.textContent = currentBrushSize;
    });

    // Update the brush size based on the brush size buttons
    brushSizes.forEach(sizeButton => {
        sizeButton.addEventListener("click", () => {
            currentBrushSize = sizeButton.getAttribute("data-size");
            brushSizeValue.textContent = currentBrushSize;
            brushSizeSlider.value = currentBrushSize;
        });
    });

    // Export the current brush size to be used in the main drawing script
    window.getCurrentBrushSize = () => currentBrushSize;
});
