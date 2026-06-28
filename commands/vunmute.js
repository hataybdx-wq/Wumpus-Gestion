const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'vunmute',
  description: 'Unmute un membre en vocal',
  aliases: ['voiceunmute'],
  run: async (client, message) => {
    if (!message.member.permissions.has(PermissionFlagsBits.MuteMembers)) return
    const target = message.mentions.members.first()
    if (!target) return message.reply(`Usage : \`!vunmute @membre\``)
    if (!target.voice.channel) return message.reply('Le membre n\'est pas en vocal.')
    await target.voice.setMute(false, `Vunmute par ${message.author.tag}`).catch(() => false)
    message.reply(`🔊 <@${target.id}> démuté en vocal.`)
  },
}
