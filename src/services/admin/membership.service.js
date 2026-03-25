const membershipRepo = require('../../repositories/admin/membership.repository');

class AdminMembershipService {
    async createPlan(data, ownedArenaIds) {
        const targetArenaId = data.arenaId || ownedArenaIds[0];
        if (!ownedArenaIds.includes(targetArenaId)) {
            throw { statusCode: 403, message: 'Invalid Arena ID' };
        }
        return membershipRepo.createPlan(targetArenaId, data);
    }

    async getPlans(ownedArenaIds) {
        return membershipRepo.getPlans(ownedArenaIds);
    }

    async assignPlanToUser(data, ownedArenaIds) {
        const { playerId, planId } = data;
        const plan = membershipRepo.getPlanById(planId, ownedArenaIds);
        
        if (!plan) {
            throw { statusCode: 404, message: 'Membership plan not found or access denied' };
        }

        // Calculate expiry based on plan durationDays or explicit date
        let expiry = new Date();
        expiry.setDate(expiry.getDate() + (plan.durationDays || 30));
        
        return membershipRepo.assignPlan(playerId, planId, plan.arenaId, expiry.toISOString());
    }
}

module.exports = new AdminMembershipService();
