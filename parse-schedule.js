export const parseSchedule = (scheduleText) => {
  const text = scheduleText.toLowerCase().trim();
  const now = new Date();

  // "às 22h", "às 10:30", "às 7 da manhã", "às 10 da noite"
  let match = text.match(/às (\d{1,2})(?::(\d{2}))?(?:\s*da\s*(manhã|noite))?/);
  if (match) {
    let hour = parseInt(match[1], 10);
    const minute = match[2] ? parseInt(match[2], 10) : 0;
    const period = match[3];

    if (period === 'noite' && hour < 12) hour += 12;
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      let startDate = new Date(now);
      startDate.setHours(hour, minute, 0, 0);
      // Se já passou da hora hoje, agenda para amanhã
      if (startDate <= now) startDate.setDate(startDate.getDate() + 1);
      return { type: 'daily', startDate };
    }
  }

  // "todo dia às HH[:MM]"
  match = text.match(/todo dia às (\d{1,2})(?::(\d{2}))?/);
  if (match) {
    const hour = parseInt(match[1], 10);
    const minute = match[2] ? parseInt(match[2], 10) : 0;
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      let startDate = new Date(now);
      startDate.setHours(hour, minute, 0, 0);
      if (startDate <= now) startDate.setDate(startDate.getDate() + 1);
      return { type: 'daily', startDate };
    }
  }

  // "a cada X horas" ou "X hora(s)"
  match = text.match(/(?:a cada\s*)?(\d{1,2})\s*horas?/);
  if (match) {
    const hours = parseInt(match[1], 10);
    if (hours > 0 && hours < 24) {
      const intervalMinutes = hours * 60;
      const startDate = new Date(now);
      return { type: 'interval', intervalMinutes, startDate };
    }
  }

  // "a cada X minutos", "X minuto(s)", "a cada minuto"
  match = text.match(/(?:a cada\s*)?(?:(\d{1,2})\s*)?minuto[s]?/);
  if (match) {
    const minutes = match[1] ? parseInt(match[1], 10) : 1;
    if (minutes > 0 && minutes < 60) {
      const startDate = new Date(now);
      return { type: 'interval', intervalMinutes: minutes, startDate };
    }
  }

  // "em X minutos" ou "em X horas"
  match = text.match(/em (\d{1,2})\s*(minutos?|horas?)/);
  if (match) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    const startDate = new Date(now);
    if (unit.startsWith('hora') && value > 0 && value < 24) {
      const intervalMinutes = value * 60;
      return { type: 'interval', intervalMinutes, startDate };
    } else if (unit.startsWith('minuto') && value > 0 && value < 60) {
      return { type: 'interval', intervalMinutes: value, startDate };
    }
  }

  // "meia hora" ou "a cada meia hora"
  if (text.includes('meia hora')) {
    const startDate = new Date(now);
    return { type: 'interval', intervalMinutes: 30, startDate };
  }

  // "uma vez por dia", "1 vez por dia", "1 por dia" — precisa perguntar hora
  if (
    text.includes('uma vez por dia') ||
    text.includes('1 vez por dia') ||
    text.includes('1 por dia')
  ) {
    return { type: 'ask_hour' };
  }

  // Não reconheceu padrão
  return null;
};
