const { EmbedBuilder } = require('discord.js')
module.exports = {
  name: 'joined',
  description: 'Date d\'arrivée d\'un membre sur le serveur',
  aliases: ['arrivée'],
  run: async (client, message) => {
    const target = message.mentions.members.first() || message.member
    const ts = Math.floor(target.joinedTimestamp / 1000)
    const now = Math.floor(Date.now() / 1000)
    const days = Math.floor((now - ts) / 86400)
    message.reply({ embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Arrivée de ${target.user.username}`)
      .setColor(0xFF0000)
      .setThumbnail(target.user.displayAvatarURL())
      .setDescription(`Arrivé <t:${ts}:F> (il y a **${days} jours**)\n<t:${ts}:R>`)
      .setFooter({ text: 'Made by Wumpus' })
    ] })
  },
}
