/** Дата и время в формате сервера: `YYYY-MM-DDTHH:MM:SSZ`, без миллисекунд. */
export const toServerDateTime = (date: Date) => `${date.toISOString().slice(0, 19)}Z`;
