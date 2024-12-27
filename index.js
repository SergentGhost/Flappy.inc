require('dotenv').config(); // Load environment variables
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const commands = require('./commands.js'); 
const exp = require('./exp.js');// Import commands
const { assignRoleBasedOnAction, setupReactionRoleMessage } = require('./roleManager.js');



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

// Add XP for every message
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const xpGain = 10; // XP gained per message
    const result = exp.addXP(message.author.id, message.guild.id, xpGain);

    // Notify the user if they leveled up
    if (result.leveledUp) {
        message.channel.send(
            `🎉 Congratulations ${message.author}, you've reached level ${result.level}!`
        );

        // Optional: Assign roles on leveling up
        const levelRoles = {
            5: 'Beginner', // Example roles for specific levels
            10: 'Intermediate',
            20: 'Expert',
        };

        if (levelRoles[result.level]) {
            const role = message.guild.roles.cache.find(
                (r) => r.name === levelRoles[result.level]
            );
            if (role) {
                const member = message.guild.members.cache.get(message.author.id);
                await member.roles.add(role).catch(console.error);
                message.channel.send(`You have been granted the **${role.name}** role!`);
            }
        }
    }
});

// Command to check user's level
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    if (message.content.toLowerCase() === '!level') {
        const userLevel = exp.getUserLevel(message.author.id, message.guild.id);
        message.reply(
            `You are level ${userLevel.level} with ${userLevel.xp} XP!`
        );
    }
});


// Automatically assign a role when a user joins the server
client.on('guildMemberAdd', async (member) => {
    await assignRoleBasedOnAction(member, 'Newbie'); // Replace 'Newbie' with your desired role name
});

// Command to set up a reaction role message
client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const command = args[0].toLowerCase();

    if (command === '!setuproles') {
        const roles = [
            { name: 'Gamer', label: '🎮 Gamer' },
            { name: 'Artist', label: '🎨 Artist' },
            { name: 'Developer', label: '💻 Developer' },
        ];

        await setupReactionRoleMessage(message.channel, roles);
        message.reply('Reaction role message set up!');
    }
});


client.login(process.env.TOKEN);