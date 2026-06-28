// ============================================================
//  Commande : unwarn — Retirer un avertissement
// ============================================================

const { PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'unwarn',
  description: 'Retirer un avertissement d\'un membre',
  aliases: ['delwarn', 'removewarn'],

  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ModerateMembers)) return

    const target = message.mentions.members.first() || message.guild.members.cache.get(args[0])
    if (!target) return message.reply(`Usage : \`${prefix}unwarn @membre <id_du_warn>\``)

    const warnId = args[1]?.toUpperCase()
    if (!warnId) return message.reply(`Précisez l'ID du warn (visible avec \`${prefix}warns @${target.user.username}\`)`)

    const all = db.get(`warns_${message.guild.id}`) || {}
    if (!all[target.id]) return message.reply(`Ce membre n'a aucun warn.`)

    const before = all[target.id].length
    all[target.id] = all[target.id].filter(w => w.id !== warnId)
    if (all[target.id].length === before) return message.reply(`Warn \`${warnId}\` introuvable.`)

    db.set(`warns_${message.guild.id}`, all)
    return message.reply(`Warn \`${warnId}\` retiré de <@${target.id}>.`)
  },
}
