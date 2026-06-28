const { PermissionFlagsBits } = require('discord.js')

module.exports = {
  name: 'say',
  description: 'Envoie un message en tant que le bot',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) return
    if (!args[0]) return message.reply('❌ Vous devez spécifier un message !')

    await message.delete().catch(() => false)
    message.channel.send(args.join(' ')).catch(() => false)
  },
}
