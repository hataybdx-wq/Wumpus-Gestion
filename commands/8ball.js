const ANSWERS = [
  'Oui, absolument.', 'Sans aucun doute.', 'Très probablement.',
  'Les signes disent oui.', 'Peut-être.', 'Demande plus tard.',
  'Je ne peux pas te le dire.', 'Très douteux.',
  'Non.', 'Absolument pas.', 'Les signes disent non.',
]
module.exports = {
  name: '8ball',
  description: 'Boule magique',
  aliases: ['8'],
  run: async (client, message, args) => {
    const q = args.join(' ')
    if (!q) return message.reply(`Usage : \`!8ball <question>\``)
    const a = ANSWERS[Math.floor(Math.random() * ANSWERS.length)]
    message.reply(`🎱 **${q}**\n→ ${a}`)
  },
}
