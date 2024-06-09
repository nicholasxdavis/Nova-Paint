document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('drawingCanvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    Drawing.initialize(canvas);

    const selectedImage = localStorage.getItem('selectedImage');
    if (selectedImage) {
        console.log('Loading selected image from localStorage:', selectedImage);
        Drawing.loadColoringPage(canvas, selectedImage);
    } else {
        console.log('No image selected.');
    }
});

const ColoringPageManager = (() => {
    function sendColoringPageToCanvas(canvas, imageUrl) {
        if (!canvas) {
            console.error('Canvas element not provided');
            return;
        }
        
        console.log('sendColoringPageToCanvas called with URL:', imageUrl);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('Unable to get 2D context from canvas');
            return;
        }

        const img = new Image();
        img.onload = () => {
            console.log('Image loaded');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            console.log('Image drawn on canvas');
        };
        img.onerror = (error) => {
            console.error('Error loading image', error);
        };
        img.src = imageUrl;
    }

    return {
        sendColoringPageToCanvas
    };
})();
