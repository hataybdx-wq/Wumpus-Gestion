const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'age',
  description: 'Âge du compte Discord',
  aliases: ['account-age'],
  run: async (client, message) => {
    const target = message.mentions.users.first() || message.author
    const ts = Math.floor(target.createdTimestamp / 1000)
    const days = Math.floor((Date.now() - target.createdTimestamp) / 86400000)
    const years = Math.floor(days / 365)
    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Âge du compte de ${target.username}`)
      .setColor(0xFF0000)
      .setThumbnail(target.displayAvatarURL())
      .setDescription(`Créé <t:${ts}:F>\n**${days} jours** (${years} an${years > 1 ? 's' : ''})\n<t:${ts}:R>`)
      .setFooter({ text: 'Made by Wumpus' })
    ] })
  },
}
