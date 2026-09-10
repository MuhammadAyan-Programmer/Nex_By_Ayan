import { WORLD_COUNTRIES } from '../data/countries';

/**
 * Common country name to ISO 3166-1 alpha-2 code mapping
 * for accurate emoji flag representation.
 */
const COUNTRY_TO_CODE: Record<string, string> = {
  Afghanistan: 'AF',
  Albania: 'AL',
  Algeria: 'DZ',
  Andorra: 'AD',
  Angola: 'AO',
  Argentina: 'AR',
  Armenia: 'AM',
  Australia: 'AU',
  Austria: 'AT',
  Azerbaijan: 'AZ',
  Bahrain: 'BH',
  Bangladesh: 'BD',
  Belarus: 'BY',
  Belgium: 'BE',
  Belize: 'BZ',
  Bolivia: 'BO',
  'Bosnia and Herzegovina': 'BA',
  Brazil: 'BR',
  Bulgaria: 'BG',
  Cambodia: 'KH',
  Cameroon: 'CM',
  Canada: 'CA',
  Chile: 'CL',
  China: 'CN',
  Colombia: 'CO',
  'Costa Rica': 'CR',
  Croatia: 'HR',
  Cuba: 'CU',
  Cyprus: 'CY',
  'Czech Republic': 'CZ',
  Denmark: 'DK',
  Ecuador: 'EC',
  Egypt: 'EG',
  Estonia: 'EE',
  Ethiopia: 'ET',
  Finland: 'FI',
  France: 'FR',
  Georgia: 'GE',
  Germany: 'DE',
  Ghana: 'GH',
  Greece: 'GR',
  Guatemala: 'GT',
  Honduras: 'HN',
  'Hong Kong': 'HK',
  Hungary: 'HU',
  Iceland: 'IS',
  India: 'IN',
  Indonesia: 'ID',
  Iran: 'IR',
  Iraq: 'IQ',
  Ireland: 'IE',
  Israel: 'IL',
  Italy: 'IT',
  Japan: 'JP',
  Jordan: 'JO',
  Kazakhstan: 'KZ',
  Kenya: 'KE',
  Kuwait: 'KW',
  Latvia: 'LV',
  Lebanon: 'LB',
  Libya: 'LY',
  Lithuania: 'LT',
  Luxembourg: 'LU',
  Malaysia: 'MY',
  Mexico: 'MX',
  Morocco: 'MA',
  Nepal: 'NP',
  Netherlands: 'NL',
  'New Zealand': 'NZ',
  Nigeria: 'NG',
  Norway: 'NO',
  Oman: 'OM',
  Pakistan: 'PK',
  Palestine: 'PS',
  Panama: 'PA',
  Peru: 'PE',
  Philippines: 'PH',
  Poland: 'PL',
  Portugal: 'PT',
  Qatar: 'QA',
  Romania: 'RO',
  Russia: 'RU',
  'Saudi Arabia': 'SA',
  Serbia: 'RS',
  Singapore: 'SG',
  Slovakia: 'SK',
  Slovenia: 'SI',
  'South Africa': 'ZA',
  'South Korea': 'KR',
  Spain: 'ES',
  'Sri Lanka': 'LK',
  Sudan: 'SD',
  Sweden: 'SE',
  Switzerland: 'CH',
  Syria: 'SY',
  Taiwan: 'TW',
  Thailand: 'TH',
  Tunisia: 'TN',
  Turkey: 'TR',
  Ukraine: 'UA',
  'United Arab Emirates': 'AE',
  'United Kingdom': 'GB',
  'United States': 'US',
  Uruguay: 'UY',
  Uzbekistan: 'UZ',
  Venezuela: 'VE',
  Vietnam: 'VN',
  Yemen: 'YE',
};

/**
 * Converts 2-letter ISO country code to Unicode Flag Emoji
 */
function getFlagFromCode(code: string): string {
  if (!code || code.length !== 2) return '🌐';
  const upper = code.toUpperCase();
  const codePoints = [...upper].map((c) => 127397 + c.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

/**
 * Returns flag emoji for a given country string, or 🌍 for Worldwide / Global
 */
export function getCountryFlag(country?: string): string {
  if (!country) return '🌍';
  const clean = country.trim();
  const lower = clean.toLowerCase();

  if (lower === 'worldwide' || lower === 'global' || lower === 'all' || lower === 'any') {
    return '🌍';
  }

  // Exact match in map
  if (COUNTRY_TO_CODE[clean]) {
    return getFlagFromCode(COUNTRY_TO_CODE[clean]);
  }

  // Case-insensitive match in map
  const foundKey = Object.keys(COUNTRY_TO_CODE).find(
    (k) => k.toLowerCase() === lower
  );
  if (foundKey) {
    return getFlagFromCode(COUNTRY_TO_CODE[foundKey]);
  }

  // Check if string itself looks like a 2-letter code
  if (/^[a-zA-Z]{2}$/.test(clean)) {
    return getFlagFromCode(clean);
  }

  return '🌐';
}

export interface CountryEligibilityInfo {
  label: string;
  flag: string;
  isWorldwide: boolean;
  fullDisplay: string;
  badgeLabel: string;
  description: string;
}

/**
 * Resolves standard Country Eligibility information for a project.
 * IMPORTANT: The selected country is purely an informational label.
 * Every job remains 100% visible and open to all registered users worldwide.
 */
export function getCountryEligibility(country?: string): CountryEligibilityInfo {
  if (!country) {
    return {
      label: 'Worldwide',
      flag: '🌍',
      isWorldwide: true,
      fullDisplay: '🌍 Worldwide',
      badgeLabel: '🌍 Worldwide',
      description: 'Open worldwide to all registered contributors across all countries.',
    };
  }

  const clean = country.trim();
  const lower = clean.toLowerCase();

  if (
    lower === 'worldwide' ||
    lower === 'global' ||
    lower === 'all' ||
    lower === 'any' ||
    lower === 'open'
  ) {
    return {
      label: 'Worldwide',
      flag: '🌍',
      isWorldwide: true,
      fullDisplay: '🌍 Worldwide',
      badgeLabel: '🌍 Worldwide',
      description: 'Open worldwide to all registered contributors across all countries.',
    };
  }

  const flag = getCountryFlag(clean);
  return {
    label: clean,
    flag,
    isWorldwide: false,
    fullDisplay: `${flag} ${clean}`,
    badgeLabel: `${flag} ${clean}`,
    description: `Target country: ${clean}. (Informational label only — open to all registered users worldwide).`,
  };
}

/**
 * Standard list of country choices for project creation and editing.
 * 'Worldwide' is always the first, recommended default option.
 */
export const JOB_COUNTRY_OPTIONS: string[] = ['Worldwide', ...WORLD_COUNTRIES];
