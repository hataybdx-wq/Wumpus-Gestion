const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'pp-serveur',
  description: 'Affiche l\'icône du serveur',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.guild.iconURL({ dynamic: true }))
      return message.channel.send('❌ Ce serveur n\'a pas d\'icône.')

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`**Icône de : ${message.guild.name}**`)
      .setImage(message.guild.iconURL({ dynamic: true, size: 4096 }))
      .setColor(0x5865F2)
      .setFooter({ text: `${message.author.username} | Made by Wumpus`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp()

    message.channel.send({ embeds: [embed] })
  },
}
