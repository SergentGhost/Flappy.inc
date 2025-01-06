require('dotenv').config(); // Load environment variables
const { Client, GatewayIntentBits, Collection } = require('discord.js');
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

const { EmbedBuilder } = require('discord.js');

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
    // Get the default system channel or fallback to a channel named "general"
    const welcomeChannel = member.guild.systemChannel || member.guild.channels.cache.find(ch => ch.name === 'general');
    if (welcomeChannel) {
        // Get the user's display name
        const displayName = member.user.username;

        // Pick a random welcome message
        const randomMessage = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)]
            .replace('{user}', displayName);

        // Create an embed message
        const embed = new EmbedBuilder()
            .setColor('#1E90FF') // Set embed color
            .setAuthor({
                name: `Welcome, ${displayName}!`,
                iconURL: member.user.displayAvatarURL({ dynamic: true }),
            })
            .setDescription(randomMessage)
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true })) // Add user's profile picture
            .setFooter({ text: `Member #${member.guild.memberCount}` }) // Show member count
            .setTimestamp(); // Add timestamp

        // Send the embed to the welcome channel
        welcomeChannel.send({ embeds: [embed] });
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

const { addXP, getUserLevel } = require('./src/exp.js');

client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    // Add XP to the user when they send a message
    const xpGain = Math.floor(Math.random() * 10) + 5; // Random XP between 5-15
    const result = addXP(message.member, xpGain);

    // Optionally log level-ups in the server
    if (result.leveledUp) {
        const levelUpEmbed = new EmbedBuilder()
            .setColor('#FFD700')
            .setAuthor({ name: message.member.displayName, iconURL: message.member.displayAvatarURL() })
            .setTitle('🎉 Level Up!')
            .setDescription(`${message.member} has reached **Level ${result.level}**!`)
            .setFooter({ text: 'Keep it up!' });

        message.channel.send({ embeds: [levelUpEmbed] });
    }
});

// Command to check user level
client.on('messageCreate', (message) => {
    if (message.author.bot) return;

    const args = message.content.split(' ');
    const command = args[0].toLowerCase();

    if (command === '!level') {
        const userLevelData = getUserLevel(message.author.id, message.guild.id);
        const embed = new EmbedBuilder()
            .setColor('#1E90FF')
            .setAuthor({ name: message.member.displayName, iconURL: message.member.displayAvatarURL() })
            .setTitle('📊 Your Level & XP')
            .setDescription(`**Level**: ${userLevelData.level}\n**XP**: ${userLevelData.xp}/${userLevelData.requiredXP}`)
            .setFooter({ text: 'Keep participating to earn more XP!' });

        message.reply({ embeds: [embed] });
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

const games = require('./src/game.js');

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const args = message.content.split(' ');
  const command = args[0].toLowerCase();

  if (command === '!guessnumber') {
    await games.guessNumber(message);
  } else if (command === '!tictactoe') {
    await games.ticTacToe(message);
  } else if (command === '!games') {
    message.channel.send("🎮 Available games: `!guessnumber` and `!tictactoe`. Type a command to start!");
  }
});

client.login(process.env.TOKEN);