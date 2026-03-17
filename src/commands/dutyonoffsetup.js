const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dutyonoffsetup')
        .setDescription('İşə gir-çıx sistemi üçün sabit mesaj qurur')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🕒 LSSD Növbə Sistemi')
            .setDescription('Növbəyə başlamaq və ya növbəni bitirmək üçün aşağıdakı düymələri istifadə edin.')
            .setColor(0x2ecc71)
            .addFields(
                { name: '🟢 Növbəni başlat', value: 'Sizin adınıza özəl aktivlik kanalı açılır və vaxtınız hesablanmağa başlayır.', inline: true },
                { name: '🔴 Növbəni bağla', value: 'Kanalınız silinir və iş vaxtınız qeydə alınır.', inline: true }
            )
            .setFooter({ text: 'Sheriff Department - Duty Management' });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('duty_on')
                    .setLabel('Növbəni başlat')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('duty_off')
                    .setLabel('Növbəni bağla')
                    .setStyle(ButtonStyle.Danger)
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};
