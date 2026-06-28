module.exports = {
  name: 'qrcode',
  description: 'Génère un QR code pour un texte/URL',
  aliases: ['qr'],
  run: async (client, message, args) => {
    const text = args.join(' ')
    if (!text) return message.reply(`Usage : \`!qrcode <texte ou URL>\``)
    const encoded = encodeURIComponent(text)
    const url = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encoded}`
    message.reply({ embeds: [{
      title: 'QR Code généré',
      author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
      description: `\`${text.slice(0, 200)}\``,
      image: { url },
      color: 0xFF0000,
      author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
          footer: { text: 'Made by Wumpus' },
    }] })
  },
}
