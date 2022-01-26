const Nagarjuna = require("./src");
const fs = require("fs");

const exportFolder = './extract';

const extractor = (options, isMac) => {
  let filename = options.filename;

  filename = `${exportFolder}/${filename}_IME.${isMac ? "plist" : "txt"}`;

  const method = isMac ? "exportIMEPlist" : "exportIMETxt";

  const content = Nagarjuna[method](options);

  fs.writeFileSync(filename, content);
}

// Siddham Buddha Name
let options = {
  use_phonetic: false,
  use_buddha_name: true,
  export_siddham: true,
  export_deva: false,
  filename: "siddham_buddha"
};

extractor(options, true);
extractor(options, false);

// Devanagari Buddha Name
options = {
  use_phonetic: false,
  use_buddha_name: true,
  export_siddham: false,
  export_deva: true,
  filename: "deva_buddha"
};

extractor(options, true);
extractor(options, false);

// Siddham Phonetic
options = {
  use_phonetic: true,
  use_buddha_name: false,
  export_siddham: true,
  export_deva: false,
  filename: "siddham_phonetic"
};

extractor(options, true);
extractor(options, false);

// Devanagari Phonetic
options = {
  use_phonetic: true,
  use_buddha_name: false,
  export_siddham: false,
  export_deva: true,
  filename: "deva_phonetic"
};

extractor(options, true);
extractor(options, false);

// Hentai Kana
options = {
  export_hentai_kana: true,
  filename: "hentai_kana"
};

extractor(options, true);
extractor(options, false);

// Itaiji
options = {
  export_itaiji: true,
  filename: "kanji_itaiji"
};

extractor(options, true);
extractor(options, false);

// Kumimoji
options = {
  export_kumimoji: true,
  filename: "kumimoji"
};

extractor(options, true);
extractor(options, false);

/*console.log(Nagarjuna.exportIMEPlist({
  export_deva: true,
  export_siddham: false,
  use_phonetic: true,
  use_minimum_only: true,
  export_kumimoji: true
}));*/