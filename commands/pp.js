// ============================================================
//  Commande : pp — Avatar d'un utilisateur
//  v14 : EmbedBuilder, displayAvatarURL({ forceStatic: false })
// ============================================================

const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'pp',
  description: 'Affiche la photo de profil d\'un membre',
  aliases: [],
  run: async (client, message, args, prefix) => {
    const user = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`**Avatar de : ${user.username}**`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }))
      .setColor(0x5865F2)
      .setFooter({ text: `${message.author.username} | Made by Wumpus`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp()

    message.reply({ embeds: [embed] })
  },
}
