export const dateFormat = (date: string) => {
  const today = new Date().toISOString();
  const yesterday = new Date(
    new Date().setDate(new Date().getDate() - 1),
  ).toISOString();

  if (date === today) return 'Hoy';
  if (date === yesterday) return 'Ayer';

  return new Date(date).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};
