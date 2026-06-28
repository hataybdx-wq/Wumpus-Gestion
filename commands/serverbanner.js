const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'serverbanner',
  description: 'Afficher la bannière du serveur',
  aliases: ['sbanner', 'server-banner'],
  run: async (client, message) => {
    const banner = message.guild.bannerURL({ size: 4096 })
    if (!banner) return message.reply('Ce serveur n\'a pas de bannière.')
    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Bannière · ${message.guild.name}`)
      .setColor(0xFF0000)
      .setImage(banner)
      .setFooter({ text: 'Made by Wumpus' })
    ] })
  },
}
