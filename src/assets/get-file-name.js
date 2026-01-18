import fs from 'fs';

const Class = [
  "防护职业",
  "治疗职业",
  "近战职业",
  "远程物理职业",
  "远程魔法职业",
  "大地使者",
];

const Job = {
  防护职业: [
    "骑士",
    "战士",
    "暗黑骑士",
    "绝枪战士",
  ],
  治疗职业: [
    "白魔法师",
    "学者",
    "占星术士",
    "贤者",
  ],
  近战职业: [
    "武僧",
    "龙骑士",
    "忍者",
    "武士",
    "钐镰客",
    "蝰蛇剑士",
  ],
  远程物理职业: [
    "吟游诗人",
    "机工士",
    "舞者",
  ],
  远程魔法职业: [
    "黑魔法师",
    "召唤师",
    "赤魔法师",
    "绘灵法师",
    "青魔法师",
  ],
  大地使者: [
    "捕鱼人",
  ]
}

const files = fs.readdirSync('../../public/jobs');

// 按职业存入 Map
const map = new Map();
files.forEach((fileName) => {
  const fileNameMain = fileName.split('.')[0]
  const jobName = fileNameMain.slice(0, -1);
  if (map.has(jobName)) {
    map.get(jobName).push(fileNameMain);
  } else {
    map.set(jobName, [fileNameMain]);
  }
});

const arr = [];
for (const jobName of map.keys()) {
  const obj = {};
  Class.forEach((clz) => {
    if (Job[clz].includes(jobName)) {
      obj.name = jobName;
      obj.class = clz;
      obj.baseNames = map.get(jobName);
    }
  });
  arr.push(obj);
}

const json = JSON.stringify(arr, null, 2);

fs.writeFileSync('./jobs_file_name.json', json, {
  encoding: 'utf-8'
})

console.log(json);
