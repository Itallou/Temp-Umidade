const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const { format } = require('date-fns');
const app = express();
const PORT = 3000;

// Configurações do Firebase
const serviceAccount = require('./firebaseConfig.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Rota para verificar umidade e temperatura
app.post('/verificar', async (req, res) => {
    let { dataHora } = req.body;

    console.log("Data e Hora recebida:", dataHora); // Adiciona log para verificar o valor recebido

    // Formata `dataHora` para ignorar os segundos e converte para Date
    const startTime = new Date(dataHora);
    const endTime = new Date(dataHora);
    endTime.setMinutes(endTime.getMinutes() + 1); // Define o fim do intervalo para 1 minuto após o início

    console.log("Data e Hora para consulta (início):", startTime.toISOString());
    console.log("Data e Hora para consulta (fim):", endTime.toISOString());

    try {
        // Verifica se o campo 'dataHora' no Firestore é do tipo Timestamp ou String
        const snapshot = await db.collection('umidadeTemperatura')
            .where('dataHora', '>=', admin.firestore.Timestamp.fromDate(startTime)) // Usando Timestamp para precisão
            .where('dataHora', '<', admin.firestore.Timestamp.fromDate(endTime)) // Usando Timestamp para precisão
            .get();

        if (snapshot.empty) {
            return res.status(404).json({ message: 'Dados não encontrados para a data e hora selecionadas.' });
        }

        // Extrai os dados encontrados na consulta
        let data = [];
        snapshot.forEach(doc => {
            data.push(doc.data());
        });

        // Retorna os dados encontrados
        res.json(data);
    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        res.status(500).json({ error: error.message });
    }
});

// Inicia o servidor
app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
