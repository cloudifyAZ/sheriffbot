const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fto')
        .setDescription('Təlimatçı komandaları')
        .addSubcommand(subcommand =>
            subcommand
                .setName('eval')
                .setDescription('Kadet qiymətləndirməsi')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('Qiymətləndiriləcək kadet')
                        .setRequired(true)))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');

        const modal = new ModalBuilder()
            .setCustomId(`fto_eval_1_${targetUser.id}`)
            .setTitle(`${targetUser.username} Qiymətləndirmə (1/2)`);

        const createInput = (id, label) =>
            new TextInputBuilder()
                .setCustomId(id)
                .setLabel(label)
                .setStyle(TextInputStyle.Short)
                .setMinLength(1)
                .setMaxLength(1)
                .setPlaceholder('1-5')
                .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(createInput('driving', 'Nəqliyyat İdarəetməsi (1-5)')),
            new ActionRowBuilder().addComponents(createInput('shooting', 'Atış Qabiliyyəti (1-5)')),
            new ActionRowBuilder().addComponents(createInput('comms', 'Ünsiyyət Qabiliyyəti (1-5)')),
            new ActionRowBuilder().addComponents(createInput('situation', 'Situasiya İdarəetməsi (1-5)')),
            new ActionRowBuilder().addComponents(createInput('command', 'Komandantlıq Qabiliyyəti (1-5)'))
        );

        await interaction.showModal(modal);
    },
};
