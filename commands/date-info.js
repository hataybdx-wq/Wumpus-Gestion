module.exports = {
  name: 'dateinfo',
  description: 'Informations sur une date ou timestamp',
  aliases: ['date-info'],
  run: async (client, message, args) => {
    const input = args.join(' ') || new Date().toISOString()
    let date
    // Accept timestamp (secondes ou ms)
    if (/^\d+$/.test(input)) {
      const n = parseInt(input)
      date = new Date(n > 9999999999 ? n : n * 1000)
    } else {
      date = new Date(input)
    }
    if (isNaN(date.getTime())) return message.reply('Date invalide.')

    const ts = Math.floor(date.getTime() / 1000)
    const days = ['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi']

    message.reply({ embeds: [{
      title: 'Informations sur la date',
      author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
      color: 0xFF0000,
      author: { name: 'Wumpus Project', url: 'https://github.com/hataybdx-wq/Wumpus-Gestion' },
          footer: { text: 'Made by Wumpus' },
      fields: [
        { name: 'Date',          value: date.toLocaleString('fr-FR'),                      inline: false },
        { name: 'Jour',          value: days[date.getDay()],                                 inline: true },
        { name: 'Timestamp UNIX',value: `\`${ts}\``,                                         inline: true },
        { name: 'ISO',           value: date.toISOString(),                                  inline: false },
        { name: 'Discord',       value: `<t:${ts}:F> (<t:${ts}:R>)`,                         inline: false },
      ],
    }] })
  },
}
