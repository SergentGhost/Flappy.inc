const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

async function assignRoleBasedOnAction(member, roleName) {
    const role = member.guild.roles.cache.find(r => r.name === roleName);
    if (role) {
        await member.roles.add(role).catch(console.error);
    } else {
        console.error(`Role "${roleName}" not found.`);
    }
}

async function setupReactionRoleMessage(channel, roles) {
    const buttons = roles.map(role =>
        new ButtonBuilder()
            .setCustomId(role.name)
            .setLabel(role.label)
            .setStyle(ButtonStyle.Primary)
    );

    const row = new ActionRowBuilder().addComponents(buttons);

    const message = await channel.send({
        content: 'Click a button to get your role!',
        components: [row],
    });

    const collector = message.createMessageComponentCollector({ time: 600000 });

    collector.on('collect', async interaction => {
        const role = roles.find(r => r.name === interaction.customId);
        const member = interaction.guild.members.cache.get(interaction.user.id);

        if (role && member) {
            const guildRole = interaction.guild.roles.cache.find(r => r.name === role.name);

            if (guildRole) {
                if (member.roles.cache.has(guildRole.id)) {
                    await member.roles.remove(guildRole);
                    await interaction.reply({ content: `Removed the "${role.label}" role.`, ephemeral: true });
                } else {
                    await member.roles.add(guildRole);
                    await interaction.reply({ content: `Added the "${role.label}" role.`, ephemeral: true });
                }
            } else {
                await interaction.reply({ content: `Role "${role.label}" does not exist.`, ephemeral: true });
            }
        }
    });

    collector.on('end', () => console.log('Reaction role collector ended.'));
}

module.exports = { assignRoleBasedOnAction, setupReactionRoleMessage };