require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes, ChannelType, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const moment = require('moment');
const express = require('express');

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

// Log kanallarını tapmaq və ya yaratmaq üçün funksiya
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

    if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            const msg = { content: 'Bu komandanı icra edərkən xəta baş verdi!', ephemeral: true };
            if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
            else await interaction.reply(msg);
        }
    }

    if (interaction.isButton()) {
        const dutyLogChannel = await getLogChannel(interaction.guild, 'duty-logs');
        const userId = interaction.user.id;
        const userName = interaction.member.displayName;

        if (interaction.customId === 'duty_on') {
            // Aktiv növbəni yoxlayırıq (log kanalında son mesajlara baxaraq)
            const logs = await dutyLogChannel.messages.fetch({ limit: 50 });
            const active = logs.find(m => m.content.includes(`ON:${userId}`));
            if (active) return interaction.reply({ content: 'Siz onsuz da növbədəsiniz!', ephemeral: true });

            await dutyLogChannel.send(`ON:${userId} | ${userName} | ${moment().toISOString()}`);

            try {
                const channelName = `🟢-${userName}`;
                await interaction.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildVoice,
                    permissionOverwrites: [
                        { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.Connect] },
                        { id: userId, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak] },
                    ],
                });
                await interaction.reply({ content: `✅ Növbə başladıldı. Özəl kanal: **${channelName}**`, ephemeral: true });
            } catch (error) {
                await interaction.reply({ content: 'Kanal yaradılmadı, amma növbə başladı.', ephemeral: true });
            }
        }

        if (interaction.customId === 'duty_off') {
            const logs = await dutyLogChannel.messages.fetch({ limit: 50 });
            const startLog = logs.find(m => m.content.includes(`ON:${userId}`));
            if (!startLog) return interaction.reply({ content: 'Siz növbədə deyilsiniz!', ephemeral: true });

            const startTime = moment(startLog.content.split('|')[2].trim());
            const duration = Math.round(moment.duration(moment().diff(startTime)).asMinutes());

            await startLog.delete();
            await dutyLogChannel.send(`SUM:${userId} | ${userName} | ${duration} | ${moment().toISOString()}`);

            const channelName = `🟢-${userName}`;
            const channel = interaction.guild.channels.cache.find(c => c.name === channelName);
            if (channel) await channel.delete().catch(() => {});

            await interaction.reply({ content: `🔴 Növbə bitdi. Müddət: **${duration} dəqiqə**.`, ephemeral: true });
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('fto_eval_modal_')) {
            const cadetId = interaction.customId.replace('fto_eval_modal_', '');
            const fields = ['driving', 'shooting', 'comms', 'comment'].map(f => interaction.fields.getTextInputValue(f));
            
            const ftoLogChannel = await getLogChannel(interaction.guild, 'fto-logs');
            await ftoLogChannel.send(`EVAL:${cadetId}|${interaction.user.id}|${fields.join('|')}`);

            const embed = new EmbedBuilder()
                .setTitle('🎓 Kadet Qiymətləndirməsi')
                .setColor(0x9b59b6)
                .addFields(
                    { name: '👤 Kadet', value: `<@${cadetId}>`, inline: true },
                    { name: '👨‍🏫 Təlimatçı', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '🚗 Sürüş', value: `${fields[0]}/5`, inline: true },
                    { name: '🎯 Atış', value: `${fields[1]}/5`, inline: true },
                    { name: '📢 Ünsiyyət', value: `${fields[2]}/5`, inline: true },
                    { name: '📝 Rəy', value: fields[3] }
                ).setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    }
});

client.once('ready', () => console.log(`✅ ${client.user.tag} aktivdir!`));
client.on('guildMemberAdd', async member => {
    const role = member.guild.roles.cache.get('1482726948580102218');
    if (role) await member.roles.add(role).catch(console.error);
});
client.login(process.env.TOKEN);
