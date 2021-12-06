function cryptoHash(...inputs) {
    const hash = require('crypto').createHash('sha256');
    hash.update(inputs.sort().join(' '));
    return hash.digest('hex');
}

module.exports = cryptoHash;
