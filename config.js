import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
dotenv.config();

export const TOKEN = process.env.TELEGRAM_TOKEN;
export const bot = new TelegramBot(TOKEN, { polling: true });
export const DB_FILE = './database.json';
export const TIMEZONE = 'America/Sao_Paulo';