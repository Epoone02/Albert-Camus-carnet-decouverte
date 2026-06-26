// ============================================================================
// 📊 BASE DE DONNÉES DES ŒUVRES (FACILE À MODIFIER)
// ============================================================================
const database = {
    "sujet1": {
        title: "crane ",
        desc: "crane un peu moche c'est un test",
        avatar: "image/crane.jpg",
        author: "jsp qui",
        classLevel: "chepa au pif",
        date: "une anné"
    },
    "sujet2": {
        title: "Stitch ",
        desc: "Statut de stitch peinte oep tjr un test",
        avatar: "image/stitch.jpg",
        author: "un boug random",
        classLevel: "lezzzgoo",
        date: "uneeeee annnééé"
    },
    "sujet3": {
        title: "Bulbizarreee",
        desc: "un pokemon mon garssss WOWOWOWWOO",
        avatar: "image/bulbizare.jpg",
        author: "je sais tjr pas",
        classLevel: "j'aimerais savoir",
        date: "we are ch.... NAAAANN"
    },
    "sujet4": {
        title: "premier pixel",
        desc: "i did it bro",
        avatar: "image/pixelart.png",
        author: "Moi le goat",
        classLevel: "ecole inge",
        date: "25/06/2026"
    }
};

// Image par défaut quand l'œuvre n'est pas encore découverte
const UNKNOWN_IMG = "image/interrogation.png"

const SEUIL_CONFIANCE = 0.85;

// CORRECTION 1 : Ajout de "model/" à la fin de l'URL
const MODEL_PATH = "https://epoone02.github.io/Albert-Camus-carnet-decouverte/model/";

let model = null;
let webcamStream = null;
let predictionLoop = null;

// ==========================================
// INITIALISATION
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
    loadUsername();
    loadTheme();
    generateGrid();
    checkSavedItems();
});

// ==========================================
// GESTION DU NOM ET THÈME
// ==========================================
function loadUsername() {
    const savedName = localStorage.getItem("app_username") || "Explorateur";
    document.getElementById("app-title").innerText = "Carnet de " + savedName;
    document.getElementById("username-input").value = savedName;
}

function loadTheme() {
    const savedTheme = localStorage.getItem("app_theme") || "default";

    // Charger les teintes personnalisées si elles existent
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
    // Supprime tous les thèmes existants
    document.body.classList.remove("theme-dark", "theme-violet", "theme-green", "theme-custom");

    // Applique le nouveau si ce n'est pas le défaut
    if (theme !== "default") {
        document.body.classList.add(theme);
    }

    // Afficher/Cacher les curseurs de spectre pour le mode personnalisé
    const pickers = document.getElementById("custom-theme-pickers");
    if (theme === "theme-custom") {
        pickers.classList.remove("hidden");
    } else {
        pickers.classList.add("hidden");
    }

    // Met à jour l'état visuel des pastilles
    document.querySelectorAll('.theme-dot').forEach(dot => {
        dot.classList.toggle('active', dot.dataset.theme === theme);
    });
}

function updateCustomVariables() {
    const huePrimary = document.getElementById("hue-primary").value;
    const hueSecondary = document.getElementById("hue-secondary").value;

    const primaryColor = `hsl(${huePrimary}, 70%, 40%)`;
    const primaryDark = `hsl(${huePrimary}, 70%, 30%)`;
    const secondaryColor = `hsl(${hueSecondary}, 80%, 75%)`;

    document.documentElement.style.setProperty('--custom-primary', primaryColor);
    document.documentElement.style.setProperty('--custom-primary-dark', primaryDark);
    document.documentElement.style.setProperty('--custom-secondary', secondaryColor);

    // Sauvegarder
    localStorage.setItem("custom_hue_primary", huePrimary);
    localStorage.setItem("custom_hue_secondary", hueSecondary);
}

// Listeners pour les pastilles de thème
document.querySelectorAll('.theme-dot').forEach(dot => {
    dot.addEventListener('click', () => {
        const selectedTheme = dot.dataset.theme;
        localStorage.setItem("app_theme", selectedTheme);
        applyTheme(selectedTheme);
    });
});

