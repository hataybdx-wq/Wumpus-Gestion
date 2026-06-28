// ============================================================
//  Commande : banner — Bannière de profil
//  v14 : user.fetch({ force: true }) pour récupérer la bannière
//  (discord-banners-js peut être instable — méthode native préférée)
// ============================================================

const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'banner',
  description: 'Affiche la bannière de profil d\'un membre',
  aliases: [],
  run: async (client, message, args, prefix) => {
    const targetUser = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author

    // Fetch forcé pour obtenir les données de bannière
    const user = await client.users.fetch(targetUser.id, { force: true }).catch(() => null)
    if (!user) return message.reply('❌ Utilisateur introuvable.')

    const bannerURL = user.bannerURL({ dynamic: true, size: 4096 })

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`**Bannière de : ${user.username}**`)
      .setColor(user.accentColor ?? 0x5865F2)
      .setFooter({ text: `${message.author.username} | Made by Wumpus`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })
      .setTimestamp()

    if (bannerURL) {
      embed.setImage(bannerURL)
    } else {
      embed.setDescription('Ce membre n\'a pas de bannière de profil.')
    }

    message.reply({ embeds: [embed] }).catch(() => false)
  },
}
