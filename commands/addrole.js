const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'addrole',
  description: 'Donner un rôle à un membre',
  aliases: ['giverole'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return
    const target = message.mentions.members.first()
    const role = message.mentions.roles.first() || message.guild.roles.cache.find(r => r.name.toLowerCase() === args.slice(1).join(' ').toLowerCase())
    if (!target || !role) return message.reply(`Usage : \`${prefix}addrole @membre @rôle\``)
    try {
      await target.roles.add(role)
      message.reply(`Rôle <@&${role.id}> donné à <@${target.id}>`)
    } catch { message.reply('Impossible (hiérarchie ?)') }
  },
}
