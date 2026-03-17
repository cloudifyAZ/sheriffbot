const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('activity')
        .setDescription('İstifadəçilərin növbə aktivliyini göstərir')
        .addStringOption(option =>
            option.setName('film')
                .setDescription('Zaman aralığı')
                .setRequired(true)
                .addChoices(
                    { name: 'Son 1 Gün', value: '1d' },
                    { name: 'Son 1 Həftə', value: '7d' },
                    { name: 'Son 1 Ay', value: '30d' }
                )),

    async execute(interaction) {
        const range = interaction.options.getString('film');
        let days = 1;
        if (range === '7d') days = 7;
        if (range === '30d') days = 30;

        const dateLimit = moment().subtract(days, 'days').toISOString();
        
        const logs = db.prepare(`
            SELECT user_name, SUM(duration_minutes) as total_min 
            FROM duty_logs 
            WHERE start_time >= ? AND duration_minutes IS NOT NULL 
            GROUP BY user_id 
            ORDER BY total_min DESC
        `).all(dateLimit);

        const embed = new EmbedBuilder()
            .setTitle(`📊 Aktivlik Hesabatı (${range})`)
            .setColor(0x3498db)
            .setTimestamp();

        if (logs.length > 0) {
            let description = '';
            logs.forEach((log, index) => {
                const hours = Math.floor(log.total_min / 60);
                const minutes = log.total_min % 60;
                description += `${index + 1}. **${log.user_name}**: ${hours}saat ${minutes}dəq\n`;
            });
            embed.setDescription(description);
        } else {
            embed.setDescription('Bu zaman aralığında heç bir aktivlik tapılmadı.');
        }

        await interaction.reply({ embeds: [embed] });
    },
};
