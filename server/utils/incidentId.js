const { randomBytes } = require('node:crypto');
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const newIncidentId = () => 'INC-' + Array.from(randomBytes(8), byte => alphabet[byte & 31]).join('');

// The unique database index arbitrates concurrent inserts; retry only code collisions.
async function createWithIncidentId(Model, data) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try { return await Model.create({ ...data, incidentId: newIncidentId() }); }
    catch (error) {
      if (error.code !== 11000 || !error.keyPattern?.incidentId || attempt === 4) throw error;
    }
  }
}
module.exports = { newIncidentId, createWithIncidentId };
