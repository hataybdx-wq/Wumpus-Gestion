// ============================================================
//  Commande : antibot — Activer/désactiver l'anti-bot
// ============================================================
const { PermissionFlagsBits } = require('discord.js')
const db = require('quick.db')

function makeAntiToggle(name, dbKey, label) {
  return {
    name,
    aliases: [],
    run: async (client, message, args, prefix) => {
      if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) return
      if (!args[0]) return message.reply('❌ Veuillez indiquer `on` ou `off` !')

      const key = `${dbKey}_${message.guild.id}`

      if (args[0] === 'on') {
        if (db.get(key) === true) return message.channel.send(`❌ L'${label} est déjà activé.`)
        db.set(key, true)
        message.channel.send(`✅ L'${label} est maintenant **activé**.`)
      } else if (args[0] === 'off') {
        if (!db.get(key)) return message.channel.send(`❌ L'${label} est déjà désactivé.`)
        db.set(key, null)
        message.channel.send(`✅ L'${label} est maintenant **désactivé**.`)
      } else {
        message.reply('❌ Veuillez indiquer `on` ou `off` !')
      }
    },
  }
}

module.exports = makeAntiToggle('antibot', 'bots', 'anti-bot')
