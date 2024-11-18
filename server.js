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
    let { dataHora } = req.body;

    console.log("Data recebida:", dataHora);

    const { startOfDay, endOfDay } = getStartAndEndOfDayUTC3(dataHora);

    console.log("Intervalo de consulta (UTC-3):", {
        inicio: startOfDay.toISOString(),
        fim: endOfDay.toISOString()
    });

    try {
        const snapshot = await db.collection('umidadeTemperatura')
            .where('dataHora', '>=', admin.firestore.Timestamp.fromDate(startOfDay))
            .where('dataHora', '<=', admin.firestore.Timestamp.fromDate(endOfDay))
            .orderBy('dataHora', 'asc') 
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'Nenhum dado encontrado para a data selecionada.' });
        }

        let data = [];
        snapshot.forEach(doc => {
            const item = doc.data();
            item.dataHora = item.dataHora.toDate().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            data.push(item);
        });

        res.json(data);
    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/ver-todos', async (req, res) => {
    try {
        const snapshot = await db.collection('umidadeTemperatura')
            .orderBy('dataHora', 'asc')
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'Nenhum dado encontrado.' });
        }

        let data = [];
        snapshot.forEach(doc => {
            const item = doc.data();
            item.dataHora = item.dataHora.toDate().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            data.push(item);
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
