const fetch = require("node-fetch");
const fs = require("fs");
const api_url = "http://aksharamukha-plugin.appspot.com/api/public?source={src}&target={tgt}&text={txt}";
const bijakshara = require("../src/bijakshara.json");
const chars = bijakshara.characters;
const yidams = bijakshara.yidams;
const refs = bijakshara.refs;

const checker = async (text, expected, fromScript, toScript) => {
  const each_request = api_url.replace("{src}", fromScript)
    .replace("{tgt}", toScript)
    .replace("{txt}", encodeURIComponent(text));
  const ret = await fetch(each_request);
  const actual = await ret.text();
  if (expected !== actual) {
    // Test ignore case:
    const ignoreFlag = [
      // Ignore "ฬ" type accent
      (act, exp, from, to) => {
        const ignore = act.replace("mฬ", "แน");
        return to === "IASTPali" && ignore === exp;
      },
      // Huum cannot keep roundtrip
      (act, exp, from, to) => {
        return act === "๐ฎ๐ณ๐ฝ" && exp === "๐ฎ๐๐ฝ" && to === "Siddham";
      },
      // Hum cannot keep roundtrip
      (act, exp, from, to) => {
        return act === "๐ฎ๐ฒ๐ฝ" && exp === "๐ฎ๐๐ฝ" && to === "Siddham";
      },
      // Su cannot keep roundtrip
      (act, exp, from, to) => {
        return act === "๐ญ๐ฒ" && exp === "๐ญ๐" && to === "Siddham";
      },
      // I cannot keep roundtrip
      (act, exp, from, to) => {
        return act === "๐" && (exp === "๐" || exp === "๐") && to === "Siddham";
      }
    ].reduce((prev, logic) => {
      if (prev) return prev;
      return logic(actual, expected, fromScript, toScript);
    }, false);
    if (!ignoreFlag) throw(`"${text}"'s change from ${fromScript} to ${toScript} is failed. Expected: "${expected}", Actual: "${actual}"`);
  }
};

const doMain = async (skipSort) => {
  // Test roundtrip
  let text = '';
  await Promise.all(chars.map(async (line) => {
    try {
      await checker(line.siddham, line.devanagari, "Siddham", "Devanagari");
    } catch (e) {
      text = `${text}\n${e.toString()}`
    }
    try {
      await checker(line.siddham, line.transcription, "Siddham", "IASTPali");
    } catch (e) {
      text = `${text}\n${e.toString()}`
    }
    try {
      await checker(line.devanagari, line.siddham, "Devanagari", "Siddham");
    } catch (e) {
      text = `${text}\n${e.toString()}`
    }
  }));

  fs.writeFileSync('./tools/roundtrip_result.txt', text);

  // Sort bijakshara data
  if (skipSort) process.exit();

  const charSorted = chars.sort((a, b) => {
    return a.markup > b.markup ? 1 : a.markup < b.markup ? -1 : 0;
  })
  charSorted.forEach((char, index) => {
    char.old_id = char.id;
    char.id = index + 1;
  });

  const addWeight = (txt) => {
    return txt.match(/ๅฆๆฅ$/) ? 1 :
      txt.match(/่ฉ่ฉ$/) ? 2 :
        txt.match(/ๆ็$/) ? 3 :
          txt.match(/่ฆณ้ณ$/) ? 4 :
            txt.match(/ๅฐ่ต$/) ? 5 :
              txt.match(/ๅคฉ$/) ? 6 : 7;
  }

  const yidamSorted = yidams.sort((a, b) => {
    const aWeight = addWeight(a.yidam);
    const bWeight = addWeight(b.yidam);
    return aWeight > bWeight ? 1 : aWeight < bWeight ? -1 : 0;
  });
  yidamSorted.forEach((yidam, index) => {
    yidam.old_id = yidam.id;
    yidam.id = index + 1;
  });

  refs.forEach((ref, index) => {
    let ref_old = ref.char;
    charSorted.forEach((char) => {
      if (char.old_id === ref_old) {
        ref.char = char.id;
        ref_old = null;
      }
    });

    let yidam_old = ref.yidam;
    yidamSorted.forEach((yidam) => {
      if (yidam.old_id === yidam_old) {
        ref.yidam = yidam.id;
        yidam_old = null;
      }
    });
  });

  const refSorted = refs.sort((a, b) => {
    return a.char > b.char ? 1 : a.char < b.char ? -1 :
      a.yidam > b.yidam ? 1 : a.yidam < b.yidam ? -1 : 0;
  });

  refSorted.forEach((ref, index) => {
    ref.id = index + 1;
  });

  charSorted.forEach((char) => {
    delete char.old_id;
  });

  yidamSorted.forEach((yidam) => {
    delete yidam.old_id;
  });

  bijakshara.refs = refSorted;
  bijakshara.characters = charSorted;
  bijakshara.yidams = yidamSorted;

  const formatter = (content) => {
    let ret = `{
  "characters": [
${
    content.characters.map((char) => {
      return `    ${JSON.stringify(char)}`
    }).join(",\n")
    }
  ],
  "yidams": [
${
      content.yidams.map((yidam) => {
        return `    ${JSON.stringify(yidam)}`
      }).join(",\n")
    }
  ],
  "sources": [
${
      content.sources.map((src) => {
        return `    ${JSON.stringify(src)}`
      }).join(",\n")
    }
  ],
  "refs": [
${
      content.refs.map((ref) => {
        return `    ${JSON.stringify(ref)}`
      }).join(",\n")
    }
  ]
}
`;
    return ret;
  };

  fs.writeFileSync('src/bijakshara.json', formatter(bijakshara));
};

doMain(false);