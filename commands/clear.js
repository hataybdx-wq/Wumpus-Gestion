// ============================================================
//  Commande : clear — Suppression en masse de messages
//  v14 : PermissionFlagsBits.ManageMessages
// ============================================================

const { PermissionFlagsBits } = require('discord.js')
const { sendLog } = require('../utils/logs')

module.exports = {
  name: 'clear',
  description: 'Supprime les N derniers messages du salon (1-100)',
  aliases: ['purge'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return

    const amount = Math.min(Math.max(parseInt(args[0]) || 0, 1), 100)
    if (!args[0] || isNaN(parseInt(args[0]))) return message.reply('❌ Veuillez indiquer un nombre entre `1` et `100` !')

    await message.channel.bulkDelete(amount, true)
      .then(async deleted => {
        const msg = await message.channel.send(`✅ <@${message.author.id}> a supprimé \`${deleted.size}\` messages.`)
        setTimeout(() => msg.delete().catch(() => false), 5000)

        sendLog(message.guild, 'messages', 'Messages supprimés (clear)',
          `**Salon :** <#${message.channel.id}>\n**Par :** <@${message.author.id}>\n**Quantité :** ${deleted.size}`, 0xFF8800)
      })
      .catch(() => message.reply('❌ Impossible de supprimer ces messages (trop anciens ou erreur).'))
  },
}
