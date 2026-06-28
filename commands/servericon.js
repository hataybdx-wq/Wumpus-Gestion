const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'servericon',
  description: 'Afficher l\'icône du serveur',
  aliases: ['sicon', 'icon'],
  run: async (client, message) => {
    const icon = message.guild.iconURL({ size: 4096, dynamic: true })
    if (!icon) return message.reply('Ce serveur n\'a pas d\'icône.')
    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Icône · ${message.guild.name}`)
      .setColor(0xFF0000)
      .setImage(icon)
      .setFooter({ text: 'Made by Wumpus' })
    ] })
  },
}
