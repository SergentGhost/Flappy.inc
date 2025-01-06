const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

// File to store user data
const xpFile = path.resolve(__dirname, 'userData.json');

// Initialize file if it doesn't exist
if (!fs.existsSync(xpFile)) {
    fs.writeFileSync(xpFile, JSON.stringify({}));
}

// Load user data
const loadUserData = () => {
    const data = fs.readFileSync(xpFile, 'utf-8');
    return JSON.parse(data);
};

// Save user data
const saveUserData = (data) => {
    fs.writeFileSync(xpFile, JSON.stringify(data, null, 2));
};

// XP curve for levels
const getRequiredXP = (level) => Math.floor(100 * Math.pow(1.25, level - 1)); // Dynamic XP curve

// Add XP and handle level-ups
const addXP = (member, amount) => {
    const { id: userId, guild } = member;
    const guildId = guild.id;

    const userData = loadUserData();
    const key = `${guildId}-${userId}`;

    if (!userData[key]) {
        userData[key] = { xp: 0, level: 1 };
    }

    userData[key].xp += amount;

    // Check for level-up
    const requiredXP = getRequiredXP(userData[key].level);
    let leveledUp = false;

    while (userData[key].xp >= requiredXP) {
        userData[key].level += 1;
        userData[key].xp -= requiredXP;
        leveledUp = true;
    }

    saveUserData(userData);

    // Send an embedded message to the user
    const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setAuthor({ name: `${member.displayName}`, iconURL: member.displayAvatarURL() })
        .setTitle(leveledUp ? '🎉 Level Up!' : '✨ XP Gained!')
        .setDescription(
            leveledUp
                ? `Congratulations! You've reached **Level ${userData[key].level}**!`
                : `You've gained **${amount} XP**. Keep participating to level up!`
        )
        .setFooter({ text: `Current Level: ${userData[key].level} | XP: ${userData[key].xp}/${requiredXP}` });

    member.send({ embeds: [embed] }).catch(() => {
        console.log(`Could not DM ${member.displayName} about their XP progress.`);
    });

    return { leveledUp, level: userData[key].level };
};

// Get user level and XP
const getUserLevel = (userId, guildId) => {
    const userData = loadUserData();
    const key = `${guildId}-${userId}`;

    if (!userData[key]) {
        return { xp: 0, level: 1 };
    }

    const requiredXP = getRequiredXP(userData[key].level);
    return { ...userData[key], requiredXP };
};

module.exports = {
    addXP,
    getUserLevel,
};
