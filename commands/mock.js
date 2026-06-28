module.exports = {
  name: 'mock',
  description: 'TrAnSfOrMe Un TeXte En MoQuErIe',
  aliases: ['mocking', 'moquerie'],
  run: async (client, message, args) => {
    const text = args.join(' ')
    if (!text) return message.reply(`Usage : \`!mock <texte>\``)
    const result = text.split('').map((c, i) => i % 2 ? c.toUpperCase() : c.toLowerCase()).join('')
    message.reply(result.length > 1900 ? result.slice(0, 1900) + '...' : result)
  },
}
