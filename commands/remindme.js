// ============================================================
//  Commande : remindme
//  Envoie un rappel en DM après une durée donnée.
// ============================================================

const ms = require('ms')
const db = require('quick.db')

module.exports = {
  name: 'remindme',
  description: 'Créer un rappel personnel',
  aliases: ['remind', 'rappel'],

  run: async (client, message, args, prefix) => {
    const duration = args[0]
    const reminderText = args.slice(1).join(' ')

    if (!duration || !reminderText) {
      return message.reply(
        `Usage : \`${prefix}remindme <durée> <message>\`\n` +
        `**Exemples :**\n` +
        `> \`${prefix}remindme 30m Pause café\`\n` +
        `> \`${prefix}remindme 2h Rdv avec Jean\`\n` +
        `> \`${prefix}remindme 1d Rappeler le projet\``
      )
    }

    const msValue = ms(duration)
    if (!msValue || msValue < 10000) {
      return message.reply(`Durée invalide. Exemples : \`10s\`, \`5m\`, \`2h\`, \`1d\`, \`1w\` (minimum 10s)`)
    }
    if (msValue > 2592000000) {
      return message.reply('Durée maximum : **30 jours**.')
    }

    const reminder = {
      userId:    message.author.id,
      channelId: message.channel.id,
      text:      reminderText,
      at:        Date.now() + msValue,
      created:   Date.now(),
    }

    const all = db.get('reminders') || []
    all.push(reminder)
    db.set('reminders', all)

    const triggerTime = Math.floor(reminder.at / 1000)
    return message.reply(
      `Rappel enregistré pour <t:${triggerTime}:R> (<t:${triggerTime}:F>).\n` +
      `**Message :** ${reminderText}`
    )
  },
}
