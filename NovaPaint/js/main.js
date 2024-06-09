// main.js
document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById("drawingCanvas");
    const ctx = canvas.getContext("2d");
    const colorInput = document.getElementById("color");
    const colorButtons = document.querySelectorAll(".color-btn");
    const clearButton = document.getElementById("clear");
    const undoButton = document.getElementById("undo");
    const redoButton = document.getElementById("redo");
    const downloadButton = document.getElementById("download");
    const eraseButton = document.querySelector(".erase-btn");
    const layerList = document.getElementById('layer-list');
    const addLayerBtn = document.getElementById('add-layer');

    let currentColor = "#000000";
    let erasing = false;

    canvas.width = canvas.parentElement.clientWidth - 40;
    canvas.height = 700;

    colorInput.addEventListener("input", updateColor);
    colorButtons.forEach(button => {
        button.addEventListener("click", () => {
            currentColor = button.style.backgroundColor;
            if (!erasing) {
                ctx.strokeStyle = currentColor;
            }
            deactivateEraser();
        });
    });
    eraseButton.addEventListener("click", toggleEraseMode);
    canvas.addEventListener("mousedown", startDrawing);
    canvas.addEventListener("mousemove", draw);
    canvas.addEventListener("mouseup", stopDrawing);
    canvas.addEventListener("mouseout", stopDrawing);
    undoButton.addEventListener("click", undo);
    redoButton.addEventListener("click", redo);
    clearButton.addEventListener("click", clearCanvas);
    downloadButton.addEventListener("click", downloadImage);
    addLayerBtn.addEventListener("click", createLayer);

    createLayer();

    function updateColor(e) {
        currentColor = e.target.value;
        if (!erasing) {
            ctx.strokeStyle = currentColor;
        }
        deactivateEraser();
    }

    function toggleEraseMode() {
    erasing = !erasing;
    if (erasing) {
        canvas.classList.add('erase-mode');
        ctx.strokeStyle = "#ffffff"; // Set the stroke color to white for erasing
    } else {
        canvas.classList.remove('erase-mode');
        ctx.strokeStyle = currentColor; // Restore the stroke color to the current color
    }
}

    function deactivateEraser() {
        erasing = false;
        canvas.style.cursor = "default";
        ctx.strokeStyle = currentColor;
    }

    function startDrawing(e) {
        Drawing.startDrawing(e, ctx, layers, activeLayerIndex);
    }

    function draw(e) {
        Drawing.draw(e, ctx, layers, activeLayerIndex, currentColor, erasing);
    }

    function stopDrawing() {
        Drawing.stopDrawing();
    }

    function undo() {
        Drawing.undo(ctx, layers, activeLayerIndex);
    }

    function redo() {
        Drawing.redo(ctx, layers, activeLayerIndex);
    }

    function clearCanvas() {
        Drawing.clearCanvas(ctx, layers, activeLayerIndex);
    }

    function downloadImage() {
        Drawing.downloadImage(canvas, layers);
    }

    function createLayer() {
        Layers.createLayer(ctx, canvas, layerList);
    }
});
