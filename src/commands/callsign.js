const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('callsign')
        .setDescription('Discord adınızı [Callsign] Ad Soyad formatına salır')
        .addStringOption(option => option.setName('nömrə').setDescription('Məsələn: 1A-12').setRequired(true)),

    async execute(interaction) {
        const callsign = interaction.options.getString('nömrə');
        const user = interaction.member;

        // " [Callsign] " hissəsini çıxarıb əsas adı tapırıq ki, təkrarlanmasın
        let cleanName = user.displayName.replace(/^\[.*\]\s*/, '');
        const newNickname = `[${callsign}] ${cleanName}`;

        try {
            await user.setNickname(newNickname);
            await interaction.reply({ content: `✅ Adınız yeniləndi: **${newNickname}**`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Adınızı dəyişmək üçün icazəm yoxdur (Rol iyerarxiyasını yoxlayın).', ephemeral: true });
        }
    },
};
