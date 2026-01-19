import fs from 'fs';

const Class = [
  "防护职业",
  "治疗职业",
  "近战职业",
  "远程职业",
  "其他",
];

const Job = {
  "防护职业": [
    "骑士",
    "战士",
    "暗黑骑士",
    "绝枪战士",
  ],
  "治疗职业": [
    "白魔法师",
    "学者",
    "占星术士",
    "贤者",
  ],
  "近战职业": [
    "武僧",
    "龙骑士",
    "忍者",
    "武士",
    "钐镰客",
    "蝰蛇剑士",
  ],
  "远程职业": [
    "吟游诗人",
    "机工士",
    "舞者",
    "黑魔法师",
    "召唤师",
    "赤魔法师",
    "绘灵法师",
    "青魔法师",
  ],
  "其他": [
    "捕鱼人",
    "大河狸",
    "死刑点名",
    "Yan"
  ]
};

const JobIndex = [
  "骑士",
  "战士",
  "暗黑骑士",
  "绝枪战士",
  "白魔法师",
  "学者",
  "占星术士",
  "贤者",
  "武僧",
  "龙骑士",
  "忍者",
  "武士",
  "钐镰客",
  "蝰蛇剑士",
  "吟游诗人",
  "机工士",
  "舞者",
  "黑魔法师",
  "召唤师",
  "赤魔法师",
  "绘灵法师",
  "青魔法师",
  "捕鱼人",
  "大河狸",
  "死刑点名",
  "Yan"
];

const files = fs.readdirSync('../../public/jobs');

[
  "fileName",
  "coverFileName",
  "jobName",
  "className",
  "jobIndex",
  "fileIndex",
]

const stickers = [];
files.forEach((fileName) => {
  if (fileName === "问号.png") {
    return;
  }
  const sticker = {};
  const mainName = fileName.split('.')[0];

  // 文件名
  sticker.fileName = fileName;
  // 封面文件名
  if (fileName === "Yan1.png" || fileName === "死刑点名1.png" || fileName === "大河狸1.png") {
    sticker.coverFileName = "问号.png";
  } else {
    sticker.coverFileName = fileName;
  }
  // 职业名
  sticker.jobName = mainName.slice(0, -1);
  // 职业序号
  JobIndex.forEach((j, i) => {
    if (j === sticker.jobName) {
      sticker.jobIndex = i;
    }
  });
  // 职业文件序号（文件名后面的123）
  sticker.fileIndex = Number(mainName.slice(-1));
  // 职能名
  Class.forEach((c) => {
    Job[c].forEach((j) => {
      if (j === sticker.jobName) {
        sticker.className = c;
      }
    });
  });

  stickers.push(sticker);
});

const json = JSON.stringify(stickers, null, 2);

fs.writeFileSync('./jobs_file_name.json', json, {
  encoding: 'utf-8'
})

// 需要预加载的文件列表
const preloadFiles = [];
preloadFiles.push('./delete.png', "./add.png", "./sub.png");
files.forEach((v) => preloadFiles.push(`./jobs/${v}`));
fs.writeFileSync('./preload_file_name.json', JSON.stringify(preloadFiles, null, 2), {
  encoding: 'utf-8'
});

console.log(json);
