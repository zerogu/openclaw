#!/usr/bin/env node
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// 直接使用 process.env 代替 tiny-getenv

const bucket = process.argv[2] || "copilot";
const key = process.argv[3];
const region = process.env.AWS_REGION || "prod";

if (!key) {
  console.error("Usage: node upload-s3.mjs <bucket> <key>");
  process.exit(1);
}

const accessKeyId = process.env.BOSS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.BOSS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
const endpoint = process.env.BOSS_ENDPOINT;

if (!accessKeyId || !secretAccessKey) {
  console.error("Error: Missing BOSS_ACCESS_KEY_ID or BOSS_SECRET_ACCESS_KEY");
  process.exit(1);
}

const s3 = new S3Client({
  region,
  credentials: { accessKeyId, secretAccessKey },
  ...(endpoint && {
    endpoint,
    forcePathStyle: true, // 强制使用路径样式
  }),
});

let body = "";
process.stdin.setEncoding("utf8");
for await (const chunk of process.stdin) {
  body += chunk;
}

const command = new PutObjectCommand({
  Bucket: bucket,
  Key: key,
  Body: body,
  ContentType: "text/html; charset=utf-8",
});

await s3.send(command);
// 对于内网BOSS，使用固定路径格式
const url = endpoint
  ? `https://shjd-inner-boss.bilibili.co/copilot/${key}`
  : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
console.log(url);
