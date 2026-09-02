export function formatDMY(iso) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}
