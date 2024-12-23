// commands.js
const { PermissionsBitField, SlashCommandBuilder } = require('discord.js');
const ytdl = require('ytdl-core');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');


// Array of commands
const commands = [
{
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Replies with Pong!'),
    async execute(interaction) {
        await interaction.reply('🏓 Pong!');
    },
},
    // Ban Command
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
            // Check permissions
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

    // Kick Command
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
            // Check permissions
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

    // Mute Command
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
            // Check permissions
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

    // Unmute Command
    {
        data: new SlashCommandBuilder()
            .setName('unmute')
            .setDescription('Unmute a user in the server.')
            .addUserOption(option => 
                option.setName('user')
                    .setDescription('The user to unmute')
                    .setRequired(true)),
        async execute(interaction) {
            // Check permissions
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

    // Warn Command
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
            // Check permissions
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return interaction.reply({ content: 'You do not have permission to warn members!', ephemeral: true });
            }

            const user = interaction.options.getUser('user');
            const reason = interaction.options.getString('reason') || 'No reason provided';

            // Implement a warning system (e.g., log to a database or channel)
            // For simplicity, we'll just send a message
            try {
                await interaction.reply(`${user.tag} has been warned. Reason: ${reason}`);
                // Optionally, send a DM to the user
                await user.send(`You have been warned in **${interaction.guild.name}**. Reason: ${reason}`);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error trying to warn this user.', ephemeral: true });
            }
        },
    },

    // Clear Messages Command
    {
        data: new SlashCommandBuilder()
            .setName('clear')
            .setDescription('Clear a number of messages from a channel.')
            .addIntegerOption(option => 
                option.setName('amount')
                    .setDescription('Number of messages to delete (1-100)')
                    .setRequired(true)),
        async execute(interaction) {
            // Check permissions
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
                return interaction.reply({ content: 'You do not have permission to manage messages!', ephemeral: true });
            }

            const amount = interaction.options.getInteger('amount');

            if (amount < 1 || amount > 100) {
                return interaction.reply({ content: 'Please provide a number between 1 and 100.', ephemeral: true });
            }

            try {
                await interaction.channel.bulkDelete(amount, true);
                await interaction.reply(`Successfully deleted ${amount} messages.`);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error trying to delete messages.', ephemeral: true });
            }
        },
    },

    // Lock Channel Command
    {
        data: new SlashCommandBuilder()
            .setName('lockchannel')
            .setDescription('Lock the current channel, preventing users from sending messages.'),
        async execute(interaction) {
            // Check permissions
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return interaction.reply({ content: 'You do not have permission to manage channels!', ephemeral: true });
            }

            try {
                await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: false });
                await interaction.reply(`🔒 **${interaction.channel.name}** has been locked.`);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error trying to lock the channel.', ephemeral: true });
            }
        },
    },

    // Unlock Channel Command
    {
        data: new SlashCommandBuilder()
            .setName('unlockchannel')
            .setDescription('Unlock the current channel, allowing users to send messages again.'),
        async execute(interaction) {
            // Check permissions
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return interaction.reply({ content: 'You do not have permission to manage channels!', ephemeral: true });
            }

            try {
                await interaction.channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { SendMessages: true });
                await interaction.reply(`🔓 **${interaction.channel.name}** has been unlocked.`);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error trying to unlock the channel.', ephemeral: true });
            }
        },
    },

    // Slowmode Command
    {
        data: new SlashCommandBuilder()
            .setName('slowmode')
            .setDescription('Set the slowmode delay for the current channel.')
            .addIntegerOption(option => 
                option.setName('duration')
                    .setDescription('Duration in seconds (0-21600)')
                    .setRequired(true)),
        async execute(interaction) {
            // Check permissions
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
                return interaction.reply({ content: 'You do not have permission to manage channels!', ephemeral: true });
            }

            const duration = interaction.options.getInteger('duration');

            if (duration < 0 || duration > 21600) {
                return interaction.reply({ content: 'Please provide a duration between 0 and 21600 seconds (6 hours).', ephemeral: true });
            }

            try {
                await interaction.channel.setRateLimitPerUser(duration);
                await interaction.reply(`⏳ Slowmode has been set to ${duration} seconds.`);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error trying to set slowmode.', ephemeral: true });
            }
        },
    },

    // Unban Command
    {
        data: new SlashCommandBuilder()
            .setName('unban')
            .setDescription('Unban a user from the server.')
            .addStringOption(option => 
                option.setName('user')
                    .setDescription('The user ID to unban')
                    .setRequired(true)),
        async execute(interaction) {
            // Check permissions
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
                return interaction.reply({ content: 'You do not have permission to unban members!', ephemeral: true });
            }

            const userId = interaction.options.getString('user');

            try {
                await interaction.guild.members.unban(userId);
                await interaction.reply(`✅ User with ID ${userId} has been unbanned.`);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error trying to unban this user.', ephemeral: true });
            }
        },
    },

    // Play Command
    {
        data: new SlashCommandBuilder()
            .setName('play')
            .setDescription('Play a song from YouTube in your current voice channel.')
            .addStringOption(option => 
                option.setName('url')
                    .setDescription('The YouTube URL of the song')
                    .setRequired(true)),
        async execute(interaction) {
            const url = interaction.options.getString('url');

            if (!ytdl.validateURL(url)) {
                return interaction.reply({ content: 'Please provide a valid YouTube URL.', ephemeral: true });
            }

            const member = interaction.member;
            const voiceChannel = member.voice.channel;

            if (!voiceChannel) {
                return interaction.reply({ content: 'You need to be in a voice channel to use this command!', ephemeral: true });
            }

            // Check bot permissions
            const permissions = voiceChannel.permissionsFor(interaction.guild.me);
            if (!permissions.has(PermissionsBitField.Flags.Connect) || !permissions.has(PermissionsBitField.Flags.Speak)) {
                return interaction.reply({ content: 'I need permissions to join and speak in your voice channel!', ephemeral: true });
            }

            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });

                const player = createAudioPlayer();
                const stream = ytdl(url, { filter: 'audioonly' });
                const resource = createAudioResource(stream);

                player.play(resource);
                connection.subscribe(player);

                player.on(AudioPlayerStatus.Idle, () => {
                    connection.destroy(); // Leave the channel when the song is finished
                });

                await interaction.reply(`🎶 Now playing: ${url}`);
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error trying to play the song!', ephemeral: true });
            }
        },
    },

    // Stop Command
    {
        data: new SlashCommandBuilder()
            .setName('stop')
            .setDescription('Stop the current song and make the bot leave the voice channel.'),
        async execute(interaction) {
            const member = interaction.member;
            const voiceChannel = member.voice.channel;

            if (!voiceChannel) {
                return interaction.reply({ content: 'You need to be in a voice channel to use this command!', ephemeral: true });
            }

            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: voiceChannel.guild.id,
                    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                });

                connection.destroy();
                await interaction.reply('🛑 Stopped the music and left the voice channel!');
            } catch (error) {
                console.error(error);
                await interaction.reply({ content: 'There was an error trying to stop the music!', ephemeral: true });
            }
        },
    },
];

module.exports = commands;
