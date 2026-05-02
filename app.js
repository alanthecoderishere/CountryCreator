const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
const modal = document.getElementById('countryModal');
const webhookUrl = "https://discord.com/api/webhooks/1499723920117465308/zQLQaFCN38t9H0F1o3N5A8Qk3VvekVB5ocxy7bk69_2--429ME78PQagIuQ2czMKUcTs";

let backgroundImage = new Image();
backgroundImage.src = 'Resources/Map.png';

let countries = JSON.parse(localStorage.getItem('savedCountries')) || [];
let currentPoints = [];
let mousePos = { x: 0, y: 0 };

// --- Transformation State (Satu Komando) ---
let zoom = 1.0;
let offset = { x: 0, y: 0 };
let isPanning = false;
let startPan = { x: 0, y: 0 };

const govData = {
    "Monarchy / Empire": ["Emperor", "King", "Sultan", "Emir"],
    "Republic": ["President"],
    "Theocratic": ["Caliph", "High Imam", "Ayatullah"],
    "International": ["International"]
};

// --- Sync System ---
function screenToMap(x, y) {
    return {
        x: (x - offset.x) / zoom,
        y: (y - offset.y) / zoom
    };
}

function mapToScreen(x, y) {
    return {
        x: x * zoom + offset.x,
        y: y * zoom + offset.y
    };
}

// Initialize
window.onload = () => {
    resize();
    populateSelects();
    updateCountryList();
    if (backgroundImage.complete) centerMap();
    else backgroundImage.onload = centerMap;
    render();
};

function centerMap() {
    if (!backgroundImage.width) return;
    // Fit map to screen but keep aspect ratio
    const scale = Math.min(canvas.width / backgroundImage.width, canvas.height / backgroundImage.height) * 0.8;
    zoom = scale;
    offset.x = (canvas.width - backgroundImage.width * zoom) / 2;
    offset.y = (canvas.height - backgroundImage.height * zoom) / 2;
}

function populateSelects() {
    const catSelect = document.getElementById('govCategory');
    const rankSelect = document.getElementById('leaderRank');
    Object.keys(govData).forEach(cat => {
        let opt = document.createElement('option');
        opt.value = cat; opt.innerText = cat;
        catSelect.appendChild(opt);
    });
    const updateRanks = () => {
        rankSelect.innerHTML = '';
        govData[catSelect.value].forEach(rank => {
            let opt = document.createElement('option');
            opt.value = rank; opt.innerText = rank;
            rankSelect.appendChild(opt);
        });
    };
    catSelect.onchange = updateRanks;
    updateRanks();
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);

// --- Input Handling ---
const mobileControls = document.getElementById('mobileControls');
const mobileCreateBtn = document.getElementById('mobileCreateBtn');
const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
        isPanning = true;
        startPan = { x: e.clientX - offset.x, y: e.clientY - offset.y };
        canvas.style.cursor = 'grabbing';
        e.preventDefault();
        return;
    }
    if (e.button === 0) {
        const mapPoint = screenToMap(e.clientX, e.clientY);
        currentPoints.push(mapPoint);
        updateMobileBtn();
    } else if (e.button === 2) {
        handleFinish();
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
        offset.x = e.clientX - startPan.x;
        offset.y = e.clientY - startPan.y;
    } else {
        mousePos = screenToMap(e.clientX, e.clientY);
    }
});

window.addEventListener('mouseup', () => {
    isPanning = false;
    canvas.style.cursor = 'crosshair';
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomSpeed = 0.15;
    const mouseBefore = screenToMap(e.clientX, e.clientY);
    if (e.deltaY < 0) zoom *= (1 + zoomSpeed);
    else zoom /= (1 + zoomSpeed);
    offset.x = e.clientX - mouseBefore.x * zoom;
    offset.y = e.clientY - mouseBefore.y * zoom;
}, { passive: false });

// Touch Panning
let lastTouchDist = 0;
canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        isPanning = true;
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastTouchDist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        startPan = { x: (touch1.clientX + touch2.clientX) / 2 - offset.x, y: (touch1.clientY + touch2.clientY) / 2 - offset.y };
    }
}, { passive: false });

canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && isPanning) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        offset.x = (touch1.clientX + touch2.clientX) / 2 - startPan.x;
        offset.y = (touch1.clientY + touch2.clientY) / 2 - startPan.y;
        const dist = Math.hypot(touch2.clientX - touch1.clientX, touch2.clientY - touch1.clientY);
        const zoomFactor = dist / lastTouchDist;
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        const centerY = (touch1.clientY + touch2.clientY) / 2;
        const mapCenter = screenToMap(centerX, centerY);
        zoom *= zoomFactor;
        lastTouchDist = dist;
        offset.x = centerX - mapCenter.x * zoom;
        offset.y = centerY - mapCenter.y * zoom;
    }
}, { passive: false });

