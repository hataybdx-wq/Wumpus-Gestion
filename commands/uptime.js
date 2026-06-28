module.exports = {
  name: 'uptime',
  description: 'Temps d\'activité du bot',
  aliases: [],
  run: async (client, message) => {
    const s = Math.floor(process.uptime())
    const d = Math.floor(s / 86400)
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    message.reply(`🕐 Uptime : **${d}j ${h}h ${m}m ${sec}s**`)
  },
}
