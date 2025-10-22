export function calcAge(birthIso) {
  if (!birthIso) return null;
  const b = new Date(birthIso);
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  const m = t.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && t.getDate() < b.getDate())) age--;
  return age;
}

export function checkEligibility({ profile, rules }) {
  if (!rules) return { ok: true };
  
  if (rules.gender && rules.gender !== 'any') {
    if (!profile?.gender) return { ok: false, reason: 'gender_required' };
    if (rules.gender === 'femaleOnly' && profile.gender !== 'female') return { ok: false, reason: 'female_only' };
    if (rules.gender === 'maleOnly' && profile.gender !== 'male') return { ok: false, reason: 'male_only' };
  }
  
  const age = calcAge(profile?.birthdate);
  if (rules.minAge != null) {
    if (age == null || age < rules.minAge) return { ok: false, reason: 'age_min' };
  }
  if (rules.maxAge != null) {
    if (age == null || age > rules.maxAge) return { ok: false, reason: 'age_max' };
  }
  
  return { ok: true };
}
