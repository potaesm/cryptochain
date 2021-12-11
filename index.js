const express = require('express');
const Blockchain = require('./blockchain');

const blockchain = new Blockchain();
const app = express();
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

app.get('/api/blocks', (request, response) => {
    response.json(blockchain.chain);
});

app.post('/api/mine', (request, response) => {
    const { data } = request.body;
    blockchain.addBlock({ data });
    response.redirect('/api/blocks');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`listening on localhost:${PORT}`);
});
