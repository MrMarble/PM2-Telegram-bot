const TelegramBot = require('node-telegram-bot-api');
const pm2 = require('pm2');

const TelegramToken = process.env.TelegramToken || '<TOKEN>';
const bot = new TelegramBot(TelegramToken, {polling: true});

bot.onText(/\/(list|ls)/, (msg, match) => {
  const chatId = msg.chat.id;
  pm2.list(function(err, list) {
    if(err) {
      console.error(err);
    }
    var response = '';
    for (pr of list) {
      response += `<b>${pr.name}</b>
  <pre>id: ${pr.pm_id}
  monit: ${pr.monit.memory / 1024}Mb ${pr.monit.cpu}%
  status: ${pr.pm2_env.status}
  </pre>\n`;
    }

    // send back the matched "whatever" to the chat
    bot.sendMessage(chatId, response, {parse_mode: "HTML"}).catch((error) => {
      console.error(error.code);
      console.error(error.response.body);
    });
  });
});

bot.on('polling_error', (error) => {
  console.error(error);  // => 'EFATAL'
  PM2.disconnect();
  process.exit(2);
});
