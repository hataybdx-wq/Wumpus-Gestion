const { PermissionFlagsBits, ChannelType } = require('discord.js')
module.exports = {
  name: 'createchannel',
  description: 'Créer un salon textuel',
  aliases: ['create-channel', 'newchannel'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) return
    const name = args.join('-').toLowerCase()
    if (!name) return message.reply(`Usage : \`${prefix}createchannel <nom>\``)
    try {
      const ch = await message.guild.channels.create({ name, type: ChannelType.GuildText })
      message.reply(`Salon créé : <#${ch.id}>`)
    } catch { message.reply('Erreur de création.') }
  },
}
