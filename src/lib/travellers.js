// Seed traveller party. This is the source of truth for trip headcount,
// activity voters, and (later) transport traveller assignment and
// cost-per-person — not derived from itinerary-backup.json, which has no
// concept of individual travellers.
//
// SCC / DC / SR match the existing activity-vote labels (Sarah, Dom, Steph)
// already established in ActivityVotes.js.
export const INITIAL_TRAVELLERS = [
  { id: "scc", initials: "SCC", name: "Sarah", voter: true, included: true },
  { id: "dc", initials: "DC", name: "Dom", voter: true, included: true },
  { id: "sr", initials: "SR", name: "Steph", voter: true, included: true },
  { id: "ncc", initials: "NCC", name: "Noah", voter: false, included: true },
  { id: "tcc", initials: "TCC", name: "Tilly", voter: false, included: true },
  { id: "cbr", initials: "CBR", name: "Cooper", voter: false, included: true },
];
