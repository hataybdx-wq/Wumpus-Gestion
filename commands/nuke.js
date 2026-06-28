const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'nuke',
  description: 'Détruit et recrée le salon à l\'identique',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return

    if (args[0] !== 'confirm') {
      return message.reply(`⚠️ Cette commande va **vider tout le salon**. Confirme avec \`${prefix}nuke confirm\``)
    }

    const ch = message.channel
    const position = ch.position
    try {
      const cloned = await ch.clone()
      await cloned.setPosition(position)
      await ch.delete(`Nuké par ${message.author.tag}`)
      cloned.send(`💣 Salon nuké par <@${message.author.id}>`)
    } catch {
      message.reply('Erreur.')
    }
  },
}
