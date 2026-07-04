require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const moment = require("moment");

const { uploadImage, saveToSheet } = require("./google");

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: {
    interval: 2000,
    autoStart: true
  }
});

const pending = {};

// 🧹 cleanup memory
setInterval(() => {
  const now = Date.now();
  Object.keys(pending).forEach((k) => {
    if (now - pending[k].time > 10 * 60 * 1000) {
      delete pending[k];
    }
  });
}, 600000);

// 📌 รับคำสั่ง
bot.on("message", async (msg) => {
  const text = msg.text;
  const user = msg.from;

  if (text === "เข้างาน" || text === "ออกงาน") {
    pending[user.id] = {
      action: text,
      user,
      time: Date.now()
    };

    return bot.sendMessage(msg.chat.id, "📸 ส่งรูปยืนยัน");
  }

  if (msg.photo) {
    const data = pending[user.id];
    if (!data) return;

    try {
      const file = await bot.getFile(msg.photo[msg.photo.length - 1].file_id);
      const url = `https://api.telegram.org/file/bot${process.env.BOT_TOKEN}/${file.file_path}`;

      const img = await axios.get(url, { responseType: "arraybuffer" });

      const fileName = `${Date.now()}.jpg`;
      const filePath = path.join(__dirname, fileName);

      fs.writeFileSync(filePath, img.data);

      const imageUrl = await uploadImage(filePath, fileName);

      const now = moment();

      await saveToSheet([
        user.id,
        user.first_name,
        data.action,
        now.format("YYYY-MM-DD"),
        now.format("HH:mm:ss"),
        imageUrl
      ]);

      fs.unlinkSync(filePath);

      delete pending[user.id];

      bot.sendMessage(msg.chat.id, "✅ บันทึกสำเร็จ");
    } catch (err) {
      console.error(err);
      bot.sendMessage(msg.chat.id, "❌ error");
    }
  }
});