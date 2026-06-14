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
 * Check if a word appears in the address as a standalone token,
 * not as a substring of a longer word.
 * Uses word boundary approach: checks chars before/after the match.
 */
function containsWord(text, word) {
  let startIdx = 0;
  while (true) {
    const pos = text.indexOf(word, startIdx);
    if (pos === -1) return false;
    const before = pos > 0 ? text[pos - 1] : ' ';
    const after = pos + word.length < text.length ? text[pos + word.length] : ' ';
    // Consider it a word match if surrounded by non-alpha chars or string boundaries
    const isWordBefore = /[A-Z]/.test(before);
    const isWordAfter = /[A-Z]/.test(after);
    if (!isWordBefore && !isWordAfter) return true;
    startIdx = pos + 1;
  }
}

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
    if (containsWord(upper, excl)) {
      // Ensure TAWANG exclusion doesn't trigger on CINTAWANGI village in Karangnunggal
      if (excl === 'TAWANG' && upper.includes('CINTAWANGI')) {
        continue;
      }
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
  }

  return false;
}

module.exports = {
  KECAMATAN_TASIKMALAYA,
  isKabupatenTasikmalaya
};
