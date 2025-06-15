export const botStrings = {
    conversationFile: {
        welcome: 'Olá, conte comigo para lembrar de tomar seus medicamentos! Use /novoremedio para adicionar um lembrete.',
        askName: 'Qual o nome do remédio?',
        askIfPhoto: 'Você gostaria de tirar uma foto do remédio para ela ser enviada junto com o lembrete?',
        noPhoto: 'Sem problemas! Agora, me diga a frequência. Por exemplo: "a cada 8 horas", "uma vez por dia".',
        askPhoto: (medicine) => `Ok! Me envie uma foto do remédio ${medicine}.`,
        receivedPhoto: 'Ótima foto! Agora, me diga a frequência. Por exemplo: "a cada 8 horas", "uma vez por dia".',
        invalidFormat: 'Não consegui entender a frequência. Tente algo como: "a cada 8 horas", "a cada 30 minutos", "uma vez por dia"',
        yes: 'Sim',
        no: 'Não',
        error: 'Houve um erro ao agendar o lembrete. Tente novamente.',
        invalidSession: 'Sessão expirada. Por favor, recomece com /novoremedio.',
        emptyList: 'Você ainda não tem nenhum remédio cadastrado. Use /novoremedio para adicionar um.',
        invalidDailyTime: 'O horário diário deve estar no formato HH:mm e entre 00:00 e 23:59. Por exemplo, 08:30.',
    },
    schedulerFile: {
        invalidSchedule: (schedule) => `Desculpe, não entendo o intervalo ${schedule}.`,
        lastReminder: (medicine) => `Esse foi o último lembrete do remédio "${medicine}"!`,
        reminder: (medicine) => `Lembrete! é hora de tomar o remédio "${medicine}".`,
        error: 'Houve um erro ao agendar o lembrete. Tente novamente.',
        askDailyTime: 'A que horas você gostaria de receber o lembrete diário? Utilize o formato HH:mm.',
    },
    durationFile: {
        askIfQuantity: 'Gostaria de definir a quantidade de lembretes pra esse remédio?',
        stopReminderInstruction: 'Caso queira parar de receber lembretes, basta excluir o remédio com /removerremedio.',
        askQuantity: 'Quantas vezes você vai tomar o remédio? Envie um número inteiro.',
        askInteger: 'Por favor, envie um número inteiro positivo.',
        confirmation: (limit, medicine) => `Tudo certo! Vou te lembrar ${limit} do remédio ${medicine}`,
        yes: 'Sim',
        no: 'Não',

    },
};
