require('dotenv').config(); // Load environment variables
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const commands = require('./commands.js'); // Import commands

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,// Required for voice commands
    ],
});

// Create a Collection (map) for commands
client.commands = new Collection();

// Register commands in the Collection
commands.forEach(command => {
    client.commands.set(command.data.name, command);
});

client.once('ready', () => {
    console.log(`${client.user.tag} is online!`);

    // Set bot status to Do Not Disturb
    client.user.setPresence({
        status: 'dnd', // "dnd" means Do Not Disturb
    });
});

// Array of random welcome messages
const welcomeMessages = [
    
    "Welcome to the server, {user}! We're excited to have you here! 🎉",
    "Hey {user}, welcome aboard! We're glad you're here! 🎊",
    "A warm welcome to {user}! Enjoy your stay! 🌟",
    "Welcome, {user}! We hope you have a great time here! 😄",
    "Hello {user}! Welcome to the community, let's have some fun! 🎉",
    "Welcome {user}, we're so happy you joined us! 🙌",
    "Hi {user}! Thanks for joining us, enjoy your time here! 🌈",
    "Yay! {user} just joined! Welcome to the server! 🎈",
    "Greetings {user}! We're thrilled to have you here! 😊",
    "Welcome to the server, {user}! We hope you find this place awesome! 🚀"
];


// Greet new users with a random welcome message when they join the server
client.on('guildMemberAdd', async (member) => {
    const welcomeChannel = member.guild.systemChannel || member.guild.channels.cache.find(ch => ch.name === 'general'); // Choose a default channel
    if (welcomeChannel) {
        // Get the user's nickname or use their username if they don't have a nickname
        const displayName = member.nickname || member.user.username;

        // Pick a random welcome message
        const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];

        // Send the message with the user's nickname or username replaced
        welcomeChannel.send(randomMessage.replace('{user}', displayName));
    }
});

// Handle interactions (slash commands)
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction);
    } catch (error) {
        console.error(error);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    }
});

const {
    fetchInvites,
    handleGuildMemberAdd,
    getUserInvites,
    getInviteLeaderboard,
} = require('./inviteTracker.js');

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);
    await fetchInvites(client);
});

client.on('guildMemberAdd', async (member) => {
    await handleGuildMemberAdd(member);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const command = args[0].toLowerCase();

    if (command === '!invites') {
        const userInvites = getUserInvites(message.guild, message.author.id);
        message.reply(`You have invited ${userInvites} member(s) to the server.`);
    }

    if (command === '!leaderboard') {
        const leaderboard = getInviteLeaderboard(message.guild);
        const leaderboardMessage = leaderboard
            .slice(0, 10) // Limit to top 10
            .map((entry, index) => `#${index + 1} ${entry.inviter}: ${entry.uses} invite(s)`)
            .join('\n');
        message.reply(`**Invite Leaderboard:**\n${leaderboardMessage}`);
    }
});

client.login(process.env.TOKEN);