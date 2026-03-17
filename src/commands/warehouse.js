const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require('../database/db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('warehouse')
        .setDescription('Anbar qeydləri sistemi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('take')
                .setDescription('Xüsusi silah/əşya götürülməsini qeyd edir')
                .addStringOption(option => option.setName('ne_goturulub').setDescription('Götürülən əşya').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('return')
                .setDescription('Xüsusi silah/əşya qaytarılmasını qeyd edir')
                .addStringOption(option => option.setName('ne_goturulub').setDescription('Qaytarılan əşya').setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const item = interaction.options.getString('ne_goturulub');
        const userId = interaction.user.id;

        db.prepare('INSERT INTO warehouse_logs (user_id, item, action) VALUES (?, ?, ?)')
            .run(userId, item, subcommand.toUpperCase());

        const embed = new EmbedBuilder()
            .setTitle('📦 Anbar Qeydiyyatı')
            .setColor(subcommand === 'take' ? 0xe74c3c : 0x27ae60)
            .addFields(
                { name: '👤 İstifadəçi', value: `<@${userId}>`, inline: true },
                { name: '🔧 Hərəkət', value: subcommand === 'take' ? 'Götürüldü' : 'Qaytarıldı', inline: true },
                { name: '🔫 Əşya', value: item }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
