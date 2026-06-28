// ============================================================
//  Commande : fiat
//  Conversion de devises via exchangerate.host (gratuit sans clé).
// ============================================================

const { EmbedBuilder } = require('discord.js')

module.exports = {
  name: 'fiat',
  description: 'Conversion de devises (USD, EUR, GBP, JPY...)',
  aliases: ['currency', 'forex'],

  run: async (client, message, args, prefix) => {
    if (args.length < 3) {
      return message.reply(
        `**Usage :** \`${prefix}fiat <montant> <de> <vers>\`\n` +
        `**Exemples :**\n` +
        `> \`${prefix}fiat 100 USD EUR\`\n` +
        `> \`${prefix}fiat 50 EUR GBP\`\n` +
        `> \`${prefix}fiat 1000 JPY USD\`\n\n` +
        `**Devises :** USD, EUR, GBP, JPY, CNY, CHF, CAD, AUD, CHF, INR, KRW, BRL, etc.`
      )
    }

    const amount = parseFloat(args[0])
    const from = args[1].toUpperCase()
    const to = args[2].toUpperCase()
    if (isNaN(amount) || amount <= 0) return message.reply('Montant invalide.')

    const waiting = await message.reply('💱 Conversion...')

    try {
      const fetch = require('node-fetch')
      // open.er-api.com : gratuit, pas de clé requise
      const res = await fetch(`https://open.er-api.com/v6/latest/${from}`, { timeout: 10000 })
      const data = await res.json()
      if (data.result !== 'success') return waiting.edit(`Devise source \`${from}\` invalide.`)

      const rate = data.rates[to]
      if (!rate) return waiting.edit(`Devise cible \`${to}\` invalide.`)

      const result = amount * rate

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
        .setTitle('💱 Conversion de devises')
        .setColor(0xFF0000)
        .addFields(
        .setFooter({ text: 'Made by Wumpus' })
          { name: 'Source',    value: `${amount.toLocaleString('fr-FR')} ${from}`,             inline: true },
          { name: 'Cible',     value: `**${result.toLocaleString('fr-FR', { maximumFractionDigits: 2 })} ${to}**`, inline: true },
          { name: 'Taux',      value: `1 ${from} = ${rate.toFixed(4)} ${to}`,                  inline: false },
        )
        .setFooter({ text: `Mis à jour : ${data.time_last_update_utc ||  | Made by Wumpus'inconnu'} | Made by Wumpus` })

      waiting.edit({ content: null, embeds: [embed] })
    } catch (err) {
      waiting.edit(`Erreur : ${err.message}`)
    }
  },
}
