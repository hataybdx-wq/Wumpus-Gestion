const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'ping',
  description: 'Affiche la latence du bot et de l\'API Discord',
  aliases: [],
  run: async (client, message, args, prefix) => {
    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setDescription(`🏓 Mon ping est de : **${client.ws.ping}ms**`)
      .setColor(0x5865F2)
      .setFooter({ text: `Demandé par ${message.author.username} | Made by Wumpus`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
    message.reply({ embeds: [embed] })
  },
}
