const Block = require("./block");
const cryptoHash = require("./crypto-hash");

class Blockchain {
    constructor() {
        this.chain = [Block.genesis()];
    }
    static isValidChain(chain) {
        if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
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
}

module.exports = Blockchain;
