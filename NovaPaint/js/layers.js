// layers.js
let layerCounter = 0;
let layers = [];
let activeLayerIndex = 0;

function handleLayerDragStart(e) {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget);
    this.classList.add('dragging');
    // Store the original index of the dragging layer
    this.dataset.originalIndex = Array.from(this.parentNode.children).indexOf(this);
}

function handleLayerDragEnter(e) {
    if (e.currentTarget !== this) {
        const draggingLayer = document.querySelector('.layer-item.dragging');
        const thisLayer = e.currentTarget;
        const draggingLayerIndex = Array.from(this.parentNode.children).indexOf(draggingLayer);
        const thisLayerIndex = Array.from(this.parentNode.children).indexOf(thisLayer);

        const previousPlaceholder = document.querySelector('.layer-placeholder');
        if (previousPlaceholder) {
            previousPlaceholder.remove();
        }

        const placeholder = document.createElement('li');
        placeholder.classList.add('layer-placeholder');
        this.parentNode.insertBefore(placeholder, this);

        draggingLayer.dataset.isBeingMoved = true;

        // Only update the order if the dragging layer is not already at this position
        if (draggingLayerIndex !== thisLayerIndex) {
            if (draggingLayerIndex < thisLayerIndex) {
                this.parentNode.insertBefore(draggingLayer, this.nextSibling);
            } else {
                this.parentNode.insertBefore(draggingLayer, this);
            }
        }
    }
}

function handleLayerDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
}

function handleLayerDragLeave(e) {
    const draggingLayer = document.querySelector('.layer-item.dragging');
    if (!e.relatedTarget || (e.currentTarget === draggingLayer.parentNode && !draggingLayer.contains(e.relatedTarget))) {
        cancelLayerDrag(draggingLayer);
    }
}

function cancelLayerDrag(draggingLayer) {
    const originalIndex = parseInt(draggingLayer.dataset.originalIndex);
    const placeholder = document.querySelector('.layer-placeholder');
    if (placeholder) {
        placeholder.remove();
    }
    draggingLayer.dataset.isBeingMoved = false;

    // Revert the dragging layer back to its original position
    const parent = draggingLayer.parentNode;
    const siblings = Array.from(parent.children);
    const currentIndex = siblings.indexOf(draggingLayer);
    if (currentIndex !== originalIndex) {
        if (originalIndex < currentIndex) {
            parent.insertBefore(draggingLayer, siblings[originalIndex].nextSibling);
        } else {
            parent.insertBefore(draggingLayer, siblings[originalIndex]);
        }
        updateLayerOrder();
    }
}

function handleLayerDrop(e) {
    e.preventDefault();
    const draggingLayer = document.querySelector('.layer-item.dragging');
    draggingLayer.classList.remove('dragging');
    const draggingLayerIndex = Array.from(this.parentNode.children).indexOf(draggingLayer);
    const thisLayerIndex = Array.from(this.parentNode.children).indexOf(this);

    const placeholder = this.previousElementSibling;
    if (placeholder && placeholder.classList.contains('layer-placeholder')) {
        placeholder.remove();
    }

    draggingLayer.dataset.isBeingMoved = false;

    // Determine the position to insert the dragging layer
    if (draggingLayerIndex !== thisLayerIndex) {
        if (draggingLayerIndex < thisLayerIndex) {
            // If the dragging layer is above the target layer, insert it after the target layer
            this.parentNode.insertBefore(draggingLayer, this.nextSibling);
        } else {
            // If the dragging layer is below the target layer, insert it before the target layer
            this.parentNode.insertBefore(draggingLayer, this);
        }
        updateLayerOrder();
    }
}

function updateLayerOrder() {
    layers = Array.from(document.getElementById('layer-list').querySelectorAll('.layer-item'))
        .map(layer => layers.find(l => l.element.dataset.layerId === layer.dataset.layerId))
        .filter(layer => layer !== undefined);

    renderAllLayers(ctx, layers);
    setActiveLayer(layers.findIndex(layer => layer.id === activeLayerIndex));
}

