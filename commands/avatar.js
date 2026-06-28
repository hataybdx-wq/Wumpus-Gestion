// ============================================================
//  Commande : avatar — Afficher l'avatar d'un membre
// ============================================================

const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'avatar',
  description: 'Afficher l\'avatar d\'un membre',
  aliases: ['av'],

  run: async (client, message, args) => {
    const user = message.mentions.users.first()
      || await client.users.fetch(args[0]).catch(() => null)
      || message.author

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Avatar de ${user.username}`)
      .setColor(0xFF0000)
      .setImage(user.displayAvatarURL({ size: 4096, dynamic: true }))
      .setURL(user.displayAvatarURL({ size: 4096, dynamic: true }))
      .setFooter({ text: 'Made by Wumpus' })

    message.reply({ embeds: [embed] })
  },
}
