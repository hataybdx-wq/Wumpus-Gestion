// ============================================================
//  Commande : mute — Timeout Discord natif
//  v14 : PermissionFlagsBits.ModerateMembers (anciennement MUTE_MEMBERS)
// ============================================================

const { PermissionFlagsBits } = require('discord.js')
const { sendLog } = require('../utils/logs')
const ms = require('ms')

module.exports = {
  name: 'mute',
  description: 'Réduit un membre au silence (timeout Discord)',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0])
    if (!member) return message.reply('❌ Aucune personne trouvée !')

    const tempsStr = args[1]
    if (!tempsStr) return message.reply('❌ Veuillez indiquer une durée ! (ex: `10m`, `2h`, `1d`)')

    const tempMs = ms(tempsStr)
    if (!tempMs || isNaN(tempMs)) return message.reply('❌ Durée invalide ! (ex: `10m`, `2h`, `1d`)')

    const raison = args.slice(2).join(' ') || 'Aucune raison donnée'

    await member.timeout(tempMs, raison)
      .then(() => {
        message.reply(`✅ <@${member.id}> a été mis en timeout pour \`${tempsStr}\` — \`${raison}\``)
        sendLog(message.guild, 'mod', 'Membre mute (timeout)',
          `**Mute :** <@${member.id}>\n**Par :** <@${message.author.id}>\n**Durée :** ${tempsStr}\n**Raison :** ${raison}`, 0xFFAA00)
      })
      .catch(() => message.reply('❌ Je ne peux pas timeout ce membre.'))
  },
}
