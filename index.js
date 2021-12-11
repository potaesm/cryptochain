const express = require('express');
const axios = require('axios');
const Blockchain = require('./blockchain');
const PubSub = require('./pubsub');

const blockchain = new Blockchain();
const pubsub = new PubSub({ blockchain });

const DEFAULT_PORT = 3000;
const ROOT_NODE_ADDRESS = `http://localhost:${DEFAULT_PORT}`;

const app = express();
app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

app.get('/api/blocks', (request, response) => {
    response.json(blockchain.chain);
});

app.post('/api/mine', (request, response) => {
    const { data } = request.body;
    blockchain.addBlock({ data });
    pubsub.broadcastChain();
    response.redirect('/api/blocks');
});

function syncChains() {
    const config = {
        baseURL: ROOT_NODE_ADDRESS,
        url: '/api/blocks',
        method: 'get'
    };
    axios(config)
        .then((response) => {
            const rootChain = response.data;
            console.log('replace chain on a sync with', rootChain);
            blockchain.replaceChain(rootChain);
        })
        .catch((error) => {
            console.log(error.message);
        });
};

let PEER_PORT = DEFAULT_PORT;

if (process.env.GENERATE_PEER_PORT === 'true') {
    PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

app.listen(PEER_PORT, () => {
    console.log(`listening on localhost:${PEER_PORT}`);
    if (PEER_PORT !== DEFAULT_PORT) {
        syncChains();
    }
});
