const { PermissionFlagsBits } = require('discord.js')
module.exports = {
  name: 'stealemoji',
  description: 'Ajoute un emoji depuis un autre serveur',
  aliases: ['steal-emoji', 'addemoji'],
  run: async (client, message, args, prefix) => {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) return
    const arg = args[0]
    const name = args[1] || null
    if (!arg) return message.reply(`Usage : \`${prefix}stealemoji <emoji|url> [nom]\``)

    const match = arg.match(/<(a?):(\w+):(\d+)>/)
    let url, finalName
    if (match) {
      const ext = match[1] === 'a' ? 'gif' : 'png'
      url = `https://cdn.discordapp.com/emojis/${match[3]}.${ext}`
      finalName = name || match[2]
    } else if (/^https?:/.test(arg)) {
      url = arg
      finalName = name || 'stolen'
    } else {
      return message.reply('Emoji ou URL invalide.')
    }

    try {
      const emoji = await message.guild.emojis.create({ attachment: url, name: finalName })
      message.reply(`Emoji ajouté : ${emoji.toString()} \`:${emoji.name}:\``)
    } catch {
      message.reply('Erreur (taille max dépassée ou trop d\'emojis ?)')
    }
  },
}
