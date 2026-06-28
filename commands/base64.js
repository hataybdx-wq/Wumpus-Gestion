module.exports = {
  name: 'base64',
  description: 'Encoder/décoder en base64',
  aliases: ['b64'],
  run: async (client, message, args) => {
    if (!args.length) return message.reply(`Usage : \`!base64 <texte>\` · \`!base64 decode <base64>\``)

    if (args[0] === 'decode' || args[0] === '-d') {
      try {
        const result = Buffer.from(args.slice(1).join(' '), 'base64').toString('utf-8')
        return message.reply(result.length > 1900 ? result.slice(0, 1900) : result)
      } catch { return message.reply('Base64 invalide.') }
    }

    const result = Buffer.from(args.join(' ')).toString('base64')
    message.reply(result.length > 1900 ? result.slice(0, 1900) : result)
  },
}
