require('dotenv').config();
const { Client, GatewayIntentBits, Collection, ChannelType, PermissionFlagsBits, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const moment = require('moment');
const express = require('express');
const ftoSessions = new Map();

const app = express();
app.get('/', (req, res) => res.send('SheriffBot 7/24 Aktivdir!'));
app.listen(process.env.PORT || 3000, () => console.log('✅ Pinger serveri hazırdı.'));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildVoiceStates
    ],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'src/commands');

function loadCommands(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            loadCommands(filePath);
        } else if (file.endsWith('.js')) {
            const command = require(filePath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            }
        }
    }
}
loadCommands(commandsPath);

async function getLogChannel(guild, name) {
    let channel = guild.channels.cache.find(c => c.name === name);
    if (!channel) {
        channel = await guild.channels.create({
            name: name,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel],
                }
            ]
        });
    }
    return channel;
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand() && !interaction.isButton() && !interaction.isModalSubmit()) return;

    // ================= COMMAND =================
    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'Xəta baş verdi!', ephemeral: true });
        }
    }

    // ================= FTO SYSTEM =================

    // 🔹 1-ci modal
    if (interaction.isModalSubmit() && interaction.customId.startsWith('fto_eval_1_')) {

    const userId = interaction.customId.split('_')[3];

    const data1 = {
        driving: interaction.fields.getTextInputValue('driving'),
        shooting: interaction.fields.getTextInputValue('shooting'),
        comms: interaction.fields.getTextInputValue('comms'),
        situation: interaction.fields.getTextInputValue('situation'),
        command: interaction.fields.getTextInputValue('command'),
    };

    // 🔥 JSON yox → Map istifadə edirik
    ftoSessions.set(interaction.user.id, {
        cadetId: userId,
        data1
    });

    const modal2 = new ModalBuilder()
        .setCustomId(`fto_eval_2_${interaction.user.id}`) // qısa ID
        .setTitle('Qiymətləndirmə (2/2)');

    const reportInput = new TextInputBuilder()
        .setCustomId('report')
        .setLabel('Hesabat və Cərimə Yazma (1-5)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const commentInput = new TextInputBuilder()
        .setCustomId('comment')
        .setLabel('Qısa Rəy')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

    modal2.addComponents(
        new ActionRowBuilder().addComponents(reportInput),
        new ActionRowBuilder().addComponents(commentInput)
    );

    return await interaction.showModal(modal2);
}

    // 🔹 2-ci modal FINAL
    if (interaction.isModalSubmit() && interaction.customId.startsWith('fto_eval_2_')) {

    const session = ftoSessions.get(interaction.user.id);

    if (!session) {
        return interaction.reply({
            content: 'Session tapılmadı! Yenidən başlayın.',
            ephemeral: true
        });
    }

    const { cadetId, data1 } = session;

    const report = interaction.fields.getTextInputValue('report');
    const comment = interaction.fields.getTextInputValue('comment');

    const scores = [
        Number(data1.driving),
        Number(data1.shooting),
        Number(data1.comms),
        Number(data1.situation),
        Number(data1.command),
        Number(report)
    ];

    const average = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);

    const ftoLogChannel = await getLogChannel(interaction.guild, 'fto-logs');
    await ftoLogChannel.send(`EVAL:${cadetId}|${interaction.user.id}|${scores.join('|')}|${comment}`);

    const embed = new EmbedBuilder()
        .setTitle('🎓 Kadet Qiymətləndirməsi')
        .setColor(0x3498db)
        .addFields(
            { name: '👤 Kadet', value: `<@${cadetId}>`, inline: true },
            { name: '👨‍🏫 Təlimatçı', value: `<@${interaction.user.id}>`, inline: true },
            { name: '🚗 Nəqliyyat', value: data1.driving, inline: true },
            { name: '🔫 Atış', value: data1.shooting, inline: true },
            { name: '💬 Ünsiyyət', value: data1.comms, inline: true },
            { name: '🧠 Situasiya', value: data1.situation, inline: true },
            { name: '👮 Komandantlıq', value: data1.command, inline: true },
            { name: '📝 Hesabat', value: report, inline: true },
            { name: '⭐ Ortalama', value: average, inline: true },
            { name: '📌 Rəy', value: comment }
        )
        .setTimestamp();

    // session silirik (memory leak olmasın)
    ftoSessions.delete(interaction.user.id);

    return await interaction.reply({ embeds: [embed] });
}

    // ================= QALAN SİSTEMLƏR (sənin köhnə kodun dəyişməyib) =================

    if (interaction.isButton()) {
        const dutyLogChannel = await getLogChannel(interaction.guild, 'duty-logs');
        const userId = interaction.user.id;
        const userName = interaction.member.displayName;

        if (interaction.customId === 'duty_on') {
            const logs = await dutyLogChannel.messages.fetch({ limit: 50 });
            const active = logs.find(m => m.content.includes(`ON:${userId}`));
            if (active) return interaction.reply({ content: 'Siz onsuz da növbədəsiniz!', ephemeral: true });

            await dutyLogChannel.send(`ON:${userId} | ${userName} | ${moment().toISOString()}`);

            const channelName = `🟢-${userName}`;
            await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildVoice,
                permissionOverwrites: [
                    { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.Connect] },
                    { id: userId, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] },
                ],
            });

            await interaction.reply({ content: `✅ Növbə başladı`, ephemeral: true });
        }

        if (interaction.customId === 'duty_off') {
            const logs = await dutyLogChannel.messages.fetch({ limit: 50 });
            const startLog = logs.find(m => m.content.includes(`ON:${userId}`));
            if (!startLog) return interaction.reply({ content: 'Növbədə deyilsiniz!', ephemeral: true });

            const startTime = moment(startLog.content.split('|')[2].trim());
            const duration = Math.round(moment.duration(moment().diff(startTime)).asMinutes());

            await startLog.delete();
            await dutyLogChannel.send(`SUM:${userId} | ${userName} | ${duration}`);

            await interaction.reply({ content: `🔴 Növbə bitdi: ${duration} dəqiqə`, ephemeral: true });
        }
    }

});
client.once('ready', () => console.log(`✅ ${client.user.tag} aktivdir!`));
client.login(process.env.TOKEN);
