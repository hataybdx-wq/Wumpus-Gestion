module.exports = {
  name: 'latency',
  description: 'Latence détaillée',
  aliases: ['lag'],
  run: async (client, message) => {
    const ws = Math.round(client.ws.ping)
    const sent = Date.now()
    const m = await message.reply('Calcul...')
    const rt = m.createdTimestamp - sent
    m.edit(`🌐 WebSocket : **${ws}ms**\n📡 Roundtrip : **${rt}ms**`)
  },
}
