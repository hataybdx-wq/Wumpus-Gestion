const { PermissionFlagsBits, ChannelType } = require('discord.js')
module.exports = {
  name: 'createvoice',
  description: 'Créer un salon vocal',
  aliases: ['create-voice', 'newvoice'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return
    const name = args.join(' ')
    if (!name) return message.reply(`Usage : \`${prefix}createvoice <nom>\``)
    try {
      const ch = await message.guild.channels.create({ name, type: ChannelType.GuildVoice })
      message.reply(`Salon vocal créé : **${ch.name}**`)
    } catch { message.reply('Erreur de création.') }
  },
}
