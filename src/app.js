import './style.css';

class SvgPolygon extends HTMLElement {
    constructor() {
        super();
        const shadowRoot = this.attachShadow({ mode: 'open' });
        shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    cursor: grab;
                    position: absolute; /* Make polygons positionable */
                    /* Set initial size for drag calculations */
                    width: 100px;
                    height: 100px;
                }
                svg {
                    width: 100%;
                    height: 100%;
                }
            </style>
            <svg viewBox="0 0 100 100"></svg>
        `;
        this.isDragging = false;
        this.offsetX = 0;
        this.offsetY = 0;

        this.addEventListener('mousedown', this.onMouseDown.bind(this));
    }

    set points(pointString) {
        const svg = this.shadowRoot.querySelector('svg');
        let polygon = svg.querySelector('polygon');
        if (!polygon) {
            polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            svg.appendChild(polygon);
        }
        polygon.setAttribute('points', pointString);
        polygon.setAttribute('fill', 'red');
    }

    onMouseDown(event) {
        if (this.parentElement === workingZoneContent) {
            this.isDragging = true;
            this.offsetX = event.clientX - this.getBoundingClientRect().left;
            this.offsetY = event.clientY - this.getBoundingClientRect().top;
            this.style.cursor = 'grabbing';
            event.stopPropagation();
        }
    }

    setPosition(x, y) {
        this.style.position = 'absolute';
        this.style.left = `${x}px`;
        this.style.top = `${y}px`;
    }
}

customElements.define('svg-polygon', SvgPolygon);

const createBtn = document.getElementById('create-btn');
const saveBtn = document.getElementById('save-btn');
const resetBtn = document.getElementById('reset-btn');
const resetZoomBtn = document.getElementById('reset-zoom-btn');
const bufferZone = document.querySelector('.buffer-zone');
const workingZone = document.querySelector('.working-zone');
const workingZoneContent = document.querySelector('.working-zone-content');
const coordScaleX = document.querySelector('.coord-scale-x');
const coordScaleY = document.querySelector('.coord-scale-y');

let currentZoom = 1;
let panOffsetX = 0;
let panOffsetY = 0;
let isPanning = false;
let initialPanX = 0;
let initialPanY = 0;

function applyZoomPan() {
    workingZoneContent.style.transform = `translate(${panOffsetX}px, ${panOffsetY}px) scale(${currentZoom})`;
    const gridSize = 20;
    workingZone.style.backgroundSize = `${gridSize * currentZoom}px ${gridSize * currentZoom}px`;

    updateCoordinateScale();
    updateZoomScale();
}

function updateCoordinateScale() {
    coordScaleX.innerHTML = '';
    coordScaleY.innerHTML = '';

    const workingZoneRect = workingZone.getBoundingClientRect();

    let scaleInterval = 100;
    if (currentZoom < 0.5) scaleInterval = 200;
    if (currentZoom < 0.2) scaleInterval = 500;
    if (currentZoom > 1.5) scaleInterval = 50;
    if (currentZoom > 3) scaleInterval = 20;
    if (currentZoom > 6) scaleInterval = 10;

    const visibleStartX = -panOffsetX / currentZoom;
    const visibleStartY = -panOffsetY / currentZoom;
    const visibleEndX = visibleStartX + workingZoneRect.width / currentZoom;
    const visibleEndY = visibleStartY + workingZoneRect.height / currentZoom;

    const firstX = Math.floor(visibleStartX / scaleInterval) * scaleInterval;
    for (let x = firstX; x < visibleEndX; x += scaleInterval) {
        const screenX = x * currentZoom + panOffsetX;
        if (screenX >= 0 && screenX <= workingZoneRect.width) {
            const span = document.createElement('span');
            span.textContent = Math.round(x);
            span.style.position = 'absolute';
            span.style.left = `${screenX}px`;
            span.style.transform = 'translateX(-50%)';
            span.style.bottom = '5px';
            coordScaleX.appendChild(span);
        }
    }

    const firstY = Math.floor(visibleStartY / scaleInterval) * scaleInterval;
    for (let y = firstY; y < visibleEndY; y += scaleInterval) {
        const screenY = y * currentZoom + panOffsetY;
        if (screenY >= 0 && screenY <= workingZoneRect.height) {
            const span = document.createElement('span');
            span.textContent = Math.round(y);
            span.style.position = 'absolute';
            span.style.top = `${screenY}px`;
            span.style.transform = 'translateY(-50%)';
            span.style.right = '5px';
            coordScaleY.appendChild(span);
        }
    }
}

function updateZoomScale() {
    const zoomScale = document.querySelector('.zoom-scale') || document.createElement('div');
    if (!document.querySelector('.zoom-scale')) {
        zoomScale.className = 'zoom-scale';
        zoomScale.style.position = 'absolute';
        zoomScale.style.top = '10px';
        zoomScale.style.left = '40px';
        zoomScale.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        zoomScale.style.color = 'white';
        zoomScale.style.padding = '5px 10px';
        zoomScale.style.borderRadius = '3px';
        zoomScale.style.fontSize = '12px';
        workingZone.appendChild(zoomScale);
    }
    zoomScale.textContent = `Масштаб: ${Math.round(currentZoom * 100)}%`;
}

function generateRandomPolygonPoints(numVertices) {
    const points = [];
    const centerX = 50;
    const centerY = 50;
    const maxRadius = 40;
    const minRadius = 20;

    const polarPoints = [];
    for (let i = 0; i < numVertices; i++) {
        const angle = (i * 2 * Math.PI / numVertices) + (Math.random() * 0.5 - 0.25);
        const radius = minRadius + Math.random() * (maxRadius - minRadius);
        polarPoints.push({ angle, radius });
    }

    polarPoints.sort((a, b) => a.angle - b.angle);

    for (const point of polarPoints) {
        const x = centerX + point.radius * Math.cos(point.angle);
        const y = centerY + point.radius * Math.sin(point.angle);
        points.push(`${x},${y}`);
    }

    return points.join(' ');
}

createBtn.addEventListener('click', () => {
    const numPolygons = Math.floor(Math.random() * 16) + 5;
    bufferZone.innerHTML = '';

    for (let i = 0; i < numPolygons; i++) {
        const numVertices = Math.floor(Math.random() * 5) + 3;
        const pointString = generateRandomPolygonPoints(numVertices);
        const polygonElement = new SvgPolygon();
        polygonElement.points = pointString;

        const bufferWidth = bufferZone.clientWidth;
        const bufferHeight = bufferZone.clientHeight;
        const polygonSize = 100;

        const randomX = Math.random() * (bufferWidth - polygonSize);
        const randomY = Math.random() * (bufferHeight - polygonSize);

        polygonElement.style.position = 'absolute';
        polygonElement.style.left = `${randomX}px`;
        polygonElement.style.top = `${randomY}px`;
        polygonElement.style.width = `${polygonSize}px`;
        polygonElement.style.height = `${polygonSize}px`;
        polygonElement.setAttribute('draggable', true);

        bufferZone.appendChild(polygonElement);
    }
});

let draggedItem = null;

document.addEventListener('dragstart', (event) => {
    if (event.target.tagName === 'SVG-POLYGON') {
        draggedItem = event.target;
        const rect = draggedItem.getBoundingClientRect();
        draggedItem.dragOffsetX = event.clientX - rect.left;
        draggedItem.dragOffsetY = event.clientY - rect.top;

        const dragImg = new Image();
        dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
        event.dataTransfer.setDragImage(dragImg, 0, 0);
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', '');
    }
});

document.addEventListener('dragover', (event) => {
    event.preventDefault();
    if (event.target === bufferZone || event.target === workingZoneContent || event.target.closest('.buffer-zone') || event.target.closest('.working-zone-content')) {
        event.dataTransfer.dropEffect = 'move';
    }
});

document.addEventListener('drop', (event) => {
    event.preventDefault();
    if (draggedItem) {
        const targetZone = event.target.closest('.buffer-zone') || event.target.closest('.working-zone-content');
        
        if (targetZone) {
            if (targetZone === workingZoneContent) {
                const mouseX = event.clientX;
                const mouseY = event.clientY;

                const workingZoneRect = workingZone.getBoundingClientRect();

                const relativeX = mouseX - workingZoneRect.left;
                const relativeY = mouseY - workingZoneRect.top;

                const worldX = (relativeX - panOffsetX) / currentZoom;
                const worldY = (relativeY - panOffsetY) / currentZoom;

                const scaledOffsetX = draggedItem.dragOffsetX / currentZoom;
                const scaledOffsetY = draggedItem.dragOffsetY / currentZoom;

                draggedItem.style.position = 'absolute';
                draggedItem.style.left = `${worldX - scaledOffsetX}px`;
                draggedItem.style.top = `${worldY - scaledOffsetY}px`;

                targetZone.appendChild(draggedItem);

                draggedItem.style.transform = 'none';
                draggedItem.style.transformOrigin = '0 0';
            } else {
                const targetRect = targetZone.getBoundingClientRect();
                const dropX = event.clientX - targetRect.left;
                const dropY = event.clientY - targetRect.top;

                draggedItem.style.position = 'absolute';
                draggedItem.style.left = `${dropX - draggedItem.dragOffsetX}px`;
                draggedItem.style.top = `${dropY - draggedItem.dragOffsetY}px`;
                targetZone.appendChild(draggedItem);
            }
        }
        draggedItem = null;
    }
});

document.addEventListener('dragstart', (event) => {
    if (event.target.tagName === 'IMG') {
        event.preventDefault();
    }
});

workingZone.addEventListener('wheel', (event) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = currentZoom * delta;

    if (newZoom > 0.1 && newZoom < 10) {
        const rect = workingZone.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        panOffsetX = mouseX - (mouseX - panOffsetX) * (newZoom / currentZoom);
        panOffsetY = mouseY - (mouseY - panOffsetY) * (newZoom / currentZoom);

        currentZoom = newZoom;
        applyZoomPan();
    }
});

workingZone.addEventListener('mousedown', (event) => {
    if (event.button === 0 && !event.target.closest('svg-polygon')) {
        isPanning = true;
        initialPanX = event.clientX;
        initialPanY = event.clientY;
        workingZone.style.cursor = 'grabbing';
        event.preventDefault();
    }
});

document.addEventListener('mousemove', (event) => {
    if (isPanning) {
        const deltaX = event.clientX - initialPanX;
        const deltaY = event.clientY - initialPanY;

        panOffsetX += deltaX;
        panOffsetY += deltaY;

        initialPanX = event.clientX;
        initialPanY = event.clientY;

        applyZoomPan();
        event.preventDefault();
    }
});

document.addEventListener('mouseup', (event) => {
    if (isPanning) {
        isPanning = false;
        workingZone.style.cursor = 'default';
        event.preventDefault();
    }
});

function savePolygons() {
    const polygonsData = [];
    workingZoneContent.querySelectorAll('svg-polygon').forEach(polygon => {
        const svgElement = polygon.shadowRoot.querySelector('svg');
        const polygonElementInside = svgElement.querySelector('polygon');
        const pointsAttribute = polygonElementInside ? polygonElementInside.getAttribute('points') : '';

        polygonsData.push({
            points: pointsAttribute,
            left: polygon.style.left,
            top: polygon.style.top,
            width: polygon.style.width,
            height: polygon.style.height
        });
    });
    localStorage.setItem('savedPolygons', JSON.stringify(polygonsData));
    localStorage.setItem('currentZoom', currentZoom.toString());
    localStorage.setItem('panOffset', JSON.stringify({ x: panOffsetX, y: panOffsetY }));
    console.log('Polygons saved to localStorage.');
}

function loadPolygons() {
    const savedPolygons = localStorage.getItem('savedPolygons');
    const savedZoom = localStorage.getItem('currentZoom');
    const savedPanOffset = localStorage.getItem('panOffset');

    if (savedZoom) {
        currentZoom = parseFloat(savedZoom);
    }
    if (savedPanOffset) {
        const { x, y } = JSON.parse(savedPanOffset);
        panOffsetX = x;
        panOffsetY = y;
    }

    if (savedPolygons) {
        const polygonsData = JSON.parse(savedPolygons);
        workingZoneContent.innerHTML = '';
        polygonsData.forEach(data => {
            const polygonElement = new SvgPolygon();
            polygonElement.points = data.points; 
            polygonElement.style.position = 'absolute';
            polygonElement.style.left = data.left;
            polygonElement.style.top = data.top;
            polygonElement.style.width = data.width;
            polygonElement.style.height = data.height;
            polygonElement.setAttribute('draggable', true);
            workingZoneContent.appendChild(polygonElement);
        });
        console.log('Polygons loaded from localStorage.');
    }
    applyZoomPan();
}

function resetPolygons() {
    localStorage.removeItem('savedPolygons');
    workingZoneContent.innerHTML = '';
    console.log('Polygons reset.');
}

function resetZoom() {
    currentZoom = 1;
    panOffsetX = 0;
    panOffsetY = 0;
    applyZoomPan();
}

saveBtn.addEventListener('click', savePolygons);
resetBtn.addEventListener('click', resetPolygons);
resetZoomBtn.addEventListener('click', resetZoom);

window.addEventListener('load', () => {
    loadPolygons();
    applyZoomPan(); 
}); 