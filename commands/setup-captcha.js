const { PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

module.exports = {
  name: 'setup-captcha',
  description: 'Configure un captcha anti-bot à l\'arrivée des membres',
  aliases: [],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return

    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0])
    const role    = message.mentions.roles.first()    || message.guild.roles.cache.get(args[1])

    if (!channel || !role)
      return message.reply(`❌ Usage : \`${prefix}setup-captcha #salon @rôle\``)

    db.set(`captchachannel_${message.guild.id}`, channel.id)
    db.set(`captcharole_${message.guild.id}`,    role.id)
    db.set(`captcha_${message.guild.id}`,        true)

    message.reply(`✅ Captcha configuré : salon <#${channel.id}> — rôle <@&${role.id}>`)
  },
}
