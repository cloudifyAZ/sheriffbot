const { SlashCommandBuilder, EmbedBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
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
        .setDescription('İcazə (Leave of Absence) müraciəti bildirir')
        .addStringOption(option => option.setName('başlanğıc').setDescription('Məsələn: 18.03.2026 09:00').setRequired(true))
        .addStringOption(option => option.setName('bitiş').setDescription('Məsələn: 20.03.2026 09:00').setRequired(true))
        .addStringOption(option => option.setName('səbəb').setDescription('İcazənin səbəbi').setRequired(true)),

    async execute(interaction) {
        const startStr = interaction.options.getString('başlanğıc');
        const endStr = interaction.options.getString('bitiş');
        const reason = interaction.options.getString('səbəb');

        const start = moment(startStr, 'DD.MM.YYYY HH:mm');
        const end = moment(endStr, 'DD.MM.YYYY HH:mm');

        if (!start.isValid() || !end.isValid()) {
            return interaction.reply({ content: 'Tarix formatı düzgün deyil! (DD.MM.YYYY HH:mm)', ephemeral: true });
        }

        const roleName = 'Aktivsizlik üçün İcazəli'; 
        let role = interaction.guild.roles.cache.find(r => r.name === roleName);
        if (!role) {
            role = await interaction.guild.roles.create({ name: roleName, color: 0x95a5a6 }).catch(() => null);
        }

        const loaLogChannel = await getLogChannel(interaction.guild, 'loa-logs');
        await loaLogChannel.send(`LOA:${interaction.user.id} | ${startStr} | ${endStr} | ${reason}`);

        if (moment().isSameOrAfter(start)) {
            if (role) await interaction.member.roles.add(role).catch(() => {});
        }

        const embed = new EmbedBuilder()
            .setTitle('📅 LOA - İcazə Müraciəti')
            .setColor(0xe67e22)
            .addFields(
                { name: '👤 İstifadəçi', value: `<@${interaction.user.id}>`, inline: true },
                { name: '📅 Başlama', value: startStr, inline: true },
                { name: '📅 Bitmə', value: endStr, inline: true },
                { name: '📝 Səbəb', value: reason }
            ).setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};

