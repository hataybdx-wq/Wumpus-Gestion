// ============================================================
//  Événement : roleDelete — Log suppression de rôle
// ============================================================

const { sendLog } = require('../../utils/logs')

module.exports = async (client, role) => {
  if (!role.guild) return
  sendLog(
    role.guild, 'roles',
    'Rôle supprimé',
    `**Rôle :** \`${role.name}\`\n**ID :** \`${role.id}\``,
    0xFF4444
  )
}
