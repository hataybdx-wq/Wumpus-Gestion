const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'vkick',
  description: 'Expulser un membre du vocal',
  aliases: ['voicekick'],
  run: async (client, message) => {
    if (!message.member.permissions.has(PermissionFlagsBits.MoveMembers)) return
    const target = message.mentions.members.first()
    if (!target) return message.reply(`Usage : \`!vkick @membre\``)
    if (!target.voice.channel) return message.reply('Le membre n\'est pas en vocal.')
    await target.voice.disconnect(`Vkick par ${message.author.tag}`).catch(() => false)
    message.reply(`👢 <@${target.id}> expulsé du vocal.`)
  },
}
