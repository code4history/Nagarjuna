const jp_src = require("../data_src/bijakshara_jp.json");
const cn_src = require("../data_src/bijakshara_cn.json");
const OpenCC = require("opencc");
const t2jp = new OpenCC("t2jp.json");
const s2t = new OpenCC("s2t.json");

const main = () => {
  const cn_src2jp = Promise.all(cn_src.map(async (line) => {
    line.yidam = await s2t.convertPromise(line.yidam).then((t) => {
      return t2jp.convertPromise(t);
    });
    return line;
  })).then((arr) => {
    console.log(arr);
  });

  jp_src.forEach((line) => {
    const romanKey = replacer(line.transcription);
    if (line.roman_transcription !== romanKey) {
      console.log("Still Error");
      console.log(romanKey);
      console.log(line.roman_transcription);
      console.log(line);
    }
  });
};

const replacer = (value) => {
  const fromTo = {
    "ḥ": "h",
    "ṃ": "m",
    "ā": "aa",
    "ī": "ii",
    "ṅ": "n",
    "ṛ": "r",
    "ū": "uu",
    "ś": "s"
  };
  return Object.keys(fromTo).reduce((prev, curr) => {
    return prev.replace(curr, fromTo[curr]);
  }, value);
};

main();