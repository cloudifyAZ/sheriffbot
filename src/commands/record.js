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
        .setName('record')
        .setDescription('Vətəndaş qeydləri sistemi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Yeni bir vətəndaş profili (alt başlıq) yaradır')
                .addStringOption(option => option.setName('ad_soyad').setDescription('Vətəndaşın Adı və Soyadı').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Vətəndaşın qeydlərinə yeni məlumat əlavə edir')
                .addStringOption(option => option.setName('qeyd').setDescription('Əlavə ediləcək qeyd').setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Vətəndaşın bütün qeydlərinə baxış')
                .addStringOption(option => option.setName('id').setDescription('Vətəndaşın ID-si və ya Adı').setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const recordChannel = await getLogChannel(interaction.guild, 'citizen-records');

        if (subcommand === 'create') {
            const name = interaction.options.getString('ad_soyad');
            const allThreads = await recordChannel.threads.fetch();
            const citizenId = allThreads.threads.size + 1;
            const uniqueName = `[ID: ${citizenId}] ${name}`;

            try {
                const thread = await recordChannel.threads.create({
                    name: uniqueName,
                    autoArchiveDuration: 60,
                    type: ChannelType.GuildPublicThread,
                    reason: 'Yeni vətəndaş profili yaradıldı',
                });

                await interaction.reply({
                    content: `✅ Yeni vətəndaş profili yaradıldı: **${uniqueName}**\nBura keçid edin: <#${thread.id}>`,
                    ephemeral: false
                });
            } catch (error) {
                await interaction.reply({ content: 'Thread yaradarkən xəta baş verdi.', ephemeral: true });
            }
        }

        if (subcommand === 'add') {
            const content = interaction.options.getString('qeyd');
            const thread = interaction.channel;

            if (!thread.isThread() || thread.parentId !== recordChannel.id) {
                return interaction.reply({ content: 'Bu komanda yalnız vətəndaş qeydləri kanalındakı alt başlıqlarda işlədilə bilər.', ephemeral: true });
            }

            const sheriffName = interaction.member.displayName;
            const timestamp = moment().format('DD.MM.YYYY HH:mm');

            await thread.send(`✍️ **Qeyd əlavə edildi**\n**Sheriff:** ${sheriffName}\n**Tarix:** ${timestamp}\n**Məzmun:** ${content}`);
            await interaction.reply({ content: 'Qeyd uğurla əlavə edildi.', ephemeral: true });
        }

        if (subcommand === 'view') {
            const search = interaction.options.getString('id');
            const allThreads = await recordChannel.threads.fetch();
            const thread = allThreads.threads.find(t => t.name.includes(search));

            if (!thread) {
                return interaction.reply({ content: `"${search}" ilə vətəndaş tapılmadı.`, ephemeral: true });
            }

            const messages = await thread.messages.fetch({ limit: 50 });
            const records = messages.filter(m => m.content.includes('✍️ **Qeyd əlavə edildi**'));

            const embed = new EmbedBuilder()
                .setTitle(`👤 Vətəndaş Profili: ${thread.name}`)
                .setColor(0x2b2d31)
                .setThumbnail(interaction.guild.iconURL());

            if (records.size > 0) {
                let recordsList = '';
                records.forEach(m => {
                    const lines = m.content.split('\n');
                    const sheriff = lines[1]?.replace('**Sheriff:** ', '') || 'Naməlum';
                    const date = lines[2]?.replace('**Tarix:** ', '') || 'Naməlum';
                    const contentLog = lines.slice(3).join('\n').replace('**Məzmun:** ', '');
                    recordsList += `🔹 **[${date}]** - **${sheriff}**\n${contentLog}\n\n`;
                });
                embed.addFields({ name: '📜 Keçmiş Qeydlər', value: recordsList.substring(0, 1024) });
            } else {
                embed.addFields({ name: '📜 Keçmiş Qeydlər', value: 'Bu vətəndaş üçün hərə qeyd yoxdur.' });
            }

            await interaction.reply({ embeds: [embed] });
        }
    },
};

