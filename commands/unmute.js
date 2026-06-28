// ============================================================
//  Commande : unmute — Retirer le timeout
//  v14 : PermissionFlagsBits.ModerateMembers
// ============================================================

const { PermissionFlagsBits } = require('discord.js')
const { sendLog } = require('../utils/logs')

module.exports = {
  name: 'unmute',
  description: 'Lève le silence d\'un membre',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0])
    if (!member) return message.reply('❌ Aucune personne trouvée !')
    if (!member.isCommunicationDisabled()) return message.reply('❌ Ce membre n\'est pas en timeout !')

    await member.timeout(null)
      .then(() => {
        message.reply(`✅ <@${member.id}> a été démute.`)
        sendLog(message.guild, 'mod', 'Membre démute',
          `**Démute :** <@${member.id}>\n**Par :** <@${message.author.id}>`, 0x44FF88)
      })
      .catch(() => message.reply('❌ Je ne peux pas retirer le timeout de ce membre.'))
  },
}
