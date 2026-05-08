// src/config/kecamatan.js
'use strict';

const KECAMATAN_TASIKMALAYA = [
  'BANTARKALONG',
  'BOJONGASIH',
  'BOJONGGAMBIR',
  'CIAWI',
  'CIBALONG',
  'CIGALONTANG',
  'CIKALONG',
  'CIKATOMAS',
  'CINEAM',
  'CIPATUJAH',
  'CISAYONG',
  'CULAMEGA',
  'GUNUNGTANJUNG',
  'JAMANIS',
  'JATIWARAS',
  'KADIPATEN',
  'KARANGJAYA',
  'KARANGNUNGGAL',
  'LEUWISARI',
  'MANGUNREJA',
  'MANONJAYA',
  'PADAKEMBANG',
  'PAGERAGEUNG',
  'PANCATENGAH',
  'PARUNGPONTENG',
  'PUSPAHIANG',
  'RAJAPOLAH',
  'SALAWU',
  'SALOPA',
  'SARIWANGI',
  'SINGAPARNA',
  'SODONGHILIR',
  'SUKAHENING',
  'SUKARAJA',
  'SUKARAME',
  'SUKARESIK',
  'TANJUNGJAYA',
  'TARAJU'
];

/**
 * Check if a full address text contains any of the Kabupaten Tasikmalaya sub-districts.
 * Specifically excludes City of Tasikmalaya sub-districts (like Indihiang, Cihideung, etc.) 
 * to maintain strict administrative SAMSAT Suku/Sukaraja potential rules.
 * 
 * @param {string} addressText Raw uppercase address text
 * @returns {boolean}
 */
function isKabupatenTasikmalaya(addressText) {
  if (!addressText) return false;
  const upper = addressText.toUpperCase();
  
  // Specific exclusions for City of Tasikmalaya sub-districts (Kecamatan Kota Tasikmalaya)
  const CITY_EXCLUSIONS = ['INDIHIANG', 'CIHIDEUNG', 'CIPEDES', 'TAWANG', 'PURBARATU', 'MANGKUBUMI', 'TAMANSARI', 'KAWALU', 'CIBEUREUM', 'BUNGURSARI'];
  for (const excl of CITY_EXCLUSIONS) {
    if (upper.includes(excl)) {
      return false; // Belongs to Kota, not Kabupaten
    }
  }

  // Check if it matches any Kabupaten Tasikmalaya sub-district
  for (const kec of KECAMATAN_TASIKMALAYA) {
    if (upper.includes(kec)) {
      return true;
    }
    // Handle short / common variations
    if (kec === 'PARUNGPONTENG' && upper.includes('PARPONT')) return true;
    if (kec === 'SUKARAJA' && upper.includes('SUKARAJ')) return true;
  }

  return false;
}

module.exports = {
  KECAMATAN_TASIKMALAYA,
  isKabupatenTasikmalaya
};
