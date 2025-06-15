import schedule from 'node-schedule';
import { bot } from './config.js';
import { parseSchedule } from './parse-schedule.js';
import { readDb, saveDb } from './db.js';
import { botStrings } from './strings.js';
import { userState } from './conversation.js';

const strings = botStrings.schedulerFile;
export const jobs = new Map();
global.jobs = jobs;

export const scheduleReminder = async (chatId, medicine) => {
  if (jobs.has(medicine.id)) {
    jobs.get(medicine.id).cancel();
    jobs.delete(medicine.id);
  }

  if (medicine.cronExpression) {
    const job = schedule.scheduleJob(medicine.cronExpression, async () => {
      medicine.executionCount = (medicine.executionCount || 0) + 1;
      updateMedicineExecutionCount(chatId, medicine.id, medicine.executionCount);

      await sendReminder(chatId, medicine);

      if (
        typeof medicine.limitExecutions === 'number' &&
        medicine.executionCount >= medicine.limitExecutions
      ) {
        await bot.sendMessage(chatId, strings.lastReminder(medicine.name));
        jobs.delete(medicine.id);
      }
    });

    jobs.set(medicine.id, job);
    return true;
  }

  const scheduleInfo = parseSchedule(medicine.scheduleText);

  if (scheduleInfo?.type === 'ask_hour') {
    userState[chatId] = {
      step: 'awaiting_daily_time',
      pendingMedicine: medicine,
    };

    await bot.sendMessage(chatId, strings.askDailyTime);
    return 'awaiting_hour';
  }

  if (!scheduleInfo || !scheduleInfo.startDate) {
    await bot.sendMessage(chatId, strings.invalidSchedule(medicine.scheduleText));
    return false;
  }

  medicine.executionCount = medicine.executionCount || 0;

  const scheduleNext = (date) => {
    if (date <= new Date()) {
      if (scheduleInfo.type === 'interval') {
        date = new Date(Date.now() + scheduleInfo.intervalMinutes * 60000);
      } else if (scheduleInfo.type === 'daily') {
        date.setDate(date.getDate() + 1);
      }
    }

    const job = schedule.scheduleJob(date, async () => {
      medicine.executionCount++;
      updateMedicineExecutionCount(chatId, medicine.id, medicine.executionCount);

      await sendReminder(chatId, medicine);

      if (
        typeof medicine.limitExecutions === 'number' &&
        medicine.executionCount >= medicine.limitExecutions
      ) {
        await bot.sendMessage(chatId, strings.lastReminder(medicine.name));
        jobs.delete(medicine.id);
        return;
      }

      if (scheduleInfo.type === 'interval') {
        const nextDate = new Date(Date.now() + scheduleInfo.intervalMinutes * 60000);
        scheduleNext(nextDate);
      } else if (scheduleInfo.type === 'daily') {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        scheduleNext(nextDate);
      }
    });

    jobs.set(medicine.id, job);
  };

  scheduleNext(scheduleInfo.startDate);
  return true;
};

const sendReminder = async (chatId, medicine) => {
  const text = strings.reminder(medicine.name);

  if (medicine.photoId) {
    await bot.sendPhoto(chatId, medicine.photoId, {
      caption: text,
      parse_mode: 'Markdown',
    });
  } else {
    await bot.sendMessage(chatId, text, {
      parse_mode: 'Markdown',
    });
  }
};

function updateMedicineExecutionCount(chatId, medicineId, newCount) {
  const db = readDb();
  const userMeds = db[chatId];
  if (!userMeds) return;

  const med = userMeds.find(m => m.id === medicineId);
  if (!med) return;

  med.executionCount = newCount;
  saveDb(db);
}
