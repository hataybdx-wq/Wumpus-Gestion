// ============================================================
//  Commande : unban — Débannissement
//  Correction : variable 'raison' était non définie dans l'original
// ============================================================

const { PermissionFlagsBits } = require('discord.js')
const { sendLog } = require('../utils/logs')

module.exports = {
  name: 'unban',
  description: 'Lève le bannissement d\'un utilisateur',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return

    const userId = args[0]
    if (!userId) return message.reply('❌ Veuillez fournir un ID utilisateur !')

    const raison = args.slice(1).join(' ') || 'Aucune raison donnée'

    await message.guild.bans.remove(userId, `Débanni par ${message.author.username} — ${raison}`)
      .then(() => {
        message.reply(`✅ <@${userId}> a été débanni.`)
        sendLog(message.guild, 'mod', 'Membre débanni',
          `**Débanni :** <@${userId}>\n**Par :** <@${message.author.id}>\n**Raison :** ${raison}`, 0x44FF88)
      })
      .catch(() => message.reply('❌ Impossible de débannir ce membre (pas trouvé dans les bans).'))
  },
}
