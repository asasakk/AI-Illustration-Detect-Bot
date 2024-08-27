import axios from 'axios';
import fetch from 'node-fetch';

export default async (message) => {
  // fixupx.comを含むメッセージを検出
  if (message.content.match(/fixupx\.com/)) {
    try {
      // fixupx.comのURLから最初の画像URLを抽出
      const imageUrl = await getFixupxImageUrls(message.content);
      
      if (imageUrl) {
        // 画像のAI生成確率をチェック
        const aiGeneratedScore = await checkImage(imageUrl);
        
        // コンソールに結果を出力
        console.log(`画像URL: ${imageUrl}, AI生成確率: ${aiGeneratedScore}`);
        
        // AI生成確率が0.5を超えた場合のみ返信
        if (aiGeneratedScore > 0.5) {
          await message.reply(`画像URL: <${imageUrl}>\nAI生成確率: ${aiGeneratedScore}`);
        }
      } else {
        console.log('画像URLが見つかりませんでした。');
      }
    } catch (error) {
      console.error('エラーが発生しました:', error);
    }
  }
};

async function getFixupxImageUrls(content) {
  // fixupx.comのURLを抽出する正規表現
  const urlRegex = /(https?:\/\/fixupx\.com\/[^\s]+)/g;
  const matches = content.match(urlRegex);

  if (!matches) return null;

  for (const fixupxUrl of matches) {
    try {
      const response = await fetch(fixupxUrl);
      const html = await response.text();

      // 画像URLを抽出するための正規表現
      const imageRegex = /https:\/\/pbs\.twimg\.com\/media\/[^"]+/;
      const imageMatch = html.match(imageRegex);

      if (imageMatch) {
        // 最初の画像URLを大きいサイズに変更して返す
        return imageMatch[0].replace('name=small', 'name=large');
      }
    } catch (error) {
      console.error('fixupx.comのURLの処理中にエラーが発生しました:', error);
    }
  }

  return null; // 画像が見つからない場合
}

const checkImage = async (imageUrl) => {
  try {
    const response = await axios.get('https://api.sightengine.com/1.0/check.json', {
      params: {
        'url': imageUrl,
        'models': 'genai',
        'api_user': process.env.API_USER,
        'api_secret': process.env.API_SECRET,
      }
    });

    return response.data.type.ai_generated;
  } catch (error) {
    console.error('APIエラー:', error.message);
    return null; // エラーの場合はnullを返す
  }
};