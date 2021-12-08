const Block = require("./block");
const cryptoHash = require("./crypto-hash");

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
            const { timestamp, lastHash, hash, data } = chain[i];
            const validatedHash = cryptoHash(timestamp, lastHash, data);
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
    replaceChain(chain) {
        if (chain.length > this.chain.length && Blockchain.isValidChain(chain)) {
            this.chain = chain;
            console.log('the chain is replaced');
        } else {
            console.error('the chain is not replaced');
        }
    }
}

module.exports = Blockchain;
