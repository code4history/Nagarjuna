const bijak_base = require("./bijakshara.json");
const itaiji_base = require("./itaiji.json");

// For Bijakshara
const chars = bijak_base.characters;
const yidams = bijak_base.yidams;
const sources = bijak_base.sources;
const refs = bijak_base.refs;
const bijaks = refs.map((ref) => {
  const char = chars.filter((item) => item.id === ref.char)[0];
  const yidam = yidams.filter((item) => item.id === ref.yidam)[0];
  const srcs = ref.sources.map((src) => sources.filter((item) => item.id === src)[0].source);
  const set = Object.assign(
    Object.assign({
      memo: ref.memo,
      sources: srcs
    }, char), yidam);
  if (ref.override) {
    Object.keys(ref.override).forEach((key) => {
      set[key] = ref.override[key]
    });
  }
  return set;
});

// For Japanese
const itaiji = itaiji_base.kanji;
const hentai_kana = itaiji_base.kana;
const kumimoji = itaiji_base.kumimoji;

const kataToHira = (str) => {
  return str.replace(/[\u30a1-\u30f6]/g, function(match) {
    var chr = match.charCodeAt(0) - 0x60;
    return String.fromCharCode(chr);
  });
};

const exportSiddhamData = (options, isSiddham) => {
  const useBuddhaName = options.use_buddha_name != null ? options.use_buddha_name : true;
  const usePhonetic = options.use_phonetic || false;
  const useMinimumOnly = options.use_minimum_only || false;
  const ime_settings = [];

  if (usePhonetic) {
    const bijaks_hash = bijaks.reduce((prev, line) => {
      const key = `${line.siddham}-${line.kana}`;
      if (!prev[key]) {
        prev[key] = {
          yidams: [line.yidam],
          kana: kataToHira(line.kana),
          siddham: line.siddham,
          devanagari: line.devanagari
        };
      } else {
        prev[key].yidams.push(line.yidam);
      }
      return prev;
    }, {});
    Object.keys(bijaks_hash).forEach((key) => {
      const line = bijaks_hash[key];
      const changeTo = isSiddham ? line.siddham : line.devanagari;
      const changeFrom = line.kana;
      const comment = `${line.yidams.join(",")}の種子（${isSiddham ? "悉曇文字" : "デーヴァナーガリー文字"}）`;
      ime_settings.push([changeFrom, changeTo, comment]);
    });
  }

  if (useBuddhaName) {
    bijaks.forEach((line) => {
      const changeTo = isSiddham ? line.siddham : line.devanagari;
      const changeFroms = useMinimumOnly ? [line.phonetic.sort((a, b) => {
        return a.length - b.length;
      })[0]] : line.phonetic;
      const comment = `${line.yidam}の種子（${line.kana}、${isSiddham ? "悉曇文字" : "デーヴァナーガリー文字"}）`;
      changeFroms.forEach((changeFrom) => {
        ime_settings.push([changeFrom, changeTo, comment]);
      });
    });
  }

  return ime_settings;
};

const exportHentaiKanaData = () => {
  const ime_settings = [];

  Object.keys(hentai_kana).forEach((changeFrom) => {
    const list = hentai_kana[changeFrom];
    list.forEach((line) => {
      const changeTo = line.hentai_kana;
      const comment = `${changeFrom}の変体仮名（字母：${line.jibo}）`;
      ime_settings.push([changeFrom, changeTo, comment]);
    });
  });

  return ime_settings;
};

const exportItaijiData = () => {
  const ime_settings = [];

  Object.keys(itaiji).forEach((key) => {
    const list = itaiji[key];
    const changeFroms = list.yomi;
    const changeTos = list.itaiji;
    const comment = `${key}の異体字`;
    changeFroms.forEach((changeFrom) => {
      changeTos.forEach((changeTo) => {
        ime_settings.push([changeFrom, changeTo, comment]);
      });
    });
  });

  return ime_settings;
};

const exportKumimojiData = () => {
  const ime_settings = [];

  Object.keys(kumimoji).forEach((changeFrom) => {
    const changeTos = kumimoji[changeFrom];
    const comment = `${changeFrom}の組み文字`;
    changeTos.forEach((changeTo) => {
      ime_settings.push([changeFrom, changeTo, comment]);
    });
  });

  return ime_settings;
};

const exportIMEData = (options) => {
  options = options || {};
  const exportDeva = options.export_deva || false;
  const exportSiddham = options.export_siddham != null ? options.export_siddham : true;
  const exportHentaiKana = (options.export_hentai_kana || options.export_japanese) || false;
  const exportItaiji = (options.export_itaiji || options.export_japanese) || false;
  const exportKumimoji = (options.export_kumimoji || options.export_japanese) || false;
  let ime_settings = [];

  if (exportDeva) ime_settings = ime_settings.concat(exportSiddhamData(options, false));
  if (exportSiddham) ime_settings = ime_settings.concat(exportSiddhamData(options, true));

  if (exportHentaiKana) ime_settings = ime_settings.concat(exportHentaiKanaData());
  if (exportItaiji) ime_settings = ime_settings.concat(exportItaijiData());
  if (exportKumimoji) ime_settings = ime_settings.concat(exportKumimojiData());

  return ime_settings;
};

const exportIMETxt = (options) => {
  const list = exportIMEData(options);
  return list.reduce((prev, line) => {
    return `${prev}${line[0]}\t${line[1]}\t名詞\t${line[2]}\n`;
  }, "");
};

const exportIMEPlist = (options) => {
  const list = exportIMEData(options);
  let out = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<array>
`;
  out = list.reduce((prev, line) => {
    return `${prev}\t<dict>
\t\t<key>phrase</key>
\t\t<string>${line[1]}</string>
\t\t<key>shortcut</key>
\t\t<string>${line[0]}</string>
\t</dict>
`;
  }, out);
  out = `${out}</array>
</plist>
`;
  return out;
};

module.exports = {
  exportIMEData,
  exportIMETxt,
  exportIMEPlist
};


