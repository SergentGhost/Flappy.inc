const inviteCounts = new Map();

async function fetchInvites(client) {
    await Promise.all(
        client.guilds.cache.map(async (guild) => {
            const guildInvites = await guild.invites.fetch();
            guildInvites.forEach((invite) => {
                inviteCounts.set(invite.code, { uses: invite.uses || 0, inviter: invite.inviter });
            });
        })
    );
}

async function handleGuildMemberAdd(member) {
    const cachedInvites = await member.guild.invites.fetch();
    const usedInvite = cachedInvites.find(
        (invite) => inviteCounts.get(invite.code)?.uses < invite.uses
    );

    if (usedInvite) {
        const inviter = usedInvite.inviter.tag;
        console.log(`${member.user.tag} joined using invite code ${usedInvite.code}`);
        console.log(`This invite was created by ${inviter}`);
    }

    // Update the invite cache
    cachedInvites.forEach((invite) => {
        inviteCounts.set(invite.code, { uses: invite.uses || 0, inviter: invite.inviter });
    });
}

function getUserInvites(guild, userId) {
    let userInvites = 0;

    guild.invites.cache.forEach((invite) => {
        if (invite.inviter && invite.inviter.id === userId) {
            userInvites += invite.uses || 0;
        }
    });

    return userInvites;
}

function getInviteLeaderboard(guild) {
    const leaderboard = [];

    guild.invites.cache.forEach((invite) => {
        if (invite.inviter) {
            const inviter = invite.inviter.tag;
            const uses = invite.uses || 0;

            const existing = leaderboard.find((entry) => entry.inviter === inviter);
            if (existing) {
                existing.uses += uses;
            } else {
                leaderboard.push({ inviter, uses });
            }
        }
    });

    leaderboard.sort((a, b) => b.uses - a.uses);
    return leaderboard;
}

module.exports = {
    fetchInvites,
    handleGuildMemberAdd,
    getUserInvites,
    getInviteLeaderboard,
};
