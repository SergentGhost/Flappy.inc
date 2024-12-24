// commands.js
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const ytdl = require('ytdl-core');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');


// Array of commands
const commands = [
    // 1. Ping Command
    {
        data: new SlashCommandBuilder()
            .setName('ping')
            .setDescription('Replies with Pong!'),
        async execute(interaction) {
            await interaction.reply('🏓 Pong!');
        },
    },

    // 2. Ban Command
    {
        data: new SlashCommandBuilder()
            .setName('ban')
            .setDescription('Ban a user from the server.')
            .addUserOption(option => 
                option.setName('user')
                    .setDescription('The user to ban')
                    .setRequired(true))
            .addStringOption(option => 
                option.setName('reason')
                    .setDescription('Reason for banning')
                    .setRequired(false)),
        async execute(interaction) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return interaction.reply({ content: 'You do not have permission to ban members!', ephemeral: true });
            }

            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            const member = interaction.guild.members.cache.get(user.id);
            if (!member) {
                return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
            }

            try {
                await member.ban({ reason });
                await interaction.reply(`${user.tag} has been banned. Reason: ${reason}`);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error trying to ban this user.', ephemeral: true });
            }
        },
    },

    // 3. Kick Command
    {
        data: new SlashCommandBuilder()
            .setName('kick')
            .setDescription('Kick a user from the server.')
            .addUserOption(option => 
                option.setName('user')
                    .setDescription('The user to kick')
                    .setRequired(true))
            .addStringOption(option => 
                option.setName('reason')
                    .setDescription('Reason for kicking')
                    .setRequired(false)),
        async execute(interaction) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers)) {
                return interaction.reply({ content: 'You do not have permission to kick members!', ephemeral: true });
            }

            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            const member = interaction.guild.members.cache.get(user.id);
            if (!member) {
                return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
            }

            try {
                await member.kick(reason);
                await interaction.reply(`${user.tag} has been kicked. Reason: ${reason}`);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error trying to kick this user.', ephemeral: true });
            }
        },
    },

    // 4. Mute Command
    {
        data: new SlashCommandBuilder()
            .setName('mute')
            .setDescription('Mute a user in the server.')
            .addUserOption(option => 
                option.setName('user')
                    .setDescription('The user to mute')
                    .setRequired(true))
            .addStringOption(option => 
                option.setName('duration')
                    .setDescription('Duration of mute (e.g., 10m, 1h)')
                    .setRequired(false)),
        async execute(interaction) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                return interaction.reply({ content: 'You do not have permission to mute members!', ephemeral: true });
            }

            const user = interaction.options.getUser('user');
            const duration = interaction.options.getString('duration') || '10m';

            const member = interaction.guild.members.cache.get(user.id);
            if (!member) {
                return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
            }

            try {
                await member.timeout(ms(duration), `Muted by ${interaction.user.tag}`);
                await interaction.reply(`${user.tag} has been muted for ${duration}.`);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error trying to mute this user.', ephemeral: true });
            }
        },
    },

    // 5. Unmute Command
    {
        data: new SlashCommandBuilder()
            .setName('unmute')
            .setDescription('Unmute a user in the server.')
            .addUserOption(option => 
                option.setName('user')
                    .setDescription('The user to unmute')
                    .setRequired(true)),
        async execute(interaction) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
                return interaction.reply({ content: 'You do not have permission to unmute members!', ephemeral: true });
            }

            const user = interaction.options.getUser('user');
            const member = interaction.guild.members.cache.get(user.id);
            if (!member) {
                return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
            }

            try {
                await member.timeout(null, `Unmuted by ${interaction.user.tag}`);
                await interaction.reply(`${user.tag} has been unmuted.`);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error trying to unmute this user.', ephemeral: true });
            }
        },
    },

    // 6. Warn Command
    {
        data: new SlashCommandBuilder()
            .setName('warn')
            .setDescription('Warn a user in the server.')
            .addUserOption(option => 
                option.setName('user')
                    .setDescription('The user to warn')
                    .setRequired(true))
            .addStringOption(option => 
                option.setName('reason')
                    .setDescription('Reason for warning')
                    .setRequired(false)),
        async execute(interaction) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return interaction.reply({ content: 'You do not have permission to warn members!', ephemeral: true });
            }

            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            try {
                await interaction.reply(`${user.tag} has been warned. Reason: ${reason}`);
                await user.send(`You have been warned in **${interaction.guild.name}**. Reason: ${reason}`);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error trying to warn this user.', ephemeral: true });
            }
        },
    },

    // 7. Clear Messages Command
    {
        data: new SlashCommandBuilder()
            .setName('clear')
            .setDescription('Clear a number of messages in the chat.')
            .addIntegerOption(option => 
                option.setName('amount')
                    .setDescription('Number of messages to delete')
                    .setRequired(true)),
        async execute(interaction) {
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return interaction.reply({ content: 'You do not have permission to delete messages!', ephemeral: true });
            }

            const amount = interaction.options.getInteger('amount');
            try {
                await interaction.channel.bulkDelete(amount, true);
                await interaction.reply(`${amount} messages have been deleted.`);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error trying to delete messages.', ephemeral: true });
            }
        },
    },

    // 8. Server Info Command
    {
        data: new SlashCommandBuilder()
            .setName('serverinfo')
            .setDescription('Displays information about the server.'),
        async execute(interaction) {
            const serverInfo = {
                name: interaction.guild.name,
                memberCount: interaction.guild.memberCount,
                region: interaction.guild.region,
                owner: interaction.guild.ownerId,
            };
            await interaction.reply(`Server Name: ${serverInfo.name}\nMembers: ${serverInfo.memberCount}\nRegion: ${serverInfo.region}\nOwner: <@${serverInfo.owner}>`);
        },
    },

    // 9. User Info Command
    {
        data: new SlashCommandBuilder()
            .setName('userinfo')
            .setDescription('Displays information about a user.')
            .addUserOption(option => 
                option.setName('user')
                    .setDescription('The user to get info about')
                    .setRequired(true)),
        async execute(interaction) {
            const user = interaction.options.getUser('user');
            const member = interaction.guild.members.cache.get(user.id);

            const userInfo = {
                username: user.username,
                id: user.id,
                joinedAt: member.joinedAt,
                status: user.presence?.status || 'Offline',
            };

            await interaction.reply(`Username: ${userInfo.username}\nID: ${userInfo.id}\nJoined: ${userInfo.joinedAt}\nStatus: ${userInfo.status}`);
        },
    },

    // 10. Channel Info Command
    {
        data: new SlashCommandBuilder()
            .setName('channelinfo')
            .setDescription('Displays information about the current channel.'),
        async execute(interaction) {
            const channel = interaction.channel;
            const channelInfo = {
                name: channel.name,
                type: channel.type,
                createdAt: channel.createdAt,
                topic: channel.topic || 'No topic',
            };
            await interaction.reply(`Channel Name: ${channelInfo.name}\nType: ${channelInfo.type}\nCreated: ${channelInfo.createdAt}\nTopic: ${channelInfo.topic}`);
        },
    },

    // 11. Role Info Command
    {
        data: new SlashCommandBuilder()
            .setName('roleinfo')
            .setDescription('Displays information about a specific role.')
            .addRoleOption(option => 
                option.setName('role')
                    .setDescription('The role to get info about')
                    .setRequired(true)),
        async execute(interaction) {
            const role = interaction.options.getRole('role');
            const roleInfo = {
                name: role.name,
                id: role.id,
                color: role.color,
                createdAt: role.createdAt,
                members: role.members.size,
            };
            await interaction.reply(`Role Name: ${roleInfo.name}\nID: ${roleInfo.id}\nColor: ${roleInfo.color}\nCreated: ${roleInfo.createdAt}\nMembers: ${roleInfo.members}`);
        },
    },

    // 12. Emoji List Command
    {
        data: new SlashCommandBuilder()
            .setName('emojis')
            .setDescription('Displays a list of all emojis in the server.'),
        async execute(interaction) {
            const emojis = interaction.guild.emojis.cache.map(emoji => emoji.toString()).join(' ');
            await interaction.reply(`Emojis in this server:\n${emojis}`);
        },
    },

    // 13. Say Command
    {
        data: new SlashCommandBuilder()
            .setName('say')
            .setDescription('Make the bot say something.')
            .addStringOption(option => 
                option.setName('message')
                    .setDescription('The message for the bot to say')
                    .setRequired(true)),
        async execute(interaction) {
            const message = interaction.options.getString('message');
            await interaction.reply(message);
        },
    },

    // 14. Echo Command
    {
        data: new SlashCommandBuilder()
            .setName('echo')
            .setDescription('Echo a message to the chat.')
            .addStringOption(option => 
                option.setName('text')
                    .setDescription('The text to echo')
                    .setRequired(true)),
        async execute(interaction) {
            const text = interaction.options.getString('text');
            await interaction.reply(text);
        },
    },

    // 15. Coin Flip Command
    {
        data: new SlashCommandBuilder()
            .setName('coinflip')
            .setDescription('Flips a coin.'),
        async execute(interaction) {
            const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
            await interaction.reply(`The coin landed on: ${result}`);
        },
    },

    // 16. Roll Command
    {
        data: new SlashCommandBuilder()
            .setName('roll')
            .setDescription('Rolls a dice (1-6).'),
        async execute(interaction) {
            const roll = Math.floor(Math.random() * 6) + 1;
            await interaction.reply(`You rolled a: ${roll}`);
        },
    },

    // 17. Poll Command
    {
        data: new SlashCommandBuilder()
            .setName('poll')
            .setDescription('Create a poll with two options.')
            .addStringOption(option => 
                option.setName('question')
                    .setDescription('The question for the poll')
                    .setRequired(true))
            .addStringOption(option => 
                option.setName('option1')
                    .setDescription('First option')
                    .setRequired(true))
            .addStringOption(option => 
                option.setName('option2')
                    .setDescription('Second option')
                    .setRequired(true)),
        async execute(interaction) {
            const question = interaction.options.getString('question');
            const option1 = interaction.options.getString('option1');
            const option2 = interaction.options.getString('option2');
            const pollMessage = await interaction.reply({
                content: `${question}\n1️⃣ ${option1}\n2️⃣ ${option2}`,
                fetchReply: true,
            });

            await pollMessage.react('1️⃣');
            await pollMessage.react('2️⃣');
        },
    },

    // 18. User Avatar Command
    {
        data: new SlashCommandBuilder()
            .setName('avatar')
            .setDescription('Get the avatar of a user.')
            .addUserOption(option => 
                option.setName('user')
                    .setDescription('The user to get avatar of')
                    .setRequired(true)),
        async execute(interaction) {
            const user = interaction.options.getUser('user');
            await interaction.reply(user.displayAvatarURL());
        },
    },

    // 19. Weather Command
    {
        data: new SlashCommandBuilder()
            .setName('weather')
            .setDescription('Get the weather of a location.')
            .addStringOption(option => 
                option.setName('location')
                    .setDescription('The location to get weather for')
                    .setRequired(true)),
        async execute(interaction) {
            const location = interaction.options.getString('location');
            // You can integrate a weather API to fetch the weather
            await interaction.reply(`Weather info for ${location} is coming soon!`);
        },
    },

    // 20. Joke Command
    {
        data: new SlashCommandBuilder()
            .setName('joke')
            .setDescription('Get a random joke.'),
        async execute(interaction) {
            // Placeholder for joke API integration
            await interaction.reply('Why don\'t skeletons fight each other? They don\'t have the guts!');
        },
    },

    // 21. 8Ball Command
    {
        data: new SlashCommandBuilder()
            .setName('8ball')
            .setDescription('Ask the magic 8 ball a question.')
            .addStringOption(option => 
                option.setName('question')
                    .setDescription('The question to ask the magic 8 ball')
                    .setRequired(true)),
        async execute(interaction) {
            const answers = ['Yes', 'No', 'Maybe', 'Ask again later', 'Definitely not', 'It\'s unclear'];
            const randomAnswer = answers[Math.floor(Math.random() * answers.length)];
            await interaction.reply(randomAnswer);
        },
    },

    // 22. Quote Command
    {
        data: new SlashCommandBuilder()
            .setName('quote')
            .setDescription('Get a random inspirational quote.'),
        async execute(interaction) {
            const quotes = [
                '“The only limit to our realization of tomorrow is our doubts of today.” - Franklin D. Roosevelt',
                '“Success is not final, failure is not fatal: It is the courage to continue that counts.” - Winston Churchill',
                '“It does not matter how slowly you go as long as you do not stop.” - Confucius',
            ];
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            await interaction.reply(randomQuote);
        },
    },

    // 23. Remind Command
    {
        data: new SlashCommandBuilder()
            .setName('remind')
            .setDescription('Set a reminder.')
            .addStringOption(option => 
                option.setName('message')
                    .setDescription('The message for the reminder')
                    .setRequired(true))
            .addStringOption(option => 
                option.setName('time')
                    .setDescription('When to remind you (e.g., "1m", "1h")')
                    .setRequired(true)),
        async execute(interaction) {
            const message = interaction.options.getString('message');
            const time = interaction.options.getString('time');
            const duration = ms(time); // Using ms to convert time into milliseconds
            setTimeout(() => {
                interaction.reply(`Reminder: ${message}`);
            }, duration);
            await interaction.reply(`Reminder set for ${time}: ${message}`);
        },
    },

    // 24. Translate Command
    {
        data: new SlashCommandBuilder()
            .setName('translate')
            .setDescription('Translate text to a specific language.')
            .addStringOption(option => 
                option.setName('text')
                    .setDescription('The text to translate')
                    .setRequired(true))
            .addStringOption(option => 
                option.setName('language')
                    .setDescription('Language to translate to (e.g., en, fr)')
                    .setRequired(true)),
        async execute(interaction) {
            const text = interaction.options.getString('text');
            const language = interaction.options.getString('language');
            // Placeholder for translation API
            await interaction.reply(`Translating "${text}" to ${language}...`);
        },
    },

];

module.exports = commands;
