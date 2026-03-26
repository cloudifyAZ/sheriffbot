const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fto')
        .setDescription('Təlimatçı komandaları')
        .addSubcommand(subcommand =>
            subcommand
                .setName('eval')
                .setDescription('Kadet qiymətləndirməsi')
                .addUserOption(option => option.setName('user').setDescription('Kadet').setRequired(true))
                .addIntegerOption(o => o.setName('driving').setDescription('Nəqliyyat (1-5)').setRequired(true).setMinValue(1).setMaxValue(5))
                .addIntegerOption(o => o.setName('shooting').setDescription('Atış (1-5)').setRequired(true).setMinValue(1).setMaxValue(5))
                .addIntegerOption(o => o.setName('comms').setDescription('Ünsiyyət (1-5)').setRequired(true).setMinValue(1).setMaxValue(5))
                .addIntegerOption(o => o.setName('situation').setDescription('Situasiya İdarəetməsi (1-5)').setRequired(true).setMinValue(1).setMaxValue(5))
                .addIntegerOption(o => o.setName('report').setDescription('Hesabat və cərimə (1-5)').setRequired(true).setMinValue(1).setMaxValue(5))
                .addIntegerOption(o => o.setName('command').setDescription('Komandantlıq (1-5)').setRequired(true).setMinValue(1).setMaxValue(5))
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'eval') {
            const targetUser = interaction.options.getUser('user');
            
            // Xalları burada yadda saxlayıb, modal təsdiqlənəndə istifadə edə bilərsiniz
            // const driving = interaction.options.getInteger('driving'); ...
            
            // Yalnız Rəy üçün Modal açırıq
            const modal = new ModalBuilder()
                .setCustomId(`fto_eval_modal_${targetUser.id}`)
                .setTitle(`${targetUser.username} - Qısa Rəy`);

            const commentInput = new TextInputBuilder()
                .setCustomId('comment')
                .setLabel('Kadet haqqında qısa rəyiniz')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(commentInput));

            await interaction.showModal(modal);
        }
    },
};
