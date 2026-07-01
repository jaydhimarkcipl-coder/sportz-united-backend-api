const { TournamentRegistration, TournamentParticipant, Player, Tournament } = require('../../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const { formatDateTime } = require('../../utils/time.util');

const getFullUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    const baseUrl = process.env.BASE_URL || 'https://api.sportzunited.com';
    return `${baseUrl}/${cleanPath}`;
};

class RegistrationService {
    async exportRegistrations(filters) {
        const { tournamentId, status, search, startDate, endDate } = filters;
        const whereClause = {};

        if (tournamentId) {
            whereClause.TournamentId = tournamentId;
        }

        if (status) {
            whereClause.Status = status;
        }

        if (startDate && endDate) {
            whereClause.RegistrationDate = {
                [Op.between]: [new Date(startDate), new Date(endDate)]
            };
        } else if (startDate) {
            whereClause.RegistrationDate = {
                [Op.gte]: new Date(startDate)
            };
        } else if (endDate) {
            whereClause.RegistrationDate = {
                [Op.lte]: new Date(endDate)
            };
        }

        const includeClause = [
            {
                model: TournamentParticipant,
                as: 'Participants',
            },
            {
                model: Player,
                attributes: ['PlayerId', 'FullName', 'Phone', 'Email']
            },
            {
                model: Tournament,
                attributes: ['TournamentId', 'Name', 'TournamentCode']
            }
        ];

        let searchCondition = null;
        if (search) {
            searchCondition = {
                [Op.or]: [
                    { '$Participants.FullName$': { [Op.like]: `%${search}%` } },
                    { '$Participants.Email$': { [Op.like]: `%${search}%` } },
                    { '$Participants.Phone$': { [Op.like]: `%${search}%` } },
                    { TeamName: { [Op.like]: `%${search}%` } },
                    { '$Tournament.Name$': { [Op.like]: `%${search}%` } }
                ]
            };
        }

        let queryWhere = whereClause;
        if (searchCondition) {
            queryWhere = {
                [Op.and]: [whereClause, searchCondition]
            };
        }

        const registrations = await TournamentRegistration.findAll({
            where: queryWhere,
            include: includeClause,
            order: [['RegistrationId', 'DESC']]
        });

        if (!registrations || registrations.length === 0) {
            throw { statusCode: 404, message: 'No registrations found matching the criteria' };
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Registrations');

        worksheet.columns = [
            { header: 'Registration ID', key: 'regId', width: 15 },
            { header: 'Tournament Name', key: 'tournamentName', width: 25 },
            { header: 'Team Name', key: 'teamName', width: 20 },
            { header: 'Category', key: 'category', width: 15 },
            { header: 'Registration Date', key: 'regDate', width: 20 },
            { header: 'Registration Status', key: 'status', width: 20 },
            { header: 'Payment Status', key: 'paymentStatus', width: 15 },
            { header: 'Participant Name', key: 'participantName', width: 25 },
            { header: 'Participant Email', key: 'participantEmail', width: 25 },
            { header: 'Participant Phone', key: 'participantPhone', width: 15 },
            { header: 'Gender', key: 'gender', width: 10 },
            { header: 'DOB', key: 'dob', width: 15 },
            { header: 'Photo URL', key: 'photoUrl', width: 40 }
        ];

        worksheet.getRow(1).font = { bold: true };

        registrations.forEach(reg => {
            const regData = reg.toJSON();
            const participants = regData.Participants || [];

            if (participants.length === 0) {
                worksheet.addRow({
                    regId: regData.RegistrationId,
                    tournamentName: regData.Tournament ? regData.Tournament.Name : '',
                    teamName: regData.TeamName || '',
                    category: regData.Category || '',
                    regDate: regData.RegistrationDate ? formatDateTime(regData.RegistrationDate) : '',
                    status: regData.Status || '',
                    paymentStatus: regData.PaymentStatus || '',
                    participantName: '',
                    participantEmail: '',
                    participantPhone: '',
                    gender: '',
                    dob: '',
                    photoUrl: ''
                });
            } else {
                participants.forEach(p => {
                    worksheet.addRow({
                        regId: regData.RegistrationId,
                        tournamentName: regData.Tournament ? regData.Tournament.Name : '',
                        teamName: regData.TeamName || '',
                        category: regData.Category || '',
                        regDate: regData.RegistrationDate ? formatDateTime(regData.RegistrationDate) : '',
                        status: regData.Status || '',
                        paymentStatus: regData.PaymentStatus || '',
                        participantName: p.FullName || '',
                        participantEmail: p.Email || '',
                        participantPhone: p.Phone || '',
                        gender: p.Gender || '',
                        dob: p.DOB ? (p.DOB instanceof Date ? p.DOB.toISOString().split('T')[0] : String(p.DOB).split('T')[0].split(' ')[0]) : '',
                        photoUrl: p.PhotoUrl ? getFullUrl(p.PhotoUrl) : ''
                    });
                });
            }
        });

        return await workbook.xlsx.writeBuffer();
    }
}

module.exports = new RegistrationService();
