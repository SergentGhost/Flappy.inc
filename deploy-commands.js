// deploy-commands.js
require('dotenv').config(); // Load environment variables
const { REST, Routes } = require('discord.js');
const commands = require('./commands.js'); // Import commands

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID; // Your bot's application ID
const GUILD_ID = process.env.GUILD_ID; // Your server's guild ID

// Prepare the command data for Discord
const commandData = commands.map(command => command.data.toJSON());

// Create a new REST instance
const rest = new REST({ version: '10' }).setToken(TOKEN);

// Deploy the commands
(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        // For guild-based commands (faster update)
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commandData },
        );

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();