canvas.addEventListener('touchend', () => { isPanning = false; });

undoBtn.onclick = () => { currentPoints.pop(); updateMobileBtn(); };
clearBtn.onclick = () => { if (confirm("Clear current drawing?")) { currentPoints = []; updateMobileBtn(); } };

function handleFinish() {
    if (currentPoints.length >= 3) modal.style.display = 'flex';
    else if (currentPoints.length > 0) alert("Need at least 3 points!");
}

function updateMobileBtn() {
    if (mobileControls) {
        mobileControls.style.display = currentPoints.length > 0 ? 'flex' : 'none';
        mobileCreateBtn.style.visibility = currentPoints.length >= 3 ? 'visible' : 'hidden';
    }
}
mobileCreateBtn.onclick = handleFinish;

window.addEventListener('contextmenu', e => e.preventDefault());

document.getElementById('saveBtn').onclick = () => {
    const name = document.getElementById('countryName').value;
    const category = document.getElementById('govCategory').value;
    const rank = document.getElementById('leaderRank').value;
    if (!name) return alert("Enter country name!");
    const newCountry = { name, category, rank, points: [...currentPoints] };
    countries.push(newCountry);
    fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `NEW COUNTRY CREATED: **${name}** | ${rank}` })
    });
    saveData();
    currentPoints = [];
    updateMobileBtn();
    modal.style.display = 'none';
    document.getElementById('countryName').value = '';
    updateCountryList();
};

document.getElementById('cancelBtn').onclick = () => { currentPoints = []; updateMobileBtn(); modal.style.display = 'none'; };

function saveData() { localStorage.setItem('savedCountries', JSON.stringify(countries)); }

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // --- DRAW TRANSFORMED GROUP ---
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // 1. Draw Map
    if (backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0);
    } else {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 1000, 500);
    }

    // 2. Draw Borders (Automatically synced with map due to ctx.scale)
    countries.forEach(c => {
        if (!c.points || c.points.length < 3) return;
        ctx.beginPath();
        ctx.moveTo(c.points[0].x, c.points[0].y);
        c.points.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.closePath();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2 / zoom;
        ctx.stroke();
    });

    // 3. Draw Current Drawing
    if (currentPoints.length > 0) {
        ctx.beginPath();
        ctx.moveTo(currentPoints[0].x, currentPoints[0].y);
        currentPoints.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2 / zoom;
        ctx.setLineDash([5 / zoom, 5 / zoom]);
        ctx.stroke();
        ctx.setLineDash([]);
        currentPoints.forEach(p => {
            ctx.fillStyle = '#808080';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5 / zoom, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.stroke();
        });
    }
    
    ctx.restore();

    // 4. Draw Sharp UI Labels (Fixed position relative to screen-mapped center)
    countries.forEach(c => {
        const centerMap = getCenter(c.points);
        const centerScreen = mapToScreen(centerMap.x, centerMap.y);
        ctx.shadowBlur = 4;
        ctx.shadowColor = "black";
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Inter';
        const label = c.category === "International" ? `${c.rank} ${c.name}` : `${c.rank === 'King' ? 'Kingdom' : c.rank} of ${c.name}`;
        ctx.textAlign = 'center';
        ctx.fillText(label, centerScreen.x, centerScreen.y);
        ctx.shadowBlur = 0;
    });

    requestAnimationFrame(render);
}

function getCenter(pts) {
    if (pts.length === 0) return { x: 0, y: 0 };
    let x = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
    let y = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
    return { x, y };
}

function updateCountryList() {
    const list = document.querySelector('.list-container');
    if (!list) return;
    list.innerHTML = countries.map((c, i) => `
        <div class="country-item">
            <div><span>${c.name}</span><br><small>${c.rank}</small></div>
            <button onclick="deleteCountry(${i})" class="action-btn-small danger" style="padding: 4px 8px; font-size: 0.7rem;">Delete</button>
        </div>
    `).join('');
}

window.deleteCountry = (index) => {
    if (confirm(`Delete ${countries[index].name}?`)) {
        fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: `COUNTRY DEFEATED/DELETED: **${countries[index].name}** | Status: Fallen` })
        });
        countries.splice(index, 1);
        saveData();
        updateCountryList();
    }
};

document.getElementById('exportBtn').onclick = () => {
    if (countries.length === 0) return alert("No countries to export!");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(countries, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `GeoSandbox_Export.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
};

const fileInput = document.getElementById('fileInput');
document.getElementById('importBtn').onclick = () => fileInput.click();
fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
                if (confirm(`Import ${imported.length} countries?`)) {
                    countries = [...countries, ...imported];
                    saveData();
                    updateCountryList();
                }
            }
        } catch (err) { alert("Invalid JSON!"); }
    };
    reader.readAsText(file);
};
