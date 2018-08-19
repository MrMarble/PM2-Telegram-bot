const TelegramBot = require('node-telegram-bot-api');
const pm2 = require('pm2');

const TOKEN = process.env.TOKEN || "YOUR TOKEN HERE";
const bot = new TelegramBot(TOKEN, {
  polling: {
    autoStart: false,
  }
});

bot.getUpdates().then((updates) => {
  if (updates[0] !== undefined) {
    if (updates[0].message.text.includes('/restart')) {
      bot.getUpdates({
        timeout: 1,
        limit: 0,
        offset: updates[0].update_id + 1
      });
      bot.sendMessage(updates[0].message.chat.id, 'Process restarted');
    }
  }
});
bot.stopPolling();
bot.startPolling();

bot.on('message', generalCallback);
bot.onText(/\/list|ls/, commandListCallback);
bot.onText(/\/restart (.+)/, commandRestartCallback);
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
      error(err);
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

function commandRestartCallback(msg, match) {
  const chat_id = msg.chat.id;
  let proc = match[1];
  pm2.restart(proc, function(err, pr) {
    if (err) {
      error(err);
    }
    for (let proc of pr) {
      bot.sendMessage(chat_id, `Process <i>${proc.name}</i> has been restarted`, {
        parse_mode: 'html'
      });
    }
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
    minutes = Math.abs(Math.round(diff % 60));
    hours = Math.abs(Math.round(diff / 60));
    str = `${hours}h ${minutes}m`;
  }
  return str;
}

function error(error) {
  bot.stopPolling();
  bot.getUpdates({
    timeout: 1,
    limit: 0,
    offset: bot._polling.options.params.offset
  });
  console.error(error);
  pm2.disconnect();
}
