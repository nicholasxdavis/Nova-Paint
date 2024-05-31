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

            let drawing = false;
            let currentColor = "#000000";
            let lastX = 0;
            let lastY = 0;
            let undoStack = [];
            let redoStack = [];
            let erasing = false;
            let layerCounter = 0;
            let layers = [];
            let activeLayerIndex = 0;

            canvas.width = canvas.parentElement.clientWidth - 40;
            canvas.height = 700;

            colorInput.addEventListener("input", updateColor);
            colorButtons.forEach(button => {
                button.addEventListener("click", () => {
                    currentColor = button.style.backgroundColor;
                    if (!erasing) {
                        ctx.strokeStyle = currentColor;
                    }
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

            // Initialize the first layer on startup
            createLayer();

            function updateColor(e) {
                currentColor = e.target.value;
                if (!erasing) {
                    ctx.strokeStyle = currentColor;
                }
            }

            function toggleEraseMode() {
                erasing = !erasing;
                if (erasing) {
                    canvas.style.cursor = "url('img/erase-cursor.svg'), auto";
                    ctx.strokeStyle = "#ffffff";
                } else {
                    canvas.style.cursor = "default";
                    ctx.strokeStyle = currentColor;
                }
            }

            function startDrawing(e) {
                drawing = true;
                const pos = getCursorPosition(e);
                [lastX, lastY] = [pos.x, pos.y];
                undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
            }

            function draw(e) {
                if (!drawing) return;
                const pos = getCursorPosition(e);
                const activeLayer = layers[activeLayerIndex];
                const layerCtx = activeLayer.context;
                layerCtx.lineJoin = "round";
                layerCtx.lineCap = "round";
                layerCtx.lineWidth = window.getCurrentBrushSize();
                layerCtx.strokeStyle = erasing ? "#ffffff" : currentColor;
                layerCtx.beginPath();
                layerCtx.moveTo(lastX, lastY);
                layerCtx.lineTo(pos.x, pos.y);
                layerCtx.stroke();
                [lastX, lastY] = [pos.x, pos.y];
                updateLayerSnapshot(activeLayer);
                renderAllLayers();
            }

            function stopDrawing() {
                if (drawing) {
                    drawing = false;
                }
            }

            function drawWhiteDot() {
                const centerX = canvas.width / 2;
                const centerY = canvas.height / 2;
                ctx.fillStyle = "#ffffff";
                ctx.beginPath();
                ctx.arc(centerX, centerY, 5, 0, 2 * Math.PI);
                ctx.fill();
                undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
            }

            function undo() {
                if (undoStack.length > 1) {
                    redoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
                    ctx.putImageData(undoStack.pop(), 0, 0);
                }
            }

            function redo() {
                if (redoStack.length > 0) {
                    undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
                    ctx.putImageData(redoStack.pop(), 0, 0);
                }
            }

            function clearCanvas() {
                const activeLayer = layers[activeLayerIndex];
                const layerCtx = activeLayer.context;
                layerCtx.clearRect(0, 0, canvas.width, canvas.height);
                undoStack.push(ctx.getImageData(0, 0, canvas.width, canvas.height));
                redoStack = [];
                updateLayerSnapshot(activeLayer);
                renderAllLayers();
            }

            function downloadImage() {
                const compositeCanvas = document.createElement("canvas");
                const compositeCtx = compositeCanvas.getContext("2d");
                compositeCanvas.width = canvas.width;
                compositeCanvas.height = canvas.height;
                compositeCtx.fillStyle = "#ffffff";
                compositeCtx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);
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

            function getCursorPosition(e) {
                const rect = canvas.getBoundingClientRect();
                return {
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top
                };
            }

            function createLayer() {
                const layerCanvas = document.createElement('canvas');
                const layerCtx = layerCanvas.getContext('2d');
                layerCanvas.width = canvas.width;
                layerCanvas.height = canvas.height;
                layerCanvas.classList.add('hidden');

                const li = document.createElement('li');
                li.classList.add('layer-item');
                li.dataset.layerId = layerCounter;

                const snapshotImg = document.createElement('img');
                snapshotImg.src = getLayerSnapshot(layerCanvas);
                snapshotImg.alt = 'Layer Snapshot';
                snapshotImg.className = 'layer-snapshot';

                const layerText = document.createElement('span');
                layerText.textContent = 'Layer ' + layerCounter;
                layerCounter++;

                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'X';
                deleteBtn.className = 'delete-layer-btn';
                deleteBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    const layerId = parseInt(li.dataset.layerId);
                    layers = layers.filter(layer => layer.id !== layerId);
                    layerList.removeChild(li);
                    updateLayerNames();
                    renderAllLayers();
                    // Select a new active layer if the deleted layer was the active layer
                    if (activeLayerIndex === layers.length) {
                        activeLayerIndex--;
                    }
                    setActiveLayer(activeLayerIndex);
                });

                li.appendChild(snapshotImg);
                li.appendChild(layerText);
                li.appendChild(deleteBtn);
                li.addEventListener('click', function () {
                    const layerId = parseInt(li.dataset.layerId);
                    setActiveLayer(layers.findIndex(layer => layer.id === layerId));
                });
                layerList.appendChild(li);

                layers.push({
                    id: parseInt(li.dataset.layerId),
                    canvas: layerCanvas,
                    context: layerCtx,
                    element: li,
                    snapshot: snapshotImg
                });

                updateLayerNames();
                renderAllLayers();
                document.body.appendChild(layerCanvas);
                setActiveLayer(layers.length - 1); // Set the new layer as the active layer
            }

            function getLayerSnapshot(layerCanvas) {
                return layerCanvas.toDataURL("image/png");
            }

            function updateLayerSnapshot(layer) {
                layer.snapshot.src = getLayerSnapshot(layer.canvas);
            }

            function updateLayerNames() {
                const layersList = layerList.querySelectorAll('.layer-item');
                layersList.forEach((layer, index) => {
                    layer.querySelector('span').textContent = 'Layer ' + (index + 1);
                });
            }

            function renderAllLayers() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                layers.forEach(layer => {
                    ctx.drawImage(layer.canvas, 0, 0);
                });
            }

            function setActiveLayer(index) {
                layers.forEach((layer, idx) => {
                    if (idx === index) {
                        layer.element.classList.add('active');
                    } else {
                        layer.element.classList.remove('active');
                    }
                });
                activeLayerIndex = index;
            }
        });