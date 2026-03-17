const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database/db');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loa')
        .setDescription('İcazə (Leave of Absence) müraciəti bildirir')
        .addStringOption(option => option.setName('başlanğıc').setDescription('Məsələn: 18.03.2026 09:00').setRequired(true))
        .addStringOption(option => option.setName('bitiş').setDescription('Məsələn: 20.03.2026 09:00').setRequired(true))
        .addStringOption(option => option.setName('səbəb').setDescription('İcazənin səbəbi').setRequired(true)),

    async execute(interaction) {
        const startStr = interaction.options.getString('başlanğıc');
        const endStr = interaction.options.getString('bitiş');
        const reason = interaction.options.getString('səbəb');

        // Tarixləri yoxlayırıq
        const start = moment(startStr, 'DD.MM.YYYY HH:mm');
        const end = moment(endStr, 'DD.MM.YYYY HH:mm');

        if (!start.isValid() || !end.isValid()) {
            return interaction.reply({ content: 'Tarix formatı düzgün deyil! Lütfən **DD.MM.YYYY HH:mm** formatından istifadə edin.', ephemeral: true });
        }

        const userId = interaction.user.id;
        const roleName = 'Aktivsizlik üçün İcazəli'; 
        let role = interaction.guild.roles.cache.find(r => r.name === roleName);

        if (!role) {
            try {
                role = await interaction.guild.roles.create({
                    name: roleName,
                    color: 0x95a5a6,
                    reason: 'LOA sistemi üçün avtomatik yaradıldı'
                });
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: 'Rol yaradarkən xəta baş verdi. İcazəli rolu əvvəlcədən manual yaradılmalıdır.', ephemeral: true });
            }
        }

        // Bazaya yazırıq
        db.prepare('INSERT INTO loa (user_id, start_date, end_date, reason) VALUES (?, ?, ?, ?)')
            .run(userId, start.toISOString(), end.toISOString(), reason);

        // İndi rolu dərhal veririk (əgər tarix çatdısa)
        if (moment().isSameOrAfter(start)) {
            await interaction.member.roles.add(role).catch(console.error);
        }

        const embed = new EmbedBuilder()
            .setTitle('📅 LOA - İcazə Müraciəti')
            .setColor(0xe67e22)
            .addFields(
                { name: '👤 İstifadəçi', value: `<@${userId}>`, inline: true },
                { name: '📅 Başlama', value: startStr, inline: true },
                { name: '📅 Bitmə', value: endStr, inline: true },
                { name: '📝 Səbəb', value: reason }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
