const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const moment = require('moment');

async function getLogChannel(guild, name) {
    let channel = guild.channels.cache.find(c => c.name === name);
    if (!channel) {
        channel = await guild.channels.create({
            name: name,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }
            ]
        });
    }
    return channel;
}

module.exports = {
    data: new SlashCommandBuilder()
    .setName('loa')
    .setDescription('İcazə (Leave of Absence) müraciəti bildirir'),

    async execute(interaction) {
    const modal = new ModalBuilder()
        .setCustomId('loa_modal')
        .setTitle('LOA - İcazə Müraciəti');

    const startInput = new TextInputBuilder()
        .setCustomId('loa_start')
        .setLabel('Başlama tarixi (DD.MM.YYYY-HH:mm)')
        .setPlaceholder('18.03.2026-18:33')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const endInput = new TextInputBuilder()
        .setCustomId('loa_end')
        .setLabel('Bitmə tarixi (DD.MM.YYYY-HH:mm)')
        .setPlaceholder('20.03.2026-18:33')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const reasonInput = new TextInputBuilder()
        .setCustomId('loa_reason')
        .setLabel('Səbəb')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder().addComponents(startInput),
        new ActionRowBuilder().addComponents(endInput),
        new ActionRowBuilder().addComponents(reasonInput),
    );

    await interaction.showModal(modal);
    },
};

