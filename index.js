require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes, ChannelType, PermissionFlagsBits } = require('discord.js');
const db = require('./src/database/db');
const moment = require('moment');

const fs = require('node:fs');
const path = require('node:path');

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

// Bütün .js fayllarını komanda olaraq yükləyirik
function loadCommands(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
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

// Eventləri yükləyirik
const eventsPath = path.join(__dirname, 'src/events');
if (fs.existsSync(eventsPath)) {
    const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);
        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
    }
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
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'Bu komandanı icra edərkən xəta baş verdi!', ephemeral: true });
            } else {
                await interaction.reply({ content: 'Bu komandanı icra edərkən xəta baş verdi!', ephemeral: true });
            }
        }
    }
    if (interaction.isButton()) {
        const userId = interaction.user.id;
        const userName = interaction.member.displayName;

        if (interaction.customId === 'duty_on') {
            const activeSession = db.prepare('SELECT id FROM duty_logs WHERE user_id = ? AND end_time IS NULL').get(userId);
            if (activeSession) {
                return interaction.reply({ content: 'Siz onsuz da növbədəsiniz!', ephemeral: true });
            }

            db.prepare('INSERT INTO duty_logs (user_id, user_name, start_time) VALUES (?, ?, ?)')
                .run(userId, userName, moment().toISOString());

            try {
                const channelName = `🟢-${userName}`;
                await interaction.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildVoice,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.roles.everyone.id,
                            deny: [PermissionFlagsBits.Connect],
                        },
                        {
                            id: userId,
                            allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.Speak],
                        },
                    ],
                });

                await interaction.reply({ content: `✅ Növbə uğurla başladıldı. Sizin üçün özəl kanal yaradıldı: **${channelName}**`, ephemeral: true });
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'Kanal yaradarkən xəta baş verdi, lakin növbəniz qeydə alındı.', ephemeral: true });
            }
        }

        if (interaction.customId === 'duty_off') {
            const activeSession = db.prepare('SELECT id, start_time FROM duty_logs WHERE user_id = ? AND end_time IS NULL').get(userId);
            if (!activeSession) {
                return interaction.reply({ content: 'Siz hazırda növbədə deyilsiniz!', ephemeral: true });
            }

            const endTime = moment();
            const startTime = moment(activeSession.start_time);
            const duration = moment.duration(endTime.diff(startTime)).asMinutes();

            db.prepare('UPDATE duty_logs SET end_time = ?, duration_minutes = ? WHERE id = ?')
                .run(endTime.toISOString(), Math.round(duration), activeSession.id);

            const channelName = `🟢-${userName}`;
            const channel = interaction.guild.channels.cache.find(c => c.name === channelName);
            if (channel) {
                await channel.delete().catch(console.error);
            }

            await interaction.reply({ content: `🔴 Növbə bitirildi. Ümumi vaxt: **${Math.round(duration)} dəqiqə**.`, ephemeral: true });
        }
    }

    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith('fto_eval_modal_')) {
            const cadetId = interaction.customId.replace('fto_eval_modal_', '');
            const driving = interaction.fields.getTextInputValue('driving');
            const shooting = interaction.fields.getTextInputValue('shooting');
            const comms = interaction.fields.getTextInputValue('comms');
            const comment = interaction.fields.getTextInputValue('comment');

            db.prepare('INSERT INTO fto_evals (cadet_id, fto_id, driving, shooting, communication, comment) VALUES (?, ?, ?, ?, ?, ?)')
                .run(cadetId, interaction.user.id, driving, shooting, comms, comment);

            const embed = new EmbedBuilder()
                .setTitle('🎓 Kadet Qiymətləndirməsi')
                .setColor(0x9b59b6)
                .addFields(
                    { name: '👤 Kadet', value: `<@${cadetId}>`, inline: true },
                    { name: '👨‍🏫 Təlimatçı', value: `<@${interaction.user.id}>`, inline: true },
                    { name: '🚗 Sürüş', value: `${driving}/5`, inline: true },
                    { name: '🎯 Atış', value: `${shooting}/5`, inline: true },
                    { name: '📢 Ünsiyyət', value: `${comms}/5`, inline: true },
                    { name: '📝 Rəy', value: comment }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        }
    }
});


client.once('ready', () => {
    console.log(`✅ Uğurlu giriş edildi! Botun adı: ${client.user.tag}`);
});

client.login(process.env.TOKEN);