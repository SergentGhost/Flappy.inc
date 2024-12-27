const fs = require('fs');
const path = require('path');

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

// Add XP and check for level-ups
const addXP = (userId, guildId, amount) => {
    const userData = loadUserData();
    const key = `${guildId}-${userId}`;

    if (!userData[key]) {
        userData[key] = { xp: 0, level: 1 };
    }

    userData[key].xp += amount;

    // Check for level-up
    const requiredXP = 100 * userData[key].level; // XP required to level up
    if (userData[key].xp >= requiredXP) {
        userData[key].level += 1;
        userData[key].xp -= requiredXP; // Carry over remaining XP
        saveUserData(userData);
        return { leveledUp: true, level: userData[key].level };
    }

    saveUserData(userData);
    return { leveledUp: false };
};

// Get user level
const getUserLevel = (userId, guildId) => {
    const userData = loadUserData();
    const key = `${guildId}-${userId}`;

    if (!userData[key]) {
        return { xp: 0, level: 1 };
    }

    return userData[key];
};

module.exports = {
    addXP,
    getUserLevel,
};
