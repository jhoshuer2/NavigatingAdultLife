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
  mix: { male: [], female: [] },
}
NAME_POOLS.mix.male = [...NAME_POOLS.yoruba.male.slice(0, 6), ...NAME_POOLS.igbo.male.slice(0, 6), ...NAME_POOLS.hausa.male.slice(0, 6)]
NAME_POOLS.mix.female = [...NAME_POOLS.yoruba.female.slice(0, 6), ...NAME_POOLS.igbo.female.slice(0, 6), ...NAME_POOLS.hausa.female.slice(0, 6)]

export const HERITAGE_LABEL: Record<Heritage, string> = { yoruba: 'Yoruba', igbo: 'Igbo', hausa: 'Hausa', mix: 'Naija Mix' }
