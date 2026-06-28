// ============================================================
//  Commande : gban — Blacklist globale
// ============================================================

const { PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'gban',
  description: 'Bannit sur tous les serveurs où le bot est présent',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.BanMembers)) return

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0])
    if (!member) return message.reply('❌ Veuillez mentionner un utilisateur ou fournir un ID valide !')
    if (member.id === message.author.id) return message.reply('❌ Vous ne pouvez pas vous blacklister vous-même !')
    if (member.id === client.user.id) return message.reply('❌ Vous ne pouvez pas blacklister le bot !')

    if (db.get(`${member.id}.bl`) === true) return message.reply('❌ Ce membre est déjà dans la blacklist !')

    db.set(`${member.id}.bl`, true)
    message.reply(`✅ <@${member.id}> a été ajouté à la **blacklist** globale.`)
  },
}
