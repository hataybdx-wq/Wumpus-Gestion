module.exports = {
  name: 'reverse',
  description: 'Inverser un texte',
  aliases: ['inverser', 'envers'],
  run: async (client, message, args) => {
    const text = args.join(' ')
    if (!text) return message.reply(`Usage : \`!reverse <texte>\``)
    if (text.length > 2000) return message.reply('Texte trop long.')
    message.reply(text.split('').reverse().join(''))
  },
}
