export default function maskAccountIdentification(
  id: string,
  _type: string,
): string {
  const trimmed = id.replace(/\s/g, '');

  if (trimmed.length > 4) {
    const end = trimmed.substring(trimmed.length - 4);
    return `*** ${end}`;
  }

  return id;
}
