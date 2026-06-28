// ============================================================
//  Commande : gunban — Retirer de la blacklist globale
// ============================================================

const { PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'gunban',
  description: 'Lève un bannissement global',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return

    const userId = args[0]
    if (!userId) return message.reply('❌ Veuillez fournir un ID utilisateur !')
    if (userId === message.author.id) return message.reply('❌ ID invalide !')
    if (db.get(`${userId}.bl`) !== true) return message.reply('❌ Cet utilisateur n\'est pas dans la blacklist !')

    db.set(`${userId}.bl`, null)
    message.reply(`✅ <@${userId}> a été retiré de la **blacklist** globale.`)
  },
}
