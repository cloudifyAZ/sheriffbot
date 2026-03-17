const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fto')
        .setDescription('Təlimatçı komandaları')
        .addSubcommand(subcommand =>
            subcommand
                .setName('eval')
                .setDescription('Kadet qiymətləndirməsi')
                .addUserOption(option => option.setName('user').setDescription('Qiymətləndiriləcək kadet').setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles), // Təlimatçı icazəsi

    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'eval') {
            const targetUser = interaction.options.getUser('user');

            const modal = new ModalBuilder()
                .setCustomId(`fto_eval_modal_${targetUser.id}`)
                .setTitle(`${targetUser.username} Qiymətləndirilməsi`);

            const drivingInput = new TextInputBuilder()
                .setCustomId('driving')
                .setLabel('Nəqliyyat İdarəetməsi (1-5)')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(1)
                .setPlaceholder('1...5')
                .setRequired(true);

            const shootingInput = new TextInputBuilder()
                .setCustomId('shooting')
                .setLabel('Atış Qabiliyyəti (1-5)')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(1)
                .setPlaceholder('1...5')
                .setRequired(true);

            const commsInput = new TextInputBuilder()
                .setCustomId('comms')
                .setLabel('Ünsiyyət Qabiliyyəti (1-5)')
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(1)
                .setPlaceholder('1...5')
                .setRequired(true);

            const commentInput = new TextInputBuilder()
                .setCustomId('comment')
                .setLabel('Qısa Rəy')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true);

            modal.addComponents(
                new ActionRowBuilder().addComponents(drivingInput),
                new ActionRowBuilder().addComponents(shootingInput),
                new ActionRowBuilder().addComponents(commsInput),
                new ActionRowBuilder().addComponents(commentInput)
            );

            await interaction.showModal(modal);
        }
    },
};
