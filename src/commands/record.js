const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const db = require('../database/db');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('record')
        .setDescription('Vətəndaş qeydləri sistemi')
        .addSubcommand(subcommand =>
            subcommand
                .setName('create')
                .setDescription('Bazada yeni bir vətəndaş profili yaradır')
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
                .addIntegerOption(option => option.setName('id').setDescription('Vətəndaşın unikal ID-si').setRequired(true))),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'create') {
            const name = interaction.options.getString('ad_soyad');
            
            // Verilənlər bazasına əlavə edirik
            const info = db.prepare('INSERT INTO citizens (name) VALUES (?)').run(name);
            const citizenId = info.lastInsertRowid;
            const uniqueName = `[ID: ${citizenId}] ${name}`;

            try {
                // Thread (Alt başlıq) yaradırıq
                // Qeyd: Bu komanda işlədilən kanalda thread yaradacaq.
                // Əsas record kanalında olması üçün kanal yoxlanışı edilə bilər.
                const thread = await interaction.channel.threads.create({
                    name: uniqueName,
                    autoArchiveDuration: 60,
                    type: ChannelType.GuildPublicThread,
                    reason: 'Yeni vətəndaş profili yaradıldı',
                });

                // Cədvəldə thread_id-ni yeniləyirik
                db.prepare('UPDATE citizens SET thread_id = ? WHERE id = ?').run(thread.id, citizenId);

                await interaction.reply({
                    content: `✅ Yeni vətəndaş profili yaradıldı: **${uniqueName}**\nThread: <#${thread.id}>`,
                    ephemeral: false
                });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Thread yaradarkən xəta baş verdi. Kanaldakı icazələri yoxlayın.', ephemeral: true });
            }
        }

        if (subcommand === 'add') {
            const content = interaction.options.getString('qeyd');
            const thread = interaction.channel;

            if (!thread.isThread()) {
                return interaction.reply({ content: 'Bu komanda yalnız vətəndaşın alt başlığında (thread) işlədilə bilər.', ephemeral: true });
            }

            // Thread adına görə ID-ni tapırıq
            const citizen = db.prepare('SELECT id FROM citizens WHERE thread_id = ?').get(thread.id);
            if (!citizen) {
                return interaction.reply({ content: 'Bu thread bazada qeydiyyatda olan bir vətəndaşa aid deyil.', ephemeral: true });
            }

            const sheriffName = interaction.member.displayName;
            const timestamp = moment().format('DD.MM.YYYY HH:mm');

            db.prepare('INSERT INTO records (citizen_id, sheriff_name, content) VALUES (?, ?, ?)')
                .run(citizen.id, sheriffName, content);

            await thread.send(`✍️ **Qeyd əlavə edildi**\n**Sheriff:** ${sheriffName}\n**Tarix:** ${timestamp}\n**Məzmun:** ${content}`);
            await interaction.reply({ content: 'Qeyd uğurla əlavə edildi.', ephemeral: true });
        }

        if (subcommand === 'view') {
            const id = interaction.options.getInteger('id');
            const citizen = db.prepare('SELECT * FROM citizens WHERE id = ?').get(id);

            if (!citizen) {
                return interaction.reply({ content: `ID: ${id} ilə vətəndaş tapılmadı.`, ephemeral: true });
            }

            const records = db.prepare('SELECT * FROM records WHERE citizen_id = ? ORDER BY created_at DESC').all(id);

            const embed = new EmbedBuilder()
                .setTitle(`👤 Vətəndaş Profili: ${citizen.name}`)
                .setDescription(`**Unikal ID:** ${citizen.id}\n**Yaradılma Tarixi:** ${moment(citizen.created_at).format('DD.MM.YYYY')}`)
                .setColor(0x2b2d31)
                .setThumbnail(interaction.guild.iconURL());

            if (records.length > 0) {
                let recordsList = '';
                records.forEach(rec => {
                    const date = moment(rec.created_at).format('DD.MM.YYYY HH:mm');
                    recordsList += `🔹 **[${date}]** - **${rec.sheriff_name}**\n${rec.content}\n\n`;
                });
                // Embed limiti (4096 char) nəzərə alınmalıdır, burada sadə saxlayırıq
                embed.addFields({ name: '📜 Keçmiş Qeydlər', value: recordsList.substring(0, 1024) || 'Qeyd yoxdur' });
            } else {
                embed.addFields({ name: '📜 Keçmiş Qeydlər', value: 'Bu vətəndaş üçün hələ qeyd yoxdur.' });
            }

            await interaction.reply({ embeds: [embed] });
        }
    },
};
