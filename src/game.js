const { MessageActionRow, MessageButton } = require('discord.js');

const games = {
  // Guess the Number Game
  guessNumber: async (message) => {
    const targetNumber = Math.floor(Math.random() * 100) + 1; // Number between 1-100
    const maxAttempts = 7;
    let attempts = 0;

    message.channel.send('🎲 **Guess the Number!** I am thinking of a number between 1 and 100. You have 7 attempts. Type your guesses!');

    const filter = (m) => m.author.id === message.author.id;
    const collector = message.channel.createMessageCollector({ filter, time: 60000 }); // 60 seconds to guess

    collector.on('collect', (msg) => {
      const guess = parseInt(msg.content);
      attempts++;

      if (isNaN(guess)) {
        msg.reply('❌ Please enter a valid number!');
        return;
      }

      if (guess === targetNumber) {
        msg.reply(`🎉 Correct! The number was **${targetNumber}**. You guessed it in ${attempts} attempts!`);
        collector.stop();
      } else if (attempts >= maxAttempts) {
        msg.reply(`😔 You've used all your attempts! The correct number was **${targetNumber}**.`);
        collector.stop();
      } else if (guess < targetNumber) {
        msg.reply('🔼 Too low! Try again.');
      } else if (guess > targetNumber) {
        msg.reply('🔽 Too high! Try again.');
      }
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        message.channel.send(`⏳ Time's up! The number was **${targetNumber}**.`);
      }
      // Prompt for another game
      message.channel.send("🕹️ If you'd like to play another game, type `!guessnumber` or `!tictactoe`!");
    });
  },

  // Tic-Tac-Toe Game
  ticTacToe: async (message) => {
    const board = ['⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜', '⬜'];
    let currentPlayer = '❌';
    const positions = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣'];

    const renderBoard = () => {
      return `${board.slice(0, 3).join('')} \n${board.slice(3, 6).join('')} \n${board.slice(6, 9).join('')}`;
    };

    const checkWin = () => {
      const winPatterns = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
      ];

      return winPatterns.some((pattern) => pattern.every((index) => board[index] === currentPlayer));
    };

    const checkDraw = () => board.every((cell) => cell !== '⬜');

    const row = new MessageActionRow();
    positions.forEach((pos, i) => {
      row.addComponents(
        new MessageButton()
          .setCustomId(i.toString())
          .setLabel(pos)
          .setStyle('PRIMARY'),
      );
    });

    const gameMessage = await message.channel.send({
      content: `🎮 **Tic-Tac-Toe**\n${renderBoard()}\n${currentPlayer}'s turn!`,
      components: [row],
    });

    const collector = gameMessage.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        interaction.reply({ content: 'This is not your game!', ephemeral: true });
        return;
      }

      const index = parseInt(interaction.customId);
      if (board[index] !== '⬜') {
        interaction.reply({ content: 'This spot is already taken!', ephemeral: true });
        return;
      }

      board[index] = currentPlayer;
      if (checkWin()) {
        gameMessage.edit({ content: `🎉 **${currentPlayer} Wins!**\n${renderBoard()}`, components: [] });
        collector.stop();
        return;
      }

      if (checkDraw()) {
        gameMessage.edit({ content: `🤝 **It's a Draw!**\n${renderBoard()}`, components: [] });
        collector.stop();
        return;
      }

      currentPlayer = currentPlayer === '❌' ? '⭕' : '❌';
      interaction.update({ content: `🎮 **Tic-Tac-Toe**\n${renderBoard()}\n${currentPlayer}'s turn!`, components: [row] });
    });

    collector.on('end', (_, reason) => {
      if (reason === 'time') {
        gameMessage.edit({ content: `⏳ **Game Timed Out!**\n${renderBoard()}`, components: [] });
      }
      // Prompt for another game
      message.channel.send("🕹️ If you'd like to play another game, type `!guessnumber` or `!tictactoe`!");
    });
  },
};

module.exports = games;
