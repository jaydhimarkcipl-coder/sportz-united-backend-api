const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../../../data');
if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true });
}
const memFile = path.join(dataPath, 'memberships.json');

class MembershipRepository {
    constructor() {
        if (!fs.existsSync(memFile)) {
            fs.writeFileSync(memFile, JSON.stringify({ plans: [], assignments: [] }));
        }
    }

    _readData() {
        const raw = fs.readFileSync(memFile);
        return JSON.parse(raw);
    }

    _writeData(data) {
        fs.writeFileSync(memFile, JSON.stringify(data, null, 2));
    }

    createPlan(arenaId, planData) {
        const data = this._readData();
        const newPlan = {
            id: Date.now().toString(),
            arenaId,
            ...planData,
            createdAt: new Date().toISOString()
        };
        data.plans.push(newPlan);
        this._writeData(data);
        return newPlan;
    }

    getPlans(arenaIds) {
        const data = this._readData();
        return data.plans.filter(p => arenaIds.includes(p.arenaId));
    }

    getPlanById(id, arenaIds) {
        const data = this._readData();
        return data.plans.find(p => p.id === id && arenaIds.includes(p.arenaId));
    }

    assignPlan(playerId, planId, arenaId, expiryDate) {
        const data = this._readData();
        const assignment = {
            id: Date.now().toString(),
            playerId,
            planId,
            arenaId,
            expiryDate,
            assignedAt: new Date().toISOString()
        };
        data.assignments.push(assignment);
        this._writeData(data);
        return assignment;
    }
}

module.exports = new MembershipRepository();