const Layers = (() => {
    function createLayer(ctx, canvas, layerList) {
        const layerCanvas = document.createElement('canvas');
        const layerCtx = layerCanvas.getContext('2d');
        layerCanvas.width = canvas.width;
        layerCanvas.height = canvas.height;
        layerCanvas.classList.add('hidden');

        const li = document.createElement('li');
        li.classList.add('layer-item');
        li.dataset.layerId = layerCounter;
        li.draggable = true;
        li.addEventListener('dragstart', handleLayerDragStart);
        li.addEventListener('dragenter', handleLayerDragEnter);
        li.addEventListener('dragover', handleLayerDragOver);
        li.addEventListener('dragleave', handleLayerDragLeave);
        li.addEventListener('drop', handleLayerDrop);

        const snapshotImg = document.createElement('img');
        snapshotImg.src = getLayerSnapshot(layerCanvas);
        snapshotImg.alt = 'Layer Snapshot';
        snapshotImg.className = 'layer-snapshot';

        const layerText = document.createElement('input');
        layerText.type = 'text';
        layerText.value = 'Layer ' + layerCounter;
        layerText.className = 'layer-name';
        layerText.addEventListener('blur', updateLayerNames);
        layerText.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                layerText.blur();
            }
        });

        const optionsBtn = document.createElement('button');
        optionsBtn.className = 'options-layer-btn';
        optionsBtn.innerHTML = '<img src="img/dots.svg" alt="Options" class="icon">';

        const dropdownMenu = document.createElement('ul');
        dropdownMenu.className = 'dropdown-menu';
        dropdownMenu.innerHTML = `
            <li class="dropdown-item delete-layer">Delete</li>
            <li class="dropdown-item duplicate-layer">Duplicate</li>
        `;

        optionsBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            dropdownMenu.classList.toggle('show');
        });

        document.addEventListener('click', function () {
            dropdownMenu.classList.remove('show');
        });

        dropdownMenu.querySelector('.delete-layer').addEventListener('click', function () {
            const layerId = parseInt(li.dataset.layerId);
            layers = layers.filter(layer => layer.id !== layerId);
            layerList.removeChild(li);
            updateLayerNames();
            renderAllLayers(ctx, layers);
            if (activeLayerIndex === layers.length) {
                activeLayerIndex--;
            }
            setActiveLayer(activeLayerIndex);
        });

        dropdownMenu.querySelector('.duplicate-layer').addEventListener('click', function () {
            const layerId = parseInt(li.dataset.layerId);
            const originalLayer = layers.find(layer => layer.id === layerId);
            createLayer(ctx, canvas, layerList);
            const newLayer = layers[layers.length - 1];
            newLayer.context.drawImage(originalLayer.canvas, 0, 0);
            updateLayerSnapshot(newLayer);
            renderAllLayers(ctx, layers);
        });

        li.appendChild(snapshotImg);
        li.appendChild(layerText);
        li.appendChild(optionsBtn);
        li.appendChild(dropdownMenu);

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
            snapshot: snapshotImg,
            nameInput: layerText
        });

        layerCounter++;
        updateLayerNames();
        renderAllLayers(ctx, layers);
        document.body.appendChild(layerCanvas);
        setActiveLayer(layers.length - 1);
    }

    function getLayerSnapshot(layerCanvas) {
        return layerCanvas.toDataURL("image/png");
    }

    function updateLayerSnapshot(layer) {
        layer.snapshot.src = getLayerSnapshot(layer.canvas);
    }

    function updateLayerNames() {
        const layersList = document.getElementById('layer-list').querySelectorAll('.layer-item');
        layersList.forEach((layer, index) => {
            const nameInput = layer.querySelector('.layer-name');
            if (!nameInput.value.trim()) {
                nameInput.value = 'Layer ' + (index + 1);
            }
        });
    }

    function renderAllLayers(ctx, layers) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        layers.forEach(layer => {
            ctx.drawImage(layer.canvas, 0, 0);
        });
    }

    function setActiveLayer(index) {
        layers.forEach((layer, idx) => {
            if (idx === index) {
                layer.element.classList.add('active');
                layer.snapshot.classList.add('selected');
            } else {
                layer.element.classList.remove('active');
                layer.snapshot.classList.remove('selected');
            }
        });
        activeLayerIndex = index;
    }

    return {
        createLayer,
        getLayerSnapshot,
        updateLayerSnapshot,
        updateLayerNames,
        renderAllLayers,
        setActiveLayer
    };
})();
