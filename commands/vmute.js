const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'vmute',
  description: 'Mute un membre en vocal',
  aliases: ['voicemute'],
  run: async (client, message) => {
    if (!message.member.permissions.has(PermissionFlagsBits.MuteMembers)) return
    const target = message.mentions.members.first()
    if (!target) return message.reply(`Usage : \`!vmute @membre\``)
    if (!target.voice.channel) return message.reply('Le membre n\'est pas en vocal.')
    await target.voice.setMute(true, `Vmute par ${message.author.tag}`).catch(() => false)
    message.reply(`🔇 <@${target.id}> muté en vocal.`)
  },
}
