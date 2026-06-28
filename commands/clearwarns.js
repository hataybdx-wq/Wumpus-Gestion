// ============================================================
//  Commande : clearwarns — Effacer tous les warns
// ============================================================

const { PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'clearwarns',
  description: 'Effacer tous les avertissements d\'un membre',
  aliases: ['resetwarns'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return

    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0])
    if (!target) return message.reply(`Usage : \`${prefix}clearwarns @membre\``)

    const all = db.get(`warns_${message.guild.id}`) || {}
    const count = (all[target.id] || []).length
    delete all[target.id]
    db.set(`warns_${message.guild.id}`, all)

    return message.reply(`${count} warn(s) effacés pour <@${target.id}>.`)
  },
}
