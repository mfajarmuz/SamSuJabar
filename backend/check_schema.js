require('dotenv').config();
const supabase = require('./src/config/supabase');

async function check() {
  const { data, error } = await supabase.from('transaksi_sam').select('*').limit(1);
  if (error) {
    console.error('Error fetching schema:', error.message);
  } else {
    console.log('Columns in transaksi_sam:', Object.keys(data[0] || {}));
  }
}
check();
