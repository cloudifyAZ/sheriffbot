const { EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const moment = require('moment');

module.exports = {
    name: 'ready',
    once: true,
    execute(client) {
        console.log(`✅ ${client.user.tag} işə düşdü!`);

        // LOA Rol təmizləmə sistemi (Hər saat başı yoxlayır)
        setInterval(async () => {
            const now = moment().toISOString();
            const expiredLoas = db.prepare('SELECT * FROM loa WHERE end_date <= ? AND status = "ACTIVE"').all(now);

            for (const loa of expiredLoas) {
                const guild = client.guilds.cache.first(); // Sadəlik üçün ilk server
                if (!guild) continue;

                const member = await guild.members.fetch(loa.user_id).catch(() => null);
                if (member) {
                    const role = guild.roles.cache.find(r => r.name === 'Aktivsizlik üçün İcazəli');
                    if (role) {
                        await member.roles.remove(role).catch(console.error);
                    }
                }
                db.prepare('UPDATE loa SET status = "EXPIRED" WHERE id = ?').run(loa.id);
            }
        }, 3600000); // 1 saat
    },
};
