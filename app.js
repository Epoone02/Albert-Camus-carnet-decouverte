/**
 * Application : Carnet de Découvertes Artistiques
 * Description : Gestion de la collection d'œuvres, reconnaissance d'image et atelier pixel art.
 */

// ============================================================================
// 📊 BASE DE DONNÉES DES ŒUVRES
// ============================================================================
const database = {
    "sujet1": {
        title: "Le Crâne",
        desc: "Une étude anatomique réalisée dans le cadre d'un projet artistique.",
        avatar: "image/crane.jpg",
        author: "Anonyme",
        classLevel: "Art et Design",
        date: "2024"
    },
    "sujet2": {
        title: "Stitch",
        desc: "Représentation stylisée du personnage célèbre en peinture.",
        avatar: "image/stitch.jpg",
        author: "Artiste Local",
        classLevel: "Arts Plastiques",
        date: "2023"
    },
    "sujet3": {
        title: "Bulbizarre",
        desc: "Une œuvre inspirée de la pop culture japonaise.",
        avatar: "image/bulbizare.jpg",
        author: "Anonyme",
        classLevel: "Arts Visuels",
        date: "2024"
    },
    "sujet4": {
        title: "Composition Pixel",
        desc: "Première exploration de l'art numérique pointilliste.",
        avatar: "image/pixelart.png",
        author: "Explorateur",
        classLevel: "Numérique",
        date: "2025"
    }
};

const UNKNOWN_IMG = "image/interrogation.png";
const SEUIL_CONFIANCE = 0.85;
const MODEL_PATH = "https://epoone02.github.io/Albert-Camus-carnet-decouverte/model/";

let model = null;
let webcamStream = null;
let predictionLoop = null;

// ============================================================================
// INITIALISATION
// ============================================================================
window.addEventListener('DOMContentLoaded', () => {
    loadUsername();
    loadTheme();
    generateGrid();
    checkSavedItems();
});

// ============================================================================
// GESTION DU PROFIL ET THÈME
// ============================================================================
function loadUsername() {
    const savedName = localStorage.getItem("app_username") || "Explorateur";
    document.getElementById("app-title").innerText = "Carnet de " + savedName;
    document.getElementById("username-input").value = savedName;
}

function loadTheme() {
    const savedTheme = localStorage.getItem("app_theme") || "default";
    if (localStorage.getItem("custom_hue_primary")) {
        document.getElementById("hue-primary").value = localStorage.getItem("custom_hue_primary");
    }
    if (localStorage.getItem("custom_hue_secondary")) {
        document.getElementById("hue-secondary").value = localStorage.getItem("custom_hue_secondary");
    }
    updateCustomVariables();
    applyTheme(savedTheme);
}

function applyTheme(theme) {
    document.body.classList.remove("theme-dark", "theme-night", "theme-violet", "theme-green", "theme-custom");
    if (theme !== "default") document.body.classList.add(theme);

    const pickers = document.getElementById("custom-theme-pickers");
    theme === "theme-custom" ? pickers.classList.remove("hidden") : pickers.classList.add("hidden");

    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.classList.toggle('active', dot.dataset.theme === theme);
    });
}

function updateCustomVariables() {
    const h1 = document.getElementById("hue-primary").value;
    const h2 = document.getElementById("hue-secondary").value;
    document.documentElement.style.setProperty('--custom-primary', `hsl(${h1}, 70%, 40%)`);
    document.documentElement.style.setProperty('--custom-primary-dark', `hsl(${h1}, 70%, 30%)`);
    document.documentElement.style.setProperty('--custom-secondary', `hsl(${h2}, 80%, 75%)`);
    localStorage.setItem("custom_hue_primary", h1);
    localStorage.setItem("custom_hue_secondary", h2);
}

document.querySelectorAll('.theme-dot').forEach(dot => {
    dot.addEventListener('click', () => {
        const theme = dot.dataset.theme;
        localStorage.setItem("app_theme", theme);
        applyTheme(theme);
    });
});

