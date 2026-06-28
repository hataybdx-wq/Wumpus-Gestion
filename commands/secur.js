// ============================================================
//  Commande : secur — Aide sécurité
// ============================================================

const { PermissionFlagsBits } = require('discord.js')

module.exports = {
  name: 'secur',
  description: 'Affiche l\'état des protections actives',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return
    message.reply(`🛡️ Utilisez : \`${prefix}secur-off\` / \`${prefix}secur-on\` / \`${prefix}secur-max\``)
  },
}
