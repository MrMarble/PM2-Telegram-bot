const TelegramBot = require('node-telegram-bot-api');
const pm2 = require('pm2');

const TOKEN = process.env.TOKEN || "<DEFAULT TOKEN>";
const bot = new TelegramBot(TOKEN, {
  polling: true
});

bot.on('message', generalCallback);
bot.onText(/\/list|ls/, commandListCallback);
// bot.onText(/\/restart (\d+)|(\D+)/, commandRestartCallback);
// bot.onText(/logs? (\d+)|(.+) (\d)/, commandLogCallback);
// bot.onText(/monit (\d+)|(.+)/, commandMonitCallback);

function generalCallback(msg) {
  let date = new Date(msg.date * 1000);
  let hours = date.getHours();
  let minutes = "0" + date.getMinutes();
  let seconds = "0" + date.getSeconds();
  let formattedTime = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()} ${hours}:${minutes.substr(-2)}:${seconds.substr(-2)}`;
  console.log(`[${formattedTime}] Message (${msg.message_id}) received from @${msg.from.username} (${msg.from.id})`);
}

function commandListCallback(msg, match) {
  const chat_id = msg.chat.id;
  const status = {
    online: "\u{2705}",
    stopping: "\u{1F6AB}",
    stopped: "\u{1F6AB}",
    launching: "\u{267B}",
    errored: "\u{1F198}",
  };
  pm2.list(function(err, list) {
    let response = '';
    if (err) {
      error(err, chat_id);
    }
    for (let proc of list) {
      response += `<b>${proc.name}</b> ${status[proc.pm2_env.status] || ''}` +
        `<pre> ID:       ${proc.pm_id}\n` +
        ` MEM:      ${Math.round(proc.monit.memory / 1024 / 1024)}Mb\n` +
        ` CPU:      ${proc.monit.cpu} %\n` +
        ` UPTIME:   ${time_since(proc.pm2_env.pm_uptime)}\n` +
        ` RESTARTS: ${proc.pm2_env.restart_time}\n` +
        ` STATUS:   ${proc.pm2_env.status}</pre>`;
    }
    bot.sendMessage(chat_id, response, {
      parse_mode: 'html'
    }).catch((error) => {
      console.error(error.code);
      console.error(error.response.body);
    });
  });
}

function time_since(timestamp) {
  let diff = (new Date().getTime() - parseInt(timestamp)) / 1000;
  let seconds = diff;
  let minutes = 0;
  let hours = 0;
  let str = `${Math.abs(Math.round(seconds))}s`;
  if (seconds > 60) {
    seconds = Math.abs(Math.round(diff % 60));
    minutes = Math.abs(Math.round(diff /= 60));
    str = `${minutes}m ${seconds}s`;
  }
  if (minutes > 60) {
    minutes = Math.abs(Math.round(diff % 24));
    hours = Math.abs(Math.round(diff / 24));
    str = `${hours}h ${minutes}m`;
  }
  return str;
}

function error(error, chat_id) {
  console.error(err);
  if (chat_id !== undefined) {
    bot.sendMessage(chat_id, `<pre>${err}</pre>`, {
      parse_mode: 'html'
    });
  }
  pm2.disconnect();
  process.exit(2);
}