document.getElementById("hue-primary").addEventListener("input", updateCustomVariables);
document.getElementById("hue-secondary").addEventListener("input", updateCustomVariables);

document.getElementById("btn-save-name").addEventListener("click", () => {
    const name = document.getElementById("username-input").value.trim() || "Explorateur";
    localStorage.setItem("app_username", name);
    loadUsername();
    toggleSidebar(false);
});

// ============================================================================
// NAVIGATION ET SIDEBAR
// ============================================================================
function toggleSidebar(show) {
    const sidebar = document.getElementById("sidebar");
    show ? sidebar.classList.remove("hidden") : sidebar.classList.add("hidden");
}
document.getElementById("btn-menu").addEventListener("click", () => toggleSidebar(true));
document.getElementById("btn-close-menu").addEventListener("click", () => toggleSidebar(false));
document.getElementById("sidebar-overlay").addEventListener("click", () => toggleSidebar(false));

// ============================================================================
// GESTION DE LA COLLECTION
// ============================================================================
function generateGrid() {
    const grid = document.getElementById('collection-grid');
    grid.innerHTML = '';
    document.getElementById('total-count').innerText = Object.keys(database).length;

    for (const [id, data] of Object.entries(database)) {
        const card = document.createElement('div');
        card.className = 'card locked';
        card.id = `item-${id}`;
        card.innerHTML = `
            <img src="${UNKNOWN_IMG}" class="pixel-avatar" alt="Inconnu">
            <h3>À découvrir</h3>
            <span class="status">Mystère</span>
        `;
        grid.appendChild(card);
    }
}

function checkSavedItems() {
    let count = 0;
    const ids = Object.keys(database);
    ids.forEach(id => {
        if (localStorage.getItem("art_scanned_" + id) === "true") {
            unlockCard(id);
            count++;
        }
    });
    document.getElementById('captured-count').innerText = count;
    const percent = ids.length === 0 ? 0 : (count / ids.length) * 100;
    document.getElementById('progress-bar').style.width = percent + "%";

    if (count === ids.length && ids.length > 0 && sessionStorage.getItem("victory_shown") !== "true") {
        setTimeout(showVictory, 1000);
    }
}

function unlockCard(id) {
    const card = document.getElementById(`item-${id}`);
    const data = database[id];
    if (!card) return;
    card.classList.remove('locked');
    card.innerHTML = `
        <img src="${data.avatar}" class="pixel-avatar" alt="${data.title}" onerror="this.src='${UNKNOWN_IMG}'">
        <h3>${data.title}</h3>
        <span class="status unlocked">Consultable</span>
    `;
    card.onclick = () => openDetailView(id);
    card.style.cursor = "pointer";
}

function openDetailView(id) {
    const data = database[id];
    document.getElementById("detail-img").src = data.avatar;
    document.getElementById("detail-title").innerText = data.title;
    document.getElementById("detail-author").innerText = data.author;
    document.getElementById("detail-class").innerText = data.classLevel;
    document.getElementById("detail-date").innerText = data.date;
    document.getElementById("detail-desc").innerText = data.desc;
    document.getElementById("collection-screen").classList.add("hidden");
    document.getElementById("detail-screen").classList.remove("hidden");
}

document.getElementById("btn-close-detail").addEventListener("click", () => {
    document.getElementById("detail-screen").classList.add("hidden");
    document.getElementById("collection-screen").classList.remove("hidden");
});

// ============================================================================
// RECONNAISSANCE VISUELLE (SCANNER)
// ============================================================================
document.getElementById('btn-scan').addEventListener('click', async () => {
    document.getElementById('collection-screen').classList.add('hidden');
    document.getElementById('scanner-screen').classList.remove('hidden');
    await startScanner();
});

