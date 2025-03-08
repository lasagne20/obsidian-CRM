const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

// Middleware pour parser les requêtes JSON
app.use(express.json());

app.get("/proxy", async (req, res) => {
    try {
        // Récupère l'URL cible depuis la requête (ex: /proxy?url=https://centreaere.fr/recherche?q=38000)
        const targetUrl = req.query.url;
        if (!targetUrl) {
            return res.status(400).json({ error: "Paramètre 'url' manquant." });
        }

        // Effectue la requête vers l'URL cible
        const response = await axios.get(targetUrl, {
            headers: { "User-Agent": "Mozilla/5.0" } // Simule un vrai navigateur
        });

        // Renvoie les données de la réponse
        res.send(response.data);
    } catch (error) {
        console.error("Erreur lors de la récupération des données :", error.message);
        res.status(500).json({ error: "Erreur lors de la récupération des données." });
    }
});

// 🔥 Lancer le serveur sur le port 3000
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Proxy lancé sur http://localhost:${PORT}`));
