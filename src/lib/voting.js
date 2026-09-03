// Vote data migration + unanimity helpers for activity voting.
//
// The original JSON stores votes keyed by the fixed historical voter names
// (Sarah/Dom/Steph) with a three-state true/false/null value. Voting is now
// binary (selected/not selected) and keyed by the STABLE traveller id from
// src/lib/travellers.js, so editing a traveller's name/initials never
// affects existing votes, and the voter list can grow/shrink freely.
const LEGACY_NAME_TO_TRAVELLER_ID = { Sarah: "scc", Dom: "dc", Steph: "sr" };

// true -> selected; false/null/missing -> not selected.
export function migrateVotes(oldVotes) {
  const next = {};
  for (const [name, value] of Object.entries(oldVotes || {})) {
    const id = LEGACY_NAME_TO_TRAVELLER_ID[name];
    if (id && value === true) next[id] = true;
  }
  return next;
}

// An activity is unanimous when every currently included+voter traveller has
// selected it. With no voters at all, nothing can be unanimous.
export function isUnanimous(votes, voters) {
  return voters.length > 0 && voters.every((v) => Boolean(votes[v.id]));
}