async function startScanner() {
    setStatus("Démarrage de la caméra...");
    try {
        webcamStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
        document.getElementById('webcam').srcObject = webcamStream;
    } catch (err) {
        setStatus("❌ Erreur caméra : " + err.message);
        return;
    }

    if (!model) {
        setStatus("Chargement de l'IA...");
        try {
            model = await tmImage.load(MODEL_PATH + "model.json", MODEL_PATH + "metadata.json");
            setStatus("✅ Prêt pour le scan !");
        } catch (err) {
            setStatus("❌ Erreur modèle : " + err.message);
            return;
        }
    } else {
        setStatus("✅ Prêt pour le scan !");
    }
    predictionLoop = setInterval(predict, 500);
}

async function predict() {
    const video = document.getElementById('webcam');
    if (!model || video.readyState < 2) return;
    const predictions = await model.predict(video);
    const best = predictions.reduce((a, b) => a.probability > b.probability ? a : b);

    if (best.probability >= SEUIL_CONFIANCE) {
        let id = best.className.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "_");
        if (!database[id]) id = best.className.toLowerCase().trim();
        if (database[id]) {
            if (localStorage.getItem("art_scanned_" + id) === "true") {
                setStatus("⭐ Déjà découvert : " + database[id].title);
            } else {
                stopScanner();
                localStorage.setItem("art_scanned_" + id, "true");
                document.getElementById('scanner-screen').classList.add('hidden');
                checkSavedItems();
                openDetailView(id);
            }
        }
    } else {
        setStatus("✅ Prêt pour le scan !");
    }
}

function setStatus(msg) { document.getElementById('scan-status').innerText = msg; }

function stopScanner() {
    clearInterval(predictionLoop);
    if (webcamStream) webcamStream.getTracks().forEach(t => t.stop());
}

document.getElementById('btn-close-scan').addEventListener('click', () => {
    stopScanner();
    document.getElementById('scanner-screen').classList.add('hidden');
    document.getElementById('collection-screen').classList.remove('hidden');
});

