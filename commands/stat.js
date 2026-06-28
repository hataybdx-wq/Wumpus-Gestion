const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'stat',
  description: 'Statistiques du bot (serveurs, membres, uptime)',
  aliases: [],
  run: async (client, message, args, prefix) => {
    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setDescription(`📊 Le bot est présent sur **${client.guilds.cache.size} serveurs** !`)
      .setColor(0xFF0000)
      .setFooter({ text: 'Made by Wumpus' })
    message.reply({ embeds: [embed] })
  },
}
