const Block = require('./block');
const { cryptoHash } = require('../util');

class Blockchain {
    constructor() {
        this.chain = [Block.genesis()];
    }
    static isValidChain(chain) {
        if (Object.entries(chain[0]).sort().toString() !== Object.entries(Block.genesis()).sort().toString()) {
            return false;
        }
        for (let i = 1; i < chain.length; i++) {
            const actualLastHash = chain[i - 1].hash;
            const lastDifficulty = chain[i - 1].difficulty;
            const { timestamp, lastHash, hash, nonce, difficulty, data } = chain[i];
            if (Math.abs(lastDifficulty - difficulty) > 1) {
                return false;
            }
            const validatedHash = cryptoHash(timestamp, lastHash, nonce, difficulty, data);
            if (lastHash !== actualLastHash || hash !== validatedHash) {
                return false;
            }
        }
        return true;
    }
    addBlock({ data }) {
        const newBlock = Block.mineBlock({
            lastBlock: this.chain[this.chain.length - 1],
            data
        });
        this.chain.push(newBlock);
    }
    replaceChain(chain, onSuccess) {
        if (chain.length > this.chain.length && Blockchain.isValidChain(chain)) {
            if (!!onSuccess) {
                onSuccess();
            }
            this.chain = chain;
            console.log('the chain is replaced', this.chain);
        } else {
            console.error('the chain is not replaced');
        }
    }
}

module.exports = Blockchain;
