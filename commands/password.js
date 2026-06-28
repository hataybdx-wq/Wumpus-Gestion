module.exports = {
  name: 'password',
  description: 'Génère un mot de passe sécurisé',
  aliases: ['passwd', 'mdp', 'gen-password'],
  run: async (client, message, args) => {
    const length = Math.min(Math.max(parseInt(args[0]) || 16, 8), 64)
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-='
    let pw = ''
    for (let i = 0; i < length; i++) pw += chars[Math.floor(Math.random() * chars.length)]
    message.author.send({ embeds: [{
      title: 'Votre mot de passe généré',
      author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
      description: `\`${pw}\``,
      color: 0xFF0000,
      author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
          footer: { text: 'Made by Wumpus' },
      footer: { text: `Longueur : ${length} caractères` },
    }] }).then(() => {
      message.reply('Mot de passe envoyé en DM.')
    }).catch(() => {
      message.reply('Impossible de t\'envoyer en DM. Active les DM du serveur.')
    })
  },
}
