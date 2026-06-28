const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'pp-random',
  description: 'Photo de profil d\'un membre aléatoire',
  aliases: [],
  run: async (client, message, args, prefix) => {
    const user = client.users.cache.random()
    if (!user) return message.reply('❌ Aucun utilisateur trouvé dans le cache.')

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`**Avatar aléatoire : ${user.username}**`)
      .setImage(user.displayAvatarURL({ dynamic: true, size: 4096 }))
      .setColor(0x5865F2)
      .setFooter({ text: `Demandé par ${message.author.username} | Made by Wumpus`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp()

    message.reply({ embeds: [embed] }).catch(() => false)
  },
}
