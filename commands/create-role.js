const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'createrole',
  description: 'Créer un rôle',
  aliases: ['create-role', 'newrole'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return
    const name = args.join(' ')
    if (!name) return message.reply(`Usage : \`${prefix}createrole <nom>\``)
    try {
      const role = await message.guild.roles.create({ name })
      message.reply(`Rôle créé : <@&${role.id}>`)
    } catch { message.reply('Erreur de création.') }
  },
}