// Listeners pour les curseurs de spectre
document.getElementById("hue-primary").addEventListener("input", updateCustomVariables);
document.getElementById("hue-secondary").addEventListener("input", updateCustomVariables);

document.getElementById("btn-save-name").addEventListener("click", () => {
    const newName = document.getElementById("username-input").value.trim() || "Explorateur";
    localStorage.setItem("app_username", newName);
    loadUsername();
    toggleSidebar(false);
});

// ==========================================
// MENU LATÉRAL (SIDEBAR)
// ==========================================
function toggleSidebar(show) {
    const sidebar = document.getElementById("sidebar");
    if (show) {
        sidebar.classList.remove("hidden");
    } else {
        sidebar.classList.add("hidden");
    }
}
document.getElementById("btn-menu").addEventListener("click", () => toggleSidebar(true));
document.getElementById("btn-close-menu").addEventListener("click", () => toggleSidebar(false));
document.getElementById("sidebar-overlay").addEventListener("click", () => toggleSidebar(false));

// ==========================================
// AFFICHAGE & PROGRESSION
// ==========================================
function generateGrid() {
    const grid = document.getElementById('collection-grid');
    grid.innerHTML = '';
    document.getElementById('total-count').innerText = Object.keys(database).length;

    for (const [id, data] of Object.entries(database)) {
        const card = document.createElement('div');
        card.className = 'card locked';
        card.id = `item-${id}`;

        // Par défaut : Inconnu avec l'image mystère
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
    const total = Object.keys(database).length;

    Object.keys(database).forEach(id => {
        if (localStorage.getItem("art_scanned_" + id) === "true") {
            unlockCard(id);
            count++;
        }
    });

    // Mise à jour de la barre et du texte
    document.getElementById('captured-count').innerText = count;
    const progressPercent = total === 0 ? 0 : (count / total) * 100;
    document.getElementById('progress-bar').style.width = progressPercent + "%";

    // Vérification de la victoire
    if (count === total && total > 0 && sessionStorage.getItem("victory_shown") !== "true") {
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

// ==========================================
// VUE DÉTAIL PLEINE PAGE
// ==========================================
function openDetailView(id) {
    const data = database[id];
    document.getElementById("detail-img").src = data.avatar;
    document.getElementById("detail-title").innerText = data.title;
    document.getElementById("detail-author").innerText = data.author;
    document.getElementById("detail-class").innerText = data.classLevel;
    document.getElementById("detail-date").innerText = data.date;
    document.getElementById("detail-desc").innerText = data.desc;

    document.getElementById("pokedex-screen").classList.add("hidden");
    document.getElementById("detail-screen").classList.remove("hidden");
}

document.getElementById("btn-close-detail").addEventListener("click", () => {
    document.getElementById("detail-screen").classList.add("hidden");
    document.getElementById("pokedex-screen").classList.remove("hidden");
});

// ==========================================
// SCANNER CAMÉRA
// ==========================================
document.getElementById('btn-scan').addEventListener('click', async () => {
    document.getElementById('pokedex-screen').classList.add('hidden');
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
            setStatus("✅ Pointe vers une œuvre !");
        } catch (err) {
            setStatus("❌ Erreur : " + err.message);
            return;
        }
    } else {
        setStatus("✅ Pointe vers une œuvre !");
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

                // Ferme le scanner, met à jour la progression et ouvre la fiche
                document.getElementById('scanner-screen').classList.add('hidden');
                checkSavedItems();
                openDetailView(id);
            }
        }
    } else {
        setStatus("✅ Pointe vers une œuvre !");
    }
}

function setStatus(msg) { document.getElementById('scan-status').innerText = msg; }

function stopScanner() {
    clearInterval(predictionLoop);
    if (webcamStream) { webcamStream.getTracks().forEach(t => t.stop()); }
}

document.getElementById('btn-close-scan').addEventListener('click', () => {
    stopScanner();
    document.getElementById('scanner-screen').classList.add('hidden');
    document.getElementById('pokedex-screen').classList.remove('hidden');
});

