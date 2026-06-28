// ============================================================
//  Commande : userinfo — Informations sur un utilisateur
//  v14 : EmbedBuilder, user.discriminator déprécié (vaut "0" pour les nouveaux usernames)
// ============================================================

const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'userinfo',
  description: 'Informations complètes sur un membre',
  aliases: [],
  run: async (client, message, args, prefix) => {
    const targetUser = message.mentions.users.first() || client.users.cache.get(args[0]) || message.author
    const user = await client.users.fetch(targetUser.id, { force: true }).catch(() => targetUser)
    const member = message.guild.members.cache.get(user.id)

    const flags = user.flags?.toArray() ?? []
    const badgesStr = flags.length ? flags.map(f => `\`${f}\``).join(', ') : 'Aucun'

    const embed = new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle(`Informations sur ${user.username}`)
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setColor(0xFF0000)
      .addFields(
      .setFooter({ text: 'Made by Wumpus' })
        { name: '👤 Pseudo',         value: user.username,                                                     inline: true },
        { name: '🤖 Bot',            value: user.bot ? 'Oui' : 'Non',                                         inline: true },
        { name: '🏅 Badges',         value: badgesStr,                                                         inline: false },
        { name: '📅 Compte créé le', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`,               inline: false },
        { name: '📛 Surnom',         value: member?.nickname ?? 'Aucun',                                       inline: true },
        { name: '📥 Arrivé le',      value: member ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'Inconnu', inline: true },
        { name: '🎭 Rôle supérieur', value: member?.roles.highest.toString() ?? 'Aucun',                       inline: false },
      )
      .setTimestamp()
      .setFooter({ text: `Demandé par ${message.author.username}`, iconURL: message.author.displayAvatarURL({ dynamic: true }) })

    message.reply({ embeds: [embed] })
  },
}
