const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'emojis',
  description: 'Liste des emojis du serveur',
  aliases: ['emoji-list', 'emotes'],
  run: async (client, message) => {
    const emojis = message.guild.emojis.cache
    const animated = emojis.filter(e => e.animated)
    const statiques = emojis.filter(e => !e.animated)

    const list = emojis.size === 0
      ? '_Aucun emoji_'
      : emojis.map(e => e.toString()).join(' ').slice(0, 3900)

    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Emojis · ${message.guild.name}`)
      .setColor(0xFF0000)
      .setDescription(list)
      .setFooter({ text: `${statiques.size} statique(s) · ${animated.size} animé(s) · ${emojis.size} total | Made by Wumpus` })
    ] })
  },
}