// ==========================================
// ÉCRAN DE VICTOIRE
// ==========================================
function showVictory() {
    sessionStorage.setItem("victory_shown", "true"); // Pour ne pas l'afficher en boucle
    const name = localStorage.getItem("app_username") || "Explorateur";
    document.getElementById("victory-message").innerText = `Félicitations ${name}, tu as découvert l'intégralité du patrimoine artistique !`;
    document.getElementById('pokedex-screen').classList.add('hidden');
    document.getElementById('victory-screen').classList.remove('hidden');
}

document.getElementById("btn-close-victory").addEventListener("click", () => {
    document.getElementById("victory-screen").classList.add("hidden");
    document.getElementById("pokedex-screen").classList.remove("hidden");
});

// ============================================================================
// 🎨 ATELIER PIXEL ART
// ============================================================================
let currentColor = "#000000";
let currentProjectId = null;
const pixelGrid = document.getElementById("pixel-grid");

document.getElementById("btn-open-pixelmaker").addEventListener("click", () => {
    toggleSidebar(false);
    document.getElementById("pokedex-screen").classList.add("hidden");
    document.getElementById("pixelmaker-screen").classList.remove("hidden");
    resetPixelMaker();
    loadPixelProjects();
});

document.getElementById("btn-close-pixelmaker").addEventListener("click", () => {
    document.getElementById("pixelmaker-screen").classList.add("hidden");
    document.getElementById("pokedex-screen").classList.remove("hidden");
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
        if (savedColors && savedColors[i]) {
            cell.style.backgroundColor = savedColors[i];
        } else {
            cell.style.backgroundColor = "rgb(255, 255, 255)";
        }
        cell.addEventListener("click", () => {
            cell.style.backgroundColor = currentColor;
        });
        pixelGrid.appendChild(cell);
    }
}

// Gestion des couleurs
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

// Sauvegarde
document.getElementById("btn-save-pixel").addEventListener("click", () => {
    const name = document.getElementById("project-name").value.trim() || "Projet sans nom";
    const cells = document.querySelectorAll(".pixel-cell");
    const colors = Array.from(cells).map(c => c.style.backgroundColor);

    let projects = JSON.parse(localStorage.getItem("pixel_projects") || "[]");

    if (currentProjectId) {
        const index = projects.findIndex(p => p.id === currentProjectId);
        if (index !== -1) {
            projects[index].name = name;
            projects[index].colors = colors;
        }
    } else {
        const project = { id: Date.now(), name, colors };
        projects.push(project);
    }

    localStorage.setItem("pixel_projects", JSON.stringify(projects));
    resetPixelMaker();
    alert("Projet enregistré !");
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
            const newProject = {
                id: Date.now(),
                name: p.name + " (Copie)",
                colors: [...p.colors]
            };
            let projs = JSON.parse(localStorage.getItem("pixel_projects") || "[]");
            projs.push(newProject);
            localStorage.setItem("pixel_projects", JSON.stringify(projs));
            loadPixelProjects();
        };

        const btnDel = document.createElement("button");
        btnDel.className = "btn-delete"; btnDel.innerText = "Supprimer";
        btnDel.onclick = (e) => {
            e.stopPropagation();
            if(confirm("Supprimer ce projet ?")) {
                let projs = JSON.parse(localStorage.getItem("pixel_projects") || "[]");
                projs = projs.filter(pr => pr.id !== p.id);
                localStorage.setItem("pixel_projects", JSON.stringify(projs));
                if (currentProjectId === p.id) resetPixelMaker();
                loadPixelProjects();
            }
        };

        actions.appendChild(btnCopy); actions.appendChild(btnDel);
        card.appendChild(actions);
        list.appendChild(card);
    });
}

// ==========================================
// RÉINITIALISATION
// ==========================================
document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm("Voulez-vous vraiment effacer toute la collection ?")) {
        Object.keys(database).forEach(id => localStorage.removeItem("art_scanned_" + id));
        sessionStorage.removeItem("victory_shown");
        toggleSidebar(false);
        generateGrid();
        checkSavedItems();
    }
});
