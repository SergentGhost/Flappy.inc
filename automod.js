const { Events } = require('discord.js');

// Map to track spam messages
const spamTracker = new Map();

module.exports = {
    name: "automod",
    once: false,
    async execute(client) {
        console.log("Auto Moderation loaded!");

        // Message Create Event
        client.on(Events.MessageCreate, async (message) => {
            if (message.author.bot) return;

            // 1. Detect inappropriate messages
            if (badWords.some(word => message.content.toLowerCase().includes(word))) {
                await message.delete();
                message.channel.send(`${message.author}, please avoid using inappropriate language.`);
                return;
            }

            // 2. Anti-spam filter
            const currentTime = Date.now();
            const userMessages = spamTracker.get(message.author.id) || [];
            const filteredMessages = userMessages.filter(msgTime => currentTime - msgTime < 10000);
            filteredMessages.push(currentTime);
            spamTracker.set(message.author.id, filteredMessages);

            if (filteredMessages.length > 5) {
                await message.member.timeout(300000, "Spamming");
                message.channel.send(`${message.author} has been muted for spamming.`);
                spamTracker.delete(message.author.id);
                return;
            }

            // 3. Announcement command
            if (message.content.startsWith("!announce") && message.member.permissions.has("ManageMessages")) {
                const announcement = message.content.slice(9).trim();
                if (!announcement) {
                    message.channel.send("Please provide an announcement.");
                    return;
                }

                const announcementChannel = message.guild.channels.cache.find(ch => ch.name === "announcements");
                if (!announcementChannel) {
                    message.channel.send("Announcements channel not found.");
                    return;
                }

                announcementChannel.send(announcement);
                return;
            }
        });

        // Role Assignment Command (Slash Command Example)
        client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isCommand()) return;

            const { commandName, options } = interaction;

            if (commandName === "giverole") {
                const roleName = options.getString("role");
                const role = interaction.guild.roles.cache.find(r => r.name === roleName);

                if (!role) {
                    interaction.reply("Role not found.");
                    return;
                }

                try {
                    await interaction.member.roles.add(role);
                    interaction.reply(`You have been assigned the ${role.name} role.`);
                } catch (error) {
                    console.error(error);
                    interaction.reply("Failed to assign the role.");
                }
            }
        });
       


        // User Logs
        client.on(Events.GuildMemberAdd, (member) => {
            const logChannel = member.guild.channels.cache.find(ch => ch.name === "logs");
            if (logChannel) logChannel.send(`User ${member.user.tag} has joined.`);
        });

        client.on(Events.GuildMemberRemove, (member) => {
            const logChannel = member.guild.channels.cache.find(ch => ch.name === "logs");
            if (logChannel) logChannel.send(`User ${member.user.tag} has left.`);
        });
    },
};

// List of banned words for detecting inappropriate messages
const badWords = [""];
  

