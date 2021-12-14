const express = require('express');
const axios = require('axios');
const Blockchain = require('./blockchain');
const PubSub = require('./app/pubsub');
const Wallet = require('./wallet');
const TransactionPool = require('./wallet/transaction-pool');

const blockchain = new Blockchain();
const transactionPool = new TransactionPool();
const wallet = new Wallet();
const pubsub = new PubSub({ blockchain, transactionPool, wallet });

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

app.post('/api/transact', (request, response) => {
    const { amount, recipient } = request.body;
    let transaction = transactionPool.getExistingTransaction({ inputAddress: wallet.publicKey });
    try {
        if (!!transaction) {
            transaction.update({ senderWallet: wallet, recipient, amount });
        } else {
            transaction = wallet.createTransaction({ recipient, amount });
        }
    } catch (error) {
        return response.status(400).json({ type: 'error', message: error.message });
    }
    transactionPool.setTransaction(transaction);
    pubsub.broadcastTransaction(transaction);
    response.json({ type: 'success', transaction });
});

app.get('/api/transaction-pool-map', (request, response) => {
    response.json(transactionPool.transactionMap);
});

const syncWithRootState = () => {
    const config = {
        baseURL: ROOT_NODE_ADDRESS,
        method: 'get'
    };
    axios({ ...config, url: '/api/blocks' })
        .then((response) => {
            const rootChain = response.data;
            console.log('replace chain on a sync with', rootChain);
            blockchain.replaceChain(rootChain);
        })
        .catch((error) => {
            console.log(error.message);
        });
    axios({ ...config, url: '/api/transaction-pool-map' })
        .then((response) => {
            const rootTransactionPoolMap = response.data;
            console.log('replace transaction pool map on a sync with', rootTransactionPoolMap);
            transactionPool.setMap(rootTransactionPoolMap);
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
        syncWithRootState();
    }
});
