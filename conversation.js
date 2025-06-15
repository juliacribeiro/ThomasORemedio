import { readDb, saveDb } from './db.js';
import { scheduleReminder } from './scheduler.js';
import { v4 as uuidv4 } from 'uuid';
import { bot } from './config.js';
import { startDurationFlow, handleDurationCallback, handleDurationNumber } from './duration.js';
import { parseSchedule } from './parse-schedule.js';
import { botStrings } from './strings.js';

const strings = botStrings.conversationFile;

export const userState = {};

const getUserMeds = (chatId, db) => db[String(chatId)] || [];
const setUserMeds = (chatId, db, meds) => {
  db[String(chatId)] = meds;
  saveDb(db);
};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, strings.welcome);
});

bot.onText(/\/novoremedio/, (msg) => {
  const chatId = msg.chat.id;
  userState[chatId] = { step: 'ask_name' };
  bot.sendMessage(chatId, strings.askName);
});

bot.onText(/\/meusremedios/, (msg) => {
  const chatId = msg.chat.id;
  const db = readDb();
  const userMeds = getUserMeds(chatId, db);

  if (!userMeds.length) {
    bot.sendMessage(chatId, strings.emptyList);
    return;
  }

  const text = userMeds.map((med, index) => {
    const withPhoto = med.photoId ? 'Sim' : 'Não';
    const type = med.cronExpression
      ? 'Horário fixo'
      : med.scheduleText?.includes('dia') || med.scheduleText?.includes('diariamente')
      ? 'Diário'
      : 'Intervalo';

    const count = med.executionCount || 0;
    const limit = med.limitType === 'quantity'
      ? `Limite: ${med.limitValue} vez(es)`
      : 'Sem limite';

    return `*${index + 1}. ${med.name}*\nFoto: ${withPhoto}\nTipo: ${type}\nEnviado: ${count}x\n${limit}`;
  }).join('\n\n');

  bot.sendMessage(chatId, `Seus remédios cadastrados:\n\n${text}`, { parse_mode: 'Markdown' });
});

bot.onText(/\/removerremedio/, (msg) => {
  const chatId = msg.chat.id;
  const db = readDb();
  const userMeds = getUserMeds(chatId, db);

  if (!userMeds.length) {
    bot.sendMessage(chatId, strings.emptyList);
    return;
  }

  const inline_keyboard = userMeds.map((med) => [
    {
      text: med.name,
      callback_data: `delete_med_${med.id}`,
    },
  ]);

  bot.sendMessage(chatId, 'Selecione o remédio que deseja remover:', {
    reply_markup: { inline_keyboard },
  });
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;

  if (!msg.text) return;

  const text = msg.text.trim();
  const state = userState[chatId];

  if (await handleDurationNumber(chatId, text)) {
    delete userState[chatId];
    return;
  }

  if (!state || text.startsWith('/')) return;

  switch (state.step) {
    case 'ask_name':
      state.name = text;
      state.step = 'confirm_photo';
      bot.sendMessage(chatId, strings.askIfPhoto, {
        reply_markup: {
          inline_keyboard: [
            [
              { text: strings.yes, callback_data: 'send_photo' },
              { text: strings.no, callback_data: 'skip_photo' }
            ]
          ]
        }
      });
      break;

    case 'ask_schedule': {
      const scheduleInfo = parseSchedule(text);

      if (!scheduleInfo) {
        bot.sendMessage(chatId, strings.invalidFormat);
        return;
      }

      const medicine = {
        id: uuidv4(),
        name: state.name,
        photoId: state.photoId,
        scheduleText: msg.text,
      };

      const success = await scheduleReminder(chatId, medicine);

      if (success === false) return;
      if (success === 'awaiting_hour') {
        state.pendingMedicine = medicine;
        state.step = 'awaiting_daily_time';
        return;
      }

      state.medicine = medicine;
      startDurationFlow(chatId, medicine);
      state.step = 'waiting_duration_choice';
      break;
    }

    case 'awaiting_daily_time': {
      if (!/^\d{1,2}:\d{2}$/.test(text)) {
        bot.sendMessage(chatId, strings.invalidDailyTime);
        return;
      }

      const [hourStr, minuteStr] = text.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);

      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        bot.sendMessage(chatId, strings.invalidDailyTime);
        return;
      }

      const medicine = state.pendingMedicine;

      if (!medicine) {
        bot.sendMessage(chatId, strings.error);
        delete userState[chatId];
        return;
      }

      medicine.cronExpression = `${minute} ${hour} * * *`;

      const result = await scheduleReminder(chatId, medicine);

      if (!result) {
        bot.sendMessage(chatId, strings.error);
        return;
      }

      state.medicine = medicine;
      delete state.pendingMedicine;
      startDurationFlow(chatId, medicine);
      state.step = 'waiting_duration_choice';
      break;
    }
  }
});

bot.on('callback_query', async (query) => {
  const chatId = query.message.chat.id;
  const state = userState[chatId];
  const data = query.data;

  if (await handleDurationCallback(chatId, data)) {
    await bot.editMessageReplyMarkup(
      { inline_keyboard: [] },
      {
        chat_id: chatId,
        message_id: query.message.message_id
      }
    );
    delete userState[chatId];
    return;
  }

  if (!state && !data.startsWith('delete_med_')) {
    await bot.answerCallbackQuery(query.id, { text: strings.invalidSession });
    return;
  }

  switch (data) {
    case 'send_photo':
      state.step = 'ask_photo';
      await bot.sendMessage(chatId, strings.askPhoto(state.name));
      break;

    case 'skip_photo':
      state.photoId = null;
      state.step = 'ask_schedule';
      await bot.sendMessage(chatId, strings.noPhoto);
      break;
  }

  if (data.startsWith('delete_med_')) {
    const medicineId = data.replace('delete_med_', '');
    const db = readDb();
    const meds = getUserMeds(chatId, db);

    const medIndex = meds.findIndex(m => m.id === medicineId);
    if (medIndex === -1) {
      bot.answerCallbackQuery(query.id, { text: 'Remédio não encontrado.' });
      return;
    }

    const med = meds[medIndex];
    if (global.jobs?.has(med.id)) {
      global.jobs.get(med.id).cancel();
      global.jobs.delete(med.id);
    }

    meds.splice(medIndex, 1);
    setUserMeds(chatId, db, meds);

    bot.editMessageText(`Remédio *${med.name}* removido com sucesso. ✅`, {
      chat_id: chatId,
      message_id: query.message.message_id,
      parse_mode: 'Markdown',
    });

    await bot.answerCallbackQuery(query.id);
    return;
  }

  await bot.editMessageReplyMarkup(
    { inline_keyboard: [] },
    {
      chat_id: chatId,
      message_id: query.message.message_id
    }
  );

  await bot.answerCallbackQuery(query.id);
});

bot.on('photo', (msg) => {
  const chatId = msg.chat.id;
  const state = userState[chatId];
  if (state?.step === 'ask_photo') {
    state.photoId = msg.photo[msg.photo.length - 1].file_id;
    state.step = 'ask_schedule';
    bot.sendMessage(chatId, strings.receivedPhoto);
  }
});
