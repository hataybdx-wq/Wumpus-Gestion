const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'removerole',
  description: 'Retirer un rôle à un membre',
  aliases: ['takerole'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return
    const target = message.mentions.members.first()
    const role = message.mentions.roles.first() || message.guild.roles.cache.find(r => r.name.toLowerCase() === args.slice(1).join(' ').toLowerCase())
    if (!target || !role) return message.reply(`Usage : \`${prefix}removerole @membre @rôle\``)
    try {
      await target.roles.remove(role)
      message.reply(`Rôle <@&${role.id}> retiré de <@${target.id}>`)
    } catch { message.reply('Impossible (hiérarchie ?)') }
  },
}
