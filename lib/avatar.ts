/**
 * Avatar mapping helper for AI Consultant avatars
 */

// Maps consulting area names to kebab-case folder names
const AREA_FOLDER_MAP: Record<string, string> = {
  'Business Strategy': 'business-strategy',
  'Marketing & Growth': 'marketing-growth',
  'Operations & Efficiency': 'operation-efficiency',
  'Product Development': 'product-development',
  'Team Management': 'team-management',
  'Financial Planning': 'financial-planning',
  'Digital Transformation': 'digital-transformation',
  'Customer Experience': 'customer-experience',
  'Organizational Change': 'organizational-change',
  'Risk Management': 'risk-management',
};

// Maps language value to image filename
const LANGUAGE_FILE_MAP: Record<string, string> = {
  'English': 'english.png',
  'Indonesian': 'indo.png',
};

const AVATARS_BASE_PATH = '/avatars/consultant';

/**
 * Gets the avatar path for a consultant based on consulting area and language
 * @param consultingArea - The consulting area name
 * @param language - The language ('English' or 'Indonesian')
 * @returns The path to the avatar image
 */
export function getConsultantAvatar(consultingArea: string, language: string): string {
  const folder = AREA_FOLDER_MAP[consultingArea] || 'business-strategy';
  const filename = LANGUAGE_FILE_MAP[language] || 'english.png';
  return `${AVATARS_BASE_PATH}/${folder}/${filename}`;
}
