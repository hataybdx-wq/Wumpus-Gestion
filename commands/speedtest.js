// ============================================================
//  Commande : speedtest
//  Ping vers plusieurs endpoints pour mesurer la latence.
// ============================================================

const { EmbedBuilder } = require('discord.js')

const TARGETS = [
  { name: 'Discord',    url: 'https://discord.com/api/v10/gateway' },
  { name: 'Google',     url: 'https://www.google.com' },
  { name: 'Cloudflare', url: 'https://1.1.1.1' },
  { name: 'GitHub',     url: 'https://api.github.com' },
]

module.exports = {
  name: 'speedtest',
  description: 'Test de latence vers plusieurs serveurs',
  aliases: ['netspeed'],

  run: async (client, message) => {
    const waiting = await message.reply('⏱️ Test en cours...')
    const fetch = require('node-fetch')

    const results = await Promise.all(TARGETS.map(async t => {
      const start = Date.now()
      try {
        await fetch(t.url, { timeout: 5000, method: 'HEAD' })
        return { name: t.name, ms: Date.now() - start }
      } catch {
        return { name: t.name, ms: -1 }
      }
    }))

    const lines = results.map(r =>
      `**${r.name}** : ${r.ms === -1 ? '❌ Échec' : r.ms < 150 ? `🟢 ${r.ms}ms` : r.ms < 500 ? `🟡 ${r.ms}ms` : `🔴 ${r.ms}ms`}`
    ).join('\n')

    waiting.edit({ content: null, embeds: [new EmbedBuilder()
      .setAuthor({ name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' })
      .setTitle('⏱️ Test de latence')
      .setColor(0xFF0000)
      .setDescription(lines)
      .setFooter({ text: 'Ping depuis le serveur du bot | Made by Wumpus' })
    ] })
  },
}
