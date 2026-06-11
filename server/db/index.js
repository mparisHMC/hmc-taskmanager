// Central DB adapter — uses Supabase in production, SQLite locally
module.exports = process.env.USE_SUPABASE === 'true'
  ? require('./supabase')
  : require('./database');
