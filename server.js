const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

const serviceAccount = require('./firebaseConfig.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

app.use(bodyParser.json());
app.use(express.static('public'));

function getStartAndEndOfDayUTC3(dateString) {
    const date = new Date(dateString);

    const startOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 3, 0, 0));
    const endOfDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 26, 59, 59, 999));

    return { startOfDay, endOfDay };
}

app.post('/verificar', async (req, res) => {
    const { date } = req.body;

    console.log("Data recebida:", date);

    try {
        const snapshot = await db.collection('SensorData')
            .where('date', '==', date) // Filtro apenas pela data
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'Nenhum dado encontrado para a data selecionada.' });
        }

        let data = [];
        snapshot.forEach(doc => {
            data.push(doc.data());
        });

        res.json(data);
    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/ver-todos', async (req, res) => {
    try {
        const snapshot = await db.collection('SensorData')
            .orderBy('date', 'asc') // Ordena apenas pela data
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'Nenhum dado encontrado.' });
        }

        let data = [];
        snapshot.forEach(doc => {
            data.push(doc.data());
        });

        res.json(data);
    } catch (error) {
        console.error("Erro ao buscar todos os dados:", error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});