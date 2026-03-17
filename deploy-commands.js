require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const commands = [];
const commandsPath = path.join(__dirname, 'src/commands');

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
                commands.push(command.data.toJSON());
            }
        }
    }
}

loadCommands(commandsPath);

const rest = new REST().setToken(process.env.TOKEN);

(async () => {
    try {
        console.log(`📡 ${commands.length} slash komandası qeydiyyata alınır...`);

        const data = await rest.put(
            Routes.applicationCommands(process.env.CLIENT_ID || '1351110000000000000'), // CLIENT_ID .env-də olmalıdır
            { body: commands },
        );

        console.log(`✅ ${data.length} slash komandası uğurla qeydiyyata alındı!`);
    } catch (error) {
        console.error(error);
    }
})();
