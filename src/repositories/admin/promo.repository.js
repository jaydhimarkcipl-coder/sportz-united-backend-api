const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../../../data');
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
}
const promosFile = path.join(dataPath, 'promos.json');

class PromoRepository {
    constructor() {
        if (!fs.existsSync(promosFile)) {
            fs.writeFileSync(promosFile, JSON.stringify([]));
        }
    }

    _readData() {
        const raw = fs.readFileSync(promosFile);
        return JSON.parse(raw);
    }

    _writeData(data) {
        fs.writeFileSync(promosFile, JSON.stringify(data, null, 2));
    }

    createPromo(arenaId, promoData) {
        const promos = this._readData();
        const newPromo = {
            id: Date.now().toString(),
            arenaId,
            ...promoData,
            createdAt: new Date().toISOString()
        };
        promos.push(newPromo);
        this._writeData(promos);
        return newPromo;
    }

    getPromosByArena(arenaIds) {
        const promos = this._readData();
        return promos.filter(p => arenaIds.includes(p.arenaId)); 
    }

    // Adjusted to support the middleware logic seamlessly
    getPromos(arenaIds) {
        const promos = this._readData();
        return promos.filter(p => arenaIds.includes(p.arenaId));
    }

    getPromoById(id, arenaIds) {
        const promos = this._readData();
        return promos.find(p => p.id === id && arenaIds.includes(p.arenaId));
    }
}

module.exports = new PromoRepository();
