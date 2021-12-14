const mqtt = require('mqtt');

const url = 'wss://mqtt.up.railway.app';
const options = {
    username: 'web',
    password: 'client',
    properties: {
        maximumPacketSize: 5242880
    }
};
// const url = 'mqtt://woodpecker.rmq.cloudamqp.com';
// const options = {
//     username: 'dahrusvc:dahrusvc',
//     password: '6lYM_XMYbBTM-rfU3vg4Qsdfmx8J1TlA',
//     properties: {
//         maximumPacketSize: 5242880
//     }
// };
const CHANNELS = {
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION'
};

class PubSub {
    constructor({ blockchain, transactionPool, wallet }) {
        this.blockchain = blockchain;
        this.transactionPool = transactionPool;
        this.wallet = wallet;

        this.publisher = mqtt.connect(url, options);
        this.subscriber = mqtt.connect(url, options);

        this.subscribeToChannels();
        this.subscriber.on('message', (channel, message) => this.handleMessage(channel, message));
    }
    handleMessage(channel, message) {
        const parsedMessage = JSON.parse(message.toString());
        switch(channel) {
            case CHANNELS.BLOCKCHAIN: {
                this.blockchain.replaceChain(parsedMessage);
                break;
            }
            case CHANNELS.TRANSACTION: {
                console.log(this.transactionPool.getExistingTransaction({ inputAddress: this.wallet.publicKey }));
                if (!this.transactionPool.getExistingTransaction({ inputAddress: this.wallet.publicKey })) {
                    this.transactionPool.setTransaction(parsedMessage);
                }
                break;
            }
            default:
                return;
        }
        // this.subscriber.end();
    }
    subscribeToChannels() {
        Object.values(CHANNELS).forEach(channel => this.subscriber.subscribe(channel));
    }
    publish({ channel, message }) {
        this.subscriber.unsubscribe(channel, {}, () => {
            this.publisher.publish(channel, message, () => {
                this.subscriber.subscribe(channel);
            });
        });
    }
    broadcastChain() {
        this.publish({ channel: CHANNELS.BLOCKCHAIN, message: JSON.stringify(this.blockchain.chain) });
    }
    broadcastTransaction(transaction) {
        this.publish({ channel: CHANNELS.TRANSACTION, message: JSON.stringify(transaction) });
    }
}

module.exports = PubSub;