// ============================================================================
// ÉCRAN DE VICTOIRE
// ============================================================================
function showVictory() {
    sessionStorage.setItem("victory_shown", "true");
    const name = localStorage.getItem("app_username") || "Explorateur";
    document.getElementById("victory-message").innerText = `Félicitations ${name}, tu as découvert l'intégralité de la collection !`;
    document.getElementById('collection-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.remove('hidden');
}

document.getElementById("btn-close-victory").addEventListener("click", () => {
    document.getElementById("victory-screen").classList.add("hidden");
    document.getElementById("collection-screen").classList.remove("hidden");
});

// ============================================================================
// ATELIER PIXEL ART
// ============================================================================
let currentColor = "#000000";
let currentProjectId = null;
const pixelGrid = document.getElementById("pixel-grid");

document.getElementById("btn-open-pixelmaker").addEventListener("click", () => {
    toggleSidebar(false);
    document.getElementById("collection-screen").classList.add("hidden");
    document.getElementById("pixelmaker-screen").classList.remove("hidden");
    resetPixelMaker();
    loadPixelProjects();
});

document.getElementById("btn-close-pixelmaker").addEventListener("click", () => {
    document.getElementById("pixelmaker-screen").classList.add("hidden");
    document.getElementById("collection-screen").classList.remove("hidden");
});

function resetPixelMaker() {
    currentProjectId = null;
    document.getElementById("project-name").value = "";
    initPixelGrid();
}

function initPixelGrid(savedColors = null) {
    pixelGrid.innerHTML = "";
    for (let i = 0; i < 100; i++) {
        const cell = document.createElement("div");
        cell.className = "pixel-cell";
        cell.style.backgroundColor = (savedColors && savedColors[i]) ? savedColors[i] : "rgb(255, 255, 255)";
        cell.addEventListener("click", () => cell.style.backgroundColor = currentColor);
        pixelGrid.appendChild(cell);
    }
}

document.getElementById("pixel-hue").addEventListener("input", (e) => {
    currentColor = `hsl(${e.target.value}, 100%, 50%)`;
});

document.querySelectorAll(".swatch").forEach(swatch => {
    swatch.addEventListener("click", () => {
        currentColor = swatch.dataset.color;
        document.querySelectorAll(".swatch").forEach(s => s.classList.remove("active"));
        swatch.classList.add("active");
    });
});

document.getElementById("btn-save-pixel").addEventListener("click", () => {
    const name = document.getElementById("project-name").value.trim() || "Projet sans nom";
    const colors = Array.from(document.querySelectorAll(".pixel-cell")).map(c => c.style.backgroundColor);
    let projects = JSON.parse(localStorage.getItem("pixel_projects") || "[]");

    if (currentProjectId) {
        const idx = projects.findIndex(p => p.id === currentProjectId);
        if (idx !== -1) { projects[idx].name = name; projects[idx].colors = colors; }
    } else {
        projects.push({ id: Date.now(), name, colors });
    }
    localStorage.setItem("pixel_projects", JSON.stringify(projects));
    resetPixelMaker();
    loadPixelProjects();
});

function loadPixelProjects() {
    const list = document.getElementById("pixel-projects-list");
    list.innerHTML = "";
    const projects = JSON.parse(localStorage.getItem("pixel_projects") || "[]");
    projects.forEach(p => {
        const card = document.createElement("div");
        card.className = "project-card";
        const preview = document.createElement("div");
        preview.className = "project-preview";
        p.colors.forEach(c => {
            const pc = document.createElement("div");
            pc.className = "preview-cell";
            pc.style.backgroundColor = c;
            preview.appendChild(pc);
        });
        card.innerHTML = `<h4>${p.name}</h4>`;
        card.prepend(preview);
        card.onclick = () => {
            currentProjectId = p.id;
            document.getElementById("project-name").value = p.name;
            initPixelGrid(p.colors);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        };

        const actions = document.createElement("div");
        actions.style.display = "flex"; actions.style.gap = "5px"; actions.style.marginTop = "5px";

        const btnCopy = document.createElement("button");
        btnCopy.className = "btn-delete"; btnCopy.style.background = "var(--secondary)";
        btnCopy.style.color = "var(--primary)"; btnCopy.innerText = "Copier";
        btnCopy.onclick = (e) => {
            e.stopPropagation();
            projects.push({ id: Date.now(), name: p.name + " (Copie)", colors: [...p.colors] });
            localStorage.setItem("pixel_projects", JSON.stringify(projects));
            loadPixelProjects();
        };

        const btnDel = document.createElement("button");
        btnDel.className = "btn-delete"; btnDel.innerText = "Supprimer";
        btnDel.onclick = (e) => {
            e.stopPropagation();
            if(confirm("Supprimer ce projet ?")) {
                const updated = projects.filter(pr => pr.id !== p.id);
                localStorage.setItem("pixel_projects", JSON.stringify(updated));
                if (currentProjectId === p.id) resetPixelMaker();
                loadPixelProjects();
            }
        };
        actions.appendChild(btnCopy); actions.appendChild(btnDel);
        card.appendChild(actions);
        list.appendChild(card);
    });
}

// ============================================================================
// RÉINITIALISATION COMPLÈTE
// ============================================================================
document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm("⚠️ Voulez-vous vraiment tout réinitialiser ? (Collection, Nom, Thèmes et Pixel Art seront effacés)")) {
        // Efface absolument toutes les données stockées
        localStorage.clear();
        sessionStorage.clear();

        // Réactualise toute l'interface avec les valeurs par défaut
        toggleSidebar(false);
        loadUsername();
        loadTheme();
        generateGrid();
        checkSavedItems();
        loadPixelProjects();

        alert("Le carnet a été entièrement réinitialisé.");
    }
});
