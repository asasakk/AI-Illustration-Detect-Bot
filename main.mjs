// ReadableStreamをグローバルに定義（Node.js v16対応のため）
import { ReadableStream } from 'stream/web';
global.ReadableStream = ReadableStream;

// 必要なモジュールのインポート
import fetch from 'node-fetch';
import fs from "fs";
import path from "path";
import express from "express";
import { Client, Collection, Events, GatewayIntentBits, ActivityType, EmbedBuilder } from "discord.js";
import axios from 'axios';

// スリープ対策のためのExpressサーバーセットアップ
// Google App Scriptから1分毎にデータを送信して、サーバーをアクティブに保つ
let postCount = 0;
const app = express();
app.listen(3000);

// POSTリクエストハンドラ
app.post('/', function(req, res) {
  console.log(`Received POST request.`);
  
  postCount++;
  if (postCount == 10) {
    postCount = 0;
  }
  
  res.send('POST response by glitch');
})

// GETリクエストハンドラ（テスト用）
app.get('/', function(req, res) {
  res.send('test');
})

// Discord.jsクライアントの初期化
// 必要なインテントを指定
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// コマンドコレクションの初期化
client.commands = new Collection();

// ハンドラーの読み込み
// 'handlers'ディレクトリから.mjsファイルを動的にインポート
const handlers = new Map();
const handlersPath = path.join(process.cwd(), "handlers");
const handlerFiles = fs.readdirSync(handlersPath).filter((file) => file.endsWith(".mjs"));

for (const file of handlerFiles) {
  const filePath = path.join(handlersPath, file);
  import(filePath).then((module) => {
    handlers.set(file.slice(0, -4), module);
  });
}


// メッセージ作成のハンドリング
client.on("messageCreate", async (message) => {
  // ボット自身のメッセージや他のボットのメッセージは無視
  if (message.author.id == client.user.id || message.author.bot) return;
  await handlers.get("messageCreate").default(message);
});

// ボットが準備完了したときの処理
client.on("ready", async () => {
  // ボットのステータスを設定
  await client.user.setActivity('AI', { type: ActivityType.Custom, state: "👀fixup監視中" });
  console.log(`${client.user.tag} がログインしました！`);
});

// Discordボットにログイン
client.login(process.env.TOKEN);