import type { Gender, Heritage } from '@engine/core/types'

type Pool = Record<Gender, string[]>
export const NAME_POOLS: Record<Heritage, Pool> = {
  yoruba: {
    male: ['Tunde', 'Femi', 'Seyi', 'Kunle', 'Dayo', 'Bayo', 'Tobi', 'Sola', 'Segun', 'Wale', 'Gbenga', 'Kayode', 'Yinka', 'Bolu', 'Lekan', 'Tayo'],
    female: ['Folake', 'Bisi', 'Funmi', 'Yetunde', 'Tola', 'Shade', 'Ronke', 'Lola', 'Titi', 'Kemi', 'Dami', 'Temi', 'Bukola', 'Sade', 'Wunmi', 'Ayo'],
  },
  igbo: {
    male: ['Chinedu', 'Emeka', 'Obinna', 'Ifeanyi', 'Nnamdi', 'Uche', 'Chidi', 'Kelechi', 'Ikenna', 'Obiora', 'Tochukwu', 'Somto', 'Arinze', 'Nonso', 'Chuka', 'Ebuka'],
    female: ['Ngozi', 'Chioma', 'Adaeze', 'Amara', 'Nkechi', 'Ifeoma', 'Uchenna', 'Chiamaka', 'Ada', 'Nneka', 'Obiageli', 'Onyinye', 'Ugochi', 'Chinwe', 'Ebele', 'Kamsi'],
  },
  hausa: {
    male: ['Musa', 'Abdullahi', 'Ibrahim', 'Aliyu', 'Sani', 'Yusuf', 'Bello', 'Garba', 'Umar', 'Aminu', 'Ismail', 'Abubakar', 'Sadiq', 'Nasir', 'Shehu', 'Haruna'],
    female: ['Aisha', 'Fatima', 'Hauwa', 'Zainab', 'Maryam', 'Hadiza', 'Rabi', 'Binta', 'Amina', 'Safiya', 'Hafsat', 'Khadija', 'Asma', 'Halima', 'Jamila', 'Nafisa'],
  },
  // "Other": the rest of Nigeria. Akwa Ibom and Efik/Cross River, Delta (Urhobo, Isoko, Ijaw), Edo, Rivers, and Benue/Tiv.
  // Only names that are clearly male or clearly female are listed, so the picker matches the gender the player chose.
  mix: {
    male: ['Ubong', 'Aniekan', 'Etim', 'Okon', 'Effiong', 'Utibe', 'Bassey', 'Edem', 'Ovie', 'Oghenekaro', 'Osaze', 'Osagie', 'Efosa', 'Eghosa', 'Kenule', 'Barinem', 'Ibifuro', 'Terkimbi', 'Aondofa', 'Tarkaa'],
    female: ['Ekaette', 'Imaobong', 'Nkoyo', 'Ima', 'Eno', 'Ibinabo', 'Ebiere', 'Boma', 'Ibiba', 'Ufuoma', 'Itohan', 'Ivie', 'Eghe', 'Osarugue', 'Doosuur', 'Dooshima', 'Ngunan', 'Mnena'],
  },
}

export const HERITAGE_LABEL: Record<Heritage, string> = { yoruba: 'Yoruba', igbo: 'Igbo', hausa: 'Hausa', mix: 'Other' }
export const HERITAGE_HINT: Record<Heritage, string> = { yoruba: '', igbo: '', hausa: '', mix: 'Akwa Ibom, Cross River, Delta, Edo, Rivers, Benue and more' }
