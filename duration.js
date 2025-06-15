import { bot } from './config.js';
import { scheduleReminder } from './scheduler.js';
import { readDb, saveDb } from './db.js';
import { botStrings } from './strings.js';

const strings = botStrings.durationFile;

const userDurationState = {};

export function startDurationFlow(chatId, medicine) {
  userDurationState[chatId] = { medicine, step: 'ask_limit_type' };

  bot.sendMessage(chatId, strings.askIfQuantity, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: strings.yes, callback_data: 'limit_quantity' },
          { text: strings.no, callback_data: 'limit_indefinite' },
        ],
      ],
    },
  });
}

export async function handleDurationCallback(chatId, data) {
  const state = userDurationState[chatId];
  if (!state) return false;

  if (state.step === 'ask_limit_type') {
    if (data === 'limit_indefinite') {
      bot.sendMessage(chatId, strings.stopReminderInstruction);
      await saveMedicineAndSchedule(chatId, state.medicine, 'indefinite', null);
      delete userDurationState[chatId];
      return true;
    }
    if (data === 'limit_quantity') {
      state.step = 'ask_quantity';
      bot.sendMessage(chatId, strings.askQuantity);
      return true;
    }
  }
  return false;
}

export async function handleDurationNumber(chatId, text) {
  const state = userDurationState[chatId];
  if (!state) return false;

const num = Number(text.trim().replace(',', '.'));
if (!Number.isInteger(num) || num <= 0) {
  bot.sendMessage(chatId, strings.askInteger);
  return true;
}

  if (state.step === 'ask_quantity') {
    await saveMedicineAndSchedule(chatId, state.medicine, 'quantity', num);
    delete userDurationState[chatId];
    return true;
  }

  return false;
}

async function saveMedicineAndSchedule(chatId, medicine, limitType, limitValue) {
  medicine.limitType = limitType;
  medicine.limitValue = limitValue;

  if (limitType === 'quantity') {
    medicine.limitExecutions = limitValue;
  }

  const db = readDb();
  if (!db[chatId]) db[chatId] = [];
  db[chatId].push(medicine);
  saveDb(db);

  await scheduleReminder(chatId, medicine);

  let limitText = '';
  if (limitType === 'quantity') limitText = `por ${limitValue} vez(es)`;
  else limitText = 'até que ele seja removido';

  bot.sendMessage(
    chatId, strings.confirmation(limitText, medicine.name),
  );
}
