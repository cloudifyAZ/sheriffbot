const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Mesajları təmizləyir')
        .addIntegerOption(option => option.setName('say').setDescription('Silinəcək mesaj sayı').setRequired(true).setMinValue(1).setMaxValue(100))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const amount = interaction.options.getInteger('say');

        await interaction.channel.bulkDelete(amount, true).catch(err => {
            console.error(err);
            interaction.reply({ content: 'Mesajları silərkən xəta baş verdi!', ephemeral: true });
        });

        await interaction.reply({ content: `✅ **${amount}** mesaj silindi.`, ephemeral: true });
    },
};
