// ============================================================
//  Commande : tempban — Bannissement temporaire
//  v14 : member.ban({ reason }) + guild.bans.remove()
// ============================================================

const { PermissionFlagsBits } = require('discord.js')
const { sendLog } = require('../utils/logs')
const ms = require('ms')

module.exports = {
  name: 'tempban',
  description: 'Bannit temporairement un membre (ex: 1h, 7d)',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0])
    if (!member) return message.reply('❌ Aucune personne trouvée !')
    if (!member.bannable) return message.reply('❌ Je ne peux pas bannir ce membre (rôle supérieur) !')

    const tempsStr = args[1]
    if (!tempsStr) return message.reply('❌ Veuillez indiquer une durée ! (ex: `10m`, `2h`, `1d`)')

    const tempMs = ms(tempsStr)
    if (!tempMs || isNaN(tempMs)) return message.reply('❌ Durée invalide !')

    const raison = args.slice(2).join(' ') || 'Aucune raison donnée'
    const userId = member.id

    await member.ban({ reason: `Tempban par ${message.author.username} (${tempsStr}) — ${raison}` })
    message.reply(`✅ **${member.user.username}** banni pour \`${tempsStr}\` — \`${raison}\``)

    sendLog(message.guild, 'mod', 'Tempban',
      `**Banni :** <@${userId}>\n**Par :** <@${message.author.id}>\n**Durée :** ${tempsStr}\n**Raison :** ${raison}`, 0xFF4444)

    setTimeout(async () => {
      await message.guild.bans.remove(userId, `Fin du tempban (${tempsStr})`).catch(() => false)
      sendLog(message.guild, 'mod', 'Tempban expiré', `<@${userId}> a été automatiquement débanni.`, 0x44FF88)
    }, tempMs)
  },
}
