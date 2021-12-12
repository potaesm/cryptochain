const { GENESIS_DATA, MINE_RATE } = require('../config');
const { cryptoHash, hex2bin } = require('../util');

class Block {
    constructor({ timestamp, lastHash, data, nonce, difficulty, hash }) {
        this.timestamp = timestamp;
        this.lastHash = lastHash;
        this.data = data;
        this.hash = hash;
        this.nonce = nonce;
        this.difficulty = difficulty;
    }
    static genesis() {
        return new this(GENESIS_DATA);
    }
    static mineBlock({ lastBlock, data }) {
        const lastHash = lastBlock.hash;
        let { difficulty } = lastBlock;
        let timestamp = Date.now();
        let hash = '';
        let nonce = 0;
        do {
            nonce++;
            timestamp = Date.now();
            difficulty = this.adjustDifficulty({ originalBlock: lastBlock, timestamp });
            hash = cryptoHash(timestamp, lastHash, nonce, difficulty, data);
        } while (hex2bin(hash).substring(0, difficulty) !== '0'.repeat(difficulty));
        return new this({ timestamp, lastHash, data, nonce, difficulty, hash });
    }
    static adjustDifficulty({ originalBlock, timestamp }) {
        const { difficulty } = originalBlock;
        if (difficulty < 1) {
            return 1;
        }
        if ((timestamp - originalBlock.timestamp) > MINE_RATE) {
            return difficulty - 1;
        }
        return difficulty + 1;
    }
}

module.exports = Block;
