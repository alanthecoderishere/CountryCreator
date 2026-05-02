const canvas = document.getElementById('mapCanvas');
const ctx = canvas.getContext('2d');
const modal = document.getElementById('countryModal');
const webhookUrl = "https://discord.com/api/webhooks/1499723920117465308/zQLQaFCN38t9H0F1o3N5A8Qk3VvekVB5ocxy7bk69_2--429ME78PQagIuQ2czMKUcTs";

let backgroundImage = new Image();
backgroundImage.src = 'Resources/Map.png';

let countries = JSON.parse(localStorage.getItem('savedCountries')) || [];
let currentPoints = [];
let mousePos = { x: 0, y: 0 };

const govData = {
    "Monarchy / Empire": ["Emperor", "King", "Sultan", "Emir"],
    "Republic": ["President"],
    "Theocratic": ["Caliph", "High Imam", "Ayatullah"],
    "International": ["International"]
};

// --- Coordinate Scaling (Sync Fix) ---
function screenToMap(x, y) {
    if (!backgroundImage.complete) return { x, y };
    const rect = canvas.getBoundingClientRect();
    const scaleX = backgroundImage.width / rect.width;
    const scaleY = backgroundImage.height / rect.height;
    return {
        x: (x - rect.left) * scaleX,
        y: (y - rect.top) * scaleY
    };
}

function mapToScreen(x, y) {
    if (!backgroundImage.complete) return { x, y };
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / backgroundImage.width;
    const scaleY = rect.height / backgroundImage.height;
    return {
        x: rect.left + (x * scaleX),
        y: rect.top + (y * scaleY)
    };
}

// Initialize
window.onload = () => {
    resize();
    populateSelects();
    updateCountryList();
    render();
};

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

// Input Handling
const mobileControls = document.getElementById('mobileControls');
const mobileCreateBtn = document.getElementById('mobileCreateBtn');
const undoBtn = document.getElementById('undoBtn');
const clearBtn = document.getElementById('clearBtn');

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // Left Click / Touch
        const mapPoint = screenToMap(e.clientX, e.clientY);
        currentPoints.push(mapPoint);
        updateMobileBtn();
    } else if (e.button === 2) { // Right Click
        handleFinish();
    }
});

undoBtn.onclick = () => {
    currentPoints.pop();
    updateMobileBtn();
};

clearBtn.onclick = () => {
    if (confirm("Clear current drawing?")) {
        currentPoints = [];
        updateMobileBtn();
    }
};

function handleFinish() {
    if (currentPoints.length >= 3) {
        modal.style.display = 'flex';
    } else if (currentPoints.length > 0) {
        alert("Need at least 3 points!");
    }
}

function updateMobileBtn() {
    mobileControls.style.display = currentPoints.length > 0 ? 'flex' : 'none';
    mobileCreateBtn.style.visibility = currentPoints.length >= 3 ? 'visible' : 'hidden';
}

mobileCreateBtn.onclick = handleFinish;

canvas.addEventListener('mousemove', (e) => {
    mousePos = screenToMap(e.clientX, e.clientY);
});

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

document.getElementById('cancelBtn').onclick = () => {
    currentPoints = [];
    updateMobileBtn();
    modal.style.display = 'none';
};

function saveData() {
    localStorage.setItem('savedCountries', JSON.stringify(countries));
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (backgroundImage.complete) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    }

    countries.forEach(c => {
        ctx.beginPath();
        const start = mapToScreen(c.points[0].x, c.points[0].y);
        ctx.moveTo(start.x, start.y);
        c.points.forEach(p => {
            const pos = mapToScreen(p.x, p.y);
            ctx.lineTo(pos.x, pos.y);
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.shadowBlur = 4;
        ctx.shadowColor = "black";
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Inter';
        let label = c.category === "International" ? `${c.rank} ${c.name}` : `${c.rank === 'King' ? 'Kingdom' : c.rank} of ${c.name}`;
        const screenPoints = c.points.map(p => mapToScreen(p.x, p.y));
        let center = getCenter(screenPoints);
        ctx.textAlign = 'center';
        ctx.fillText(label, center.x, center.y);
        ctx.shadowBlur = 0;
    });

    if (currentPoints.length > 0) {
        ctx.beginPath();
        const start = mapToScreen(currentPoints[0].x, currentPoints[0].y);
        ctx.moveTo(start.x, start.y);
        currentPoints.forEach(p => {
            const pos = mapToScreen(p.x, p.y);
            ctx.lineTo(pos.x, pos.y);
        });
        const mPos = mapToScreen(mousePos.x, mousePos.y);
        ctx.lineTo(mPos.x, mPos.y);
        ctx.strokeStyle = '#38bdf8';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        currentPoints.forEach(p => {
            const pos = mapToScreen(p.x, p.y);
            ctx.fillStyle = '#808080';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.stroke();
        });
    }
    requestAnimationFrame(render);
}

function getCenter(pts) {
    let x = pts.reduce((sum, p) => sum + p.x, 0) / pts.length;
    let y = pts.reduce((sum, p) => sum + p.y, 0) / pts.length;
    return { x, y };
}

function updateCountryList() {
    const list = document.querySelector('.list-container');
    list.innerHTML = countries.map((c, i) => `
        <div class="country-item">
            <div><span>${c.name}</span><br><small>${c.rank}</small></div>
            <button onclick="deleteCountry(${i})" style="background:none; color:var(--danger); border:none; cursor:pointer;">Delete</button>
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
    downloadAnchorNode.setAttribute("download", `GeoSandbox_Export_${new Date().getTime()}.json`);
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
