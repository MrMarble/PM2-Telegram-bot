import TelegramBot from "node-telegram-bot-api";
import { list, restart } from "./pm2";
import { pad, timeSince } from "./utils";

const token = process.env.TOKEN;
const bot = new TelegramBot(token, { polling: true });

// List command
bot.onText(/^\/(list|ls)/, async (msg, _) => {
  const status = {
    online: "\u{2705}",
    stopping: "\u{1F6AB}",
    stopped: "\u{1F6AB}",
    launching: "\u{267B}",
    errored: "\u{1F198}",
  };

  let { err, response } = await list();
  if (err) return error(msg.chat.id, err);
  let body = [];
  for (const proc of response) {
    body.push(
      [
        `<b>${proc.name}</b> ${status[proc.pm2_env.status] || ""}<pre>`,
        pad`ID: ${proc.pm_id}`,
        pad`MEM: ${Math.round(proc.monit.memory / 1024 / 1024)}Mb`,
        pad`CPU: ${proc.monit.cpu} %`,
        pad`UPTIME: ${timeSince(proc.pm2_env.pm_uptime)}`,
        pad`RESTARTS: ${proc.pm2_env.restart_time}`,
        pad`STATUS: ${proc.pm2_env.status}`,
        "</pre>",
      ].join("\n")
    );
  }
  bot.sendMessage(msg.chat.id, body.join("\n"), {
    parse_mode: "html",
  });
});

// Restart command
bot.onText(/^\/restart (.+)/, async (msg, matches) => {
  let process = matches[1];

  let { err, response } = await restart(process);
  if (err) return error(msg.chat.id, err);
  for (const proc of response) {
    bot.sendMessage(
      msg.chat.id,
      `Process <i>${proc.name}</i> has been restarted`,
      {
        parse_mode: "html",
      }
    );
  }
});

/**
 * Logs an error to the console and the user
 *
 * @param {number} chat_id
 * @param {Error} err
 */
function error(chat_id, err) {
  console.error(err);
  bot.sendMessage(chat_id, err.message);
}

export function startListening() {
  bot.stopPolling();
  bot.startPolling();
}
