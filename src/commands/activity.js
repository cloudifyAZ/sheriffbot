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
        .setName('activity')
        .setDescription('İstifadəçilərin növbə aktivliyini göstərir (Discord-Logdan oxuyur)')
        .addStringOption(option =>
            option.setName('film')
                .setDescription('Zaman aralığı')
                .setRequired(true)
                .addChoices(
                    { name: 'Son 1 Gün', value: '1d' },
                    { name: 'Son 1 Həftə', value: '7d' },
                    { name: 'Son 1 Ay', value: '30d' }
                )),

    async execute(interaction) {
        const range = interaction.options.getString('film');
        let days = 1;
        if (range === '7d') days = 7;
        if (range === '30d') days = 30;

        const dateLimit = moment().subtract(days, 'days');
        const logChannel = await getLogChannel(interaction.guild, 'duty-logs');
        const messages = await logChannel.messages.fetch({ limit: 100 });

        // SUM loglarını süzürük və tarixi yoxlayırıq
        const stats = {};
        messages.forEach(m => {
            if (m.content.startsWith('SUM:')) {
                const parts = m.content.split('|');
                const userId = parts[0].replace('SUM:', '').trim();
                const userName = parts[1].trim();
                const duration = parseInt(parts[2].trim());
                const time = moment(parts[3].trim());

                if (time.isAfter(dateLimit)) {
                    if (!stats[userId]) stats[userId] = { name: userName, total: 0 };
                    stats[userId].total += duration;
                }
            }
        });

        const sorted = Object.values(stats).sort((a, b) => b.total - a.total);

        const embed = new EmbedBuilder()
            .setTitle(`📊 Aktivlik Hesabatı (${range})`)
            .setColor(0x3498db)
            .setTimestamp();

        if (sorted.length > 0) {
            let description = '';
            sorted.forEach((u, i) => {
                const hours = Math.floor(u.total / 60);
                const minutes = u.total % 60;
                description += `${i + 1}. **${u.name}**: ${hours}saat ${minutes}dəq\n`;
            });
            embed.setDescription(description);
        } else {
            embed.setDescription('Bu zaman aralığında heç bir aktivlik tapılmadı (və ya loglar köhnədir).');
        }

        await interaction.reply({ embeds: [embed] });
    },
};

