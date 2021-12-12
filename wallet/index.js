const { STARTING_BALANCE } = require('../config');
const { ec } = require('../util/elliptic-cryptography');

class Wallet {
    constructor() {
        const keyPair = ec.genKeyPair();
        this.balance = STARTING_BALANCE;
        this.publicKey = keyPair.getPublic();
    }
}

module.exports = Wallet;
