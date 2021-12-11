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
    BLOCKCHAIN: 'BLOCKCHAIN'
};

class PubSub {
    constructor({ blockchain }) {
        this.blockchain = blockchain;

        this.publisher = mqtt.connect(url, options);
        this.subscriber = mqtt.connect(url, options);

        this.subscribeToChannels();
        this.subscriber.on('message', (channel, message) => this.handleMessage(channel, message));
    }
    handleMessage(channel, message) {
        const parsedMessage = JSON.parse(message.toString());
        if (channel === CHANNELS.BLOCKCHAIN) {
            console.log(this.blockchain);
            this.blockchain.replaceChain(parsedMessage);
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
}

module.exports = PubSub;
