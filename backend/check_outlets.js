require('dotenv').config();
const supabase = require('./src/config/supabase');

async function check() {
  const { data, error } = await supabase.from('outlets').select('*');
  if (error) {
    console.error(error);
  } else {
    console.log('Outlets:', data);
  }
}

check();
