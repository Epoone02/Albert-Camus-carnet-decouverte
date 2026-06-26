# 🎨 Carnet de Découvertes — Projet Albert Camus

> Une application hybride Web/Android qui transforme les œuvres des élèves en une collection numérique interactive, débloquée par reconnaissance d'image en temps réel.

---

## ✨ Fonctionnalités

### 🧠 Reconnaissance IA
Pointe la caméra vers une œuvre physique — l'app l'identifie instantanément grâce à un modèle *Teachable Machine* (TensorFlow.js) et la débloque dans le carnet.

### 📚 Carnet de Collection
Chaque œuvre débloquée révèle sa fiche complète : nom de l'élève, classe, date de création et description. La progression est sauvegardée automatiquement sur l'appareil.

### 🎨 Atelier Pixel Art
Un éditeur de dessin 10×10 intégré. Les élèves peuvent créer, colorier et sauvegarder leurs propres projets directement dans l'app.

### 🌈 Thèmes Personnalisés
4 thèmes prédéfinis (Bleu Azur, Sombre, Violet Galaxie, Vert Nature) + création d'un thème sur-mesure via curseurs HSL.

### 🏆 Gamification
Barre de progression, compteur de découvertes et écran de victoire à la collection complète.

---

## 🛠️ Architecture Technique

```
Frontend (GitHub Pages)  ──►  Android WebView (Kotlin)
       │
       ├── HTML / CSS / Vanilla JS
       ├── Modèle IA  →  /model/
       └── Avatars    →  /image/
```

| Couche | Technologie |
|---|---|
| Interface | HTML5 · CSS3 · Vanilla JavaScript |
| Reconnaissance | Teachable Machine + TensorFlow.js |
| Hébergement | GitHub Pages |
| Application mobile | Android Studio · Kotlin · WebView |
| Persistance | `localStorage` navigateur |

> **Mise à jour automatique** — dès qu'une modification est poussée sur ce dépôt, l'application Android des utilisateurs est à jour au prochain chargement. Aucune mise à jour du store nécessaire.

---

## 📂 Structure du projet

```
/
├── index.html          # Interface complète (Dashboard, Scanner, Atelier)
├── app.js              # Logique applicative, base de données, IA, thèmes
├── style.css           # Design system avec variables CSS pour les thèmes
├── /image/             # Avatars des œuvres et icônes
└── /model/
    ├── model.json
    ├── metadata.json
    └── weights.bin
```

---

## 🔄 Ajouter une nouvelle œuvre

### Étape 1 — Entraîner le modèle
1. Ouvrir [Teachable Machine](https://teachablemachine.withgoogle.com/)
2. Ajouter une nouvelle classe (ex : `sujet5`)
3. Importer les photos de l'œuvre, entraîner, puis exporter le modèle

### Étape 2 — Mettre à jour le modèle
Remplacer les fichiers du dossier `/model/` par les nouveaux fichiers exportés (`model.json`, `metadata.json`, `weights.bin`).

### Étape 3 — Mettre à jour la base de données
Dans `app.js`, ajouter une entrée dans l'objet `database` :

```javascript
"sujet5": {
    title: "Titre de l'œuvre",
    desc: "Description complète de l'œuvre...",
    avatar: "image/nouvelle_image.jpg",
    author: "Prénom de l'élève",
    classLevel: "CM2",
    date: "Juin 2025"
}
```

> ⚠️ La clé (`"sujet5"`) doit correspondre **exactement** au nom de la classe définie dans Teachable Machine, casse comprise.

---

## ⚠️ Reset & Sécurité

Un bouton **Réinitialiser la progression** est disponible dans les paramètres (menu latéral). L'action est protégée par une confirmation pour éviter les suppressions accidentelles.

---

## 📄 Licence

Projet pédagogique — École Albert Camus.