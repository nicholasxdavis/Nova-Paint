let drawing = false;
let lastX = 0;
let lastY = 0;
let undoStack = [];
let redoStack = [];
let isErrorPromptVisible = false;
let originalWidth, originalHeight;
let baseImage = null;  // Store the base image

const Drawing = (() => {
    function initialize(canvas) {
        originalWidth = canvas.width;
        originalHeight = canvas.height;

        window.addEventListener('resize', () => {
            resizeCanvas(canvas);
        });
    }

    function resizeCanvas(canvas) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = originalWidth;
        tempCanvas.height = originalHeight;

        tempCtx.drawImage(canvas, 0, 0);

        const newWidth = canvas.clientWidth;
        const newHeight = canvas.clientHeight;
        canvas.width = newWidth;
        canvas.height = newHeight;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);

        if (typeof Layers !== 'undefined') {
            Layers.renderAllLayers(ctx, layers);
        }
        if (baseImage) {
            ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
        }
    }

    function loadColoringPage(canvas, imageUrl) {
        if (typeof ColoringPageManager !== 'undefined') {
            ColoringPageManager.sendColoringPageToCanvas(canvas, imageUrl, (img) => {
                baseImage = img;  // Store the loaded image
            });
        } else {
            showError("Error: ColoringPageManager is not defined.");
        }
    }

    function startDrawing(e, ctx, layers, activeLayerIndex) {
        if (!layers[activeLayerIndex]) {
            showError("Error: No layer selected. Please select a layer to start drawing.");
            return;
        }
        drawing = true;
        const pos = getCursorPosition(e, ctx.canvas);
        [lastX, lastY] = [pos.x, pos.y];
        const activeLayer = layers[activeLayerIndex];
        undoStack.push(activeLayer.context.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height));
    }

    function draw(e, ctx, layers, activeLayerIndex, currentColor, erasing) {
        if (!drawing) return;
        const pos = getCursorPosition(e, ctx.canvas);
        const activeLayer = layers[activeLayerIndex];
        const layerCtx = activeLayer.context;
        layerCtx.lineJoin = "round";
        layerCtx.lineCap = "round";
        layerCtx.lineWidth = window.getCurrentBrushSize ? window.getCurrentBrushSize() : 5;
        layerCtx.strokeStyle = erasing ? "#ffffff" : currentColor;
        layerCtx.beginPath();
        layerCtx.moveTo(lastX, lastY);
        layerCtx.lineTo(pos.x, pos.y);
        layerCtx.stroke();
        [lastX, lastY] = [pos.x, pos.y];
        if (typeof Layers !== 'undefined') {
            Layers.updateLayerSnapshot(activeLayer);
            Layers.renderAllLayers(ctx, layers);
        }
    }

    function stopDrawing() {
        drawing = false;
    }

    function undo(ctx, layers, activeLayerIndex) {
        if (undoStack.length > 1) {
            const activeLayer = layers[activeLayerIndex];
            const layerCtx = activeLayer.context;
            redoStack.push(layerCtx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height));
            layerCtx.putImageData(undoStack.pop(), 0, 0);
            if (typeof Layers !== 'undefined') {
                Layers.updateLayerSnapshot(activeLayer);
                Layers.renderAllLayers(ctx, layers);
            }
            if (baseImage) {
                ctx.drawImage(baseImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
            }
        }
    }

    function redo(ctx, layers, activeLayerIndex) {
        if (redoStack.length > 0) {
            const activeLayer = layers[activeLayerIndex];
            const layerCtx = activeLayer.context;
            undoStack.push(layerCtx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height));
            layerCtx.putImageData(redoStack.pop(), 0, 0);
            if (typeof Layers !== 'undefined') {
                Layers.updateLayerSnapshot(activeLayer);
                Layers.renderAllLayers(ctx, layers);
            }
            if (baseImage) {
                ctx.drawImage(baseImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
            }
        }
    }

    function clearCanvas(ctx, layers, activeLayerIndex) {
        const activeLayer = layers[activeLayerIndex];
        const layerCtx = activeLayer.context;
        layerCtx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        undoStack.push(layerCtx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height));
        redoStack = [];
        if (typeof Layers !== 'undefined') {
            Layers.updateLayerSnapshot(activeLayer);
            Layers.renderAllLayers(ctx, layers);
        }
        if (baseImage) {
            ctx.drawImage(baseImage, 0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    }

    function downloadImage(canvas, layers) {
        const compositeCanvas = document.createElement("canvas");
        const compositeCtx = compositeCanvas.getContext("2d");
        compositeCanvas.width = originalWidth;
        compositeCanvas.height = originalHeight;
        compositeCtx.fillStyle = "#ffffff";
        compositeCtx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);
        if (baseImage) {
            compositeCtx.drawImage(baseImage, 0, 0, compositeCanvas.width, compositeCanvas.height);
        }
        layers.forEach(layer => {
            compositeCtx.drawImage(layer.canvas, 0, 0);
        });
        const image = compositeCanvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        const link = document.createElement("a");
        link.download = "drawing.png";
        link.href = image;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    function getCursorPosition(e, canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    function showError(message) {
        if (isErrorPromptVisible) return;
        isErrorPromptVisible = true;

        const errorPrompt = document.createElement('div');
        errorPrompt.style.position = 'fixed';
        errorPrompt.style.top = '10px';
        errorPrompt.style.left = '50%';
        errorPrompt.style.transform = 'translateX(-50%)';
        errorPrompt.style.backgroundColor = 'gray';
        errorPrompt.style.opacity = '80%';
        errorPrompt.style.color = 'white';
        errorPrompt.style.padding = '10px';
        errorPrompt.style.borderRadius = '5px';
        errorPrompt.style.zIndex = '1000';
        errorPrompt.innerText = message;
        document.body.appendChild(errorPrompt);

        setTimeout(() => {
            document.body.removeChild(errorPrompt);
            isErrorPromptVisible = false;
        }, 5000);
    }

    return {
        initialize,
        startDrawing,
        draw,
        stopDrawing,
        undo,
        redo,
        clearCanvas,
        downloadImage,
        loadColoringPage
    };
})();
