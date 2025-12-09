import express from 'express';
import cors from 'cors';
import fs from 'fs-extra';
import path from 'path';
import mime from 'mime-types';
import dotenv from 'dotenv';

// 配置环境变量
dotenv.config();

const app = express();
const PORT = 3001;

// 配置CORS
app.use(cors());

// 支持的图片格式
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];

// 获取表情包列表
app.get('/api/emojis', async (req, res) => {
  try {
    const emojiDir = process.env.EMOJI_DIR;
    if (!emojiDir) {
      return res.status(500).json({ error: 'EMOJI_DIR 环境变量未配置' });
    }

    // 递归遍历文件夹，获取所有图片
    const getAllEmojis = async (dir, baseDir) => {
      const items = await fs.readdir(dir, { withFileTypes: true });
      const emojis = [];

      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const relativePath = path.relative(baseDir, fullPath);

        if (item.isDirectory()) {
          // 递归处理子文件夹
          const subEmojis = await getAllEmojis(fullPath, baseDir);
          emojis.push(...subEmojis);
        } else {
          // 检查文件扩展名是否为图片
          const ext = path.extname(item.name).toLowerCase();
          if (IMAGE_EXTENSIONS.includes(ext)) {
            emojis.push({
              name: item.name,
              path: relativePath,
              fullPath: fullPath,
              size: (await fs.stat(fullPath)).size,
              mimeType: mime.lookup(ext) || 'image/jpeg'
            });
          }
        }
      }

      return emojis;
    };

    const emojis = await getAllEmojis(emojiDir, emojiDir);
    
    // 按文件夹分组
    const groupedEmojis = emojis.reduce((groups, emoji) => {
      const dirName = path.dirname(emoji.path) || '根目录';
      if (!groups[dirName]) {
        groups[dirName] = [];
      }
      groups[dirName].push(emoji);
      return groups;
    }, {});

    res.json({ emojis, groupedEmojis });
  } catch (error) {
    console.error('获取表情包列表失败:', error);
    res.status(500).json({ error: '获取表情包列表失败' });
  }
});

// 提供图片下载 - 使用查询参数传递文件路径
app.get('/api/image', async (req, res) => {
  try {
    const emojiDir = process.env.EMOJI_DIR;
    if (!emojiDir) {
      return res.status(500).json({ error: 'EMOJI_DIR 环境变量未配置' });
    }

    // 从查询参数获取文件路径
    const { path: filePath } = req.query;
    if (!filePath) {
      return res.status(400).json({ error: '缺少文件路径参数' });
    }

    const imagePath = path.join(emojiDir, filePath);

    if (!await fs.exists(imagePath)) {
      return res.status(404).json({ error: '图片不存在' });
    }

    // 获取文件扩展名和MIME类型
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = mime.lookup(ext) || 'image/jpeg';

    // 设置响应头
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(imagePath)}"`);

    // 流式传输文件
    const stream = fs.createReadStream(imagePath);
    stream.pipe(res);
  } catch (error) {
    console.error('获取图片失败:', error);
    res.status(500).json({ error: '获取图片失败' });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`表情包目录: ${process.env.EMOJI_DIR}`);
});