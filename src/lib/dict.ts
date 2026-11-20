import { WordLookupResult } from "@/types";

interface DictEntry {
  phonetic: string;
  meaning: string;
}

/**
 * 内置高频与演讲核心英汉词库（含 IPA 音标与词性+简明中文释义）
 * 覆盖乔布斯斯坦福演讲全部重点词与常见高频词；未命中时支持词形还原及在线词典自动兜底。
 */
const LOCAL_DICT: Record<string, DictEntry> = {
  dogma: { phonetic: "/'dɑgmə/", meaning: "n. 教条，信条" },
  trap: { phonetic: "/træp/", meaning: "v. 困住，使陷入；n. 陷阱" },
  trapped: { phonetic: "/træpt/", meaning: "adj. 被困住的；v. 困住（trap 的过去分词）" },
  dramatic: { phonetic: "/drə'mætɪk/", meaning: "adj. 戏剧性的，夸张的；引人注目的" },
  sorry: { phonetic: "/'sɒri/", meaning: "adj. 抱歉的，遗憾的" },
  quite: { phonetic: "/kwaɪt/", meaning: "adv. 相当，完全，确实" },
  true: { phonetic: "/truː/", meaning: "adj. 真实的，确实的" },
  time: { phonetic: "/taɪm/", meaning: "n. 时间，时刻；时代" },
  limited: { phonetic: "/'lɪmɪtɪd/", meaning: "adj. 有限的" },
  limit: { phonetic: "/'lɪmɪt/", meaning: "n./v. 限制，限度" },
  waste: { phonetic: "/weɪst/", meaning: "v. 浪费；n. 浪费，废弃物" },
  live: { phonetic: "/lɪv/", meaning: "v. 生活，活着，居住" },
  living: { phonetic: "/'lɪvɪŋ/", meaning: "n. 生计，生活；v. 活着（live 的现在分词）" },
  someone: { phonetic: "/'sʌmwʌn/", meaning: "pron. 某人，有人" },
  else: { phonetic: "/els/", meaning: "adv. 其他，另外" },
  life: { phonetic: "/laɪf/", meaning: "n. 生命，生活，一生" },
  result: { phonetic: "/rɪ'zʌlt/", meaning: "n. 结果，后果；v. 导致" },
  results: { phonetic: "/rɪ'zʌlts/", meaning: "n. 结果，成果（result 的复数）" },
  other: { phonetic: "/'ʌðər/", meaning: "adj./pron. 其他的，另外的" },
  people: { phonetic: "/'piːpl/", meaning: "n. 人们，人，民族" },
  think: { phonetic: "/θɪŋk/", meaning: "v. 思考，认为，想" },
  thinking: { phonetic: "/'θɪŋkɪŋ/", meaning: "n. 思考，思想，见解" },
  noise: { phonetic: "/nɔɪz/", meaning: "n. 噪音，喧哗声，杂音" },
  opinion: { phonetic: "/ə'pɪnjən/", meaning: "n. 意见，看法，主张" },
  opinions: { phonetic: "/ə'pɪnjənz/", meaning: "n. 意见，看法（opinion 的复数）" },
  drown: { phonetic: "/draʊn/", meaning: "v. 淹没，盖过（声音）；溺水" },
  own: { phonetic: "/oʊn/", meaning: "adj. 自己的；v. 拥有" },
  inner: { phonetic: "/'ɪnər/", meaning: "adj. 内心的，内部的" },
  voice: { phonetic: "/vɔɪs/", meaning: "n. 声音，嗓音，心声" },
  honor: { phonetic: "/'ɑːnər/", meaning: "v. 使荣幸，尊敬；n. 荣誉" },
  honored: { phonetic: "/'ɑːnərd/", meaning: "adj. 感到荣幸的，受尊敬的" },
  commencement: { phonetic: "/kə'mensmənt/", meaning: "n. 毕业典礼；开始" },
  finest: { phonetic: "/'faɪnɪst/", meaning: "adj. 最好的，最优秀的" },
  university: { phonetic: "/ˌjuːnɪ'vɜːrsəti/", meaning: "n. 大学" },
  universities: { phonetic: "/ˌjuːnɪ'vɜːrsətiz/", meaning: "n. 大学（university 的复数）" },
  world: { phonetic: "/wɜːrld/", meaning: "n. 世界，地球" },
  graduate: { phonetic: "/'ɡrædʒuət/", meaning: "v. 毕业；n. 毕业生" },
  graduated: { phonetic: "/'ɡrædʒueɪtɪd/", meaning: "v. 毕业（graduate 的过去式）" },
  graduation: { phonetic: "/ˌɡrædʒu'eɪʃn/", meaning: "n. 毕业，毕业典礼" },
  college: { phonetic: "/'kɑːlɪdʒ/", meaning: "n. 大学，学院" },
  truth: { phonetic: "/truːθ/", meaning: "n. 事实，真相，真理" },
  closest: { phonetic: "/'kloʊsɪst/", meaning: "adj. 最近的，最接近的" },
  story: { phonetic: "/'stɔːri/", meaning: "n. 故事，经历" },
  stories: { phonetic: "/'stɔːriz/", meaning: "n. 故事（story 的复数）" },
  connect: { phonetic: "/kə'nekt/", meaning: "v. 连接，串联，联系" },
  connecting: { phonetic: "/kə'nektɪŋ/", meaning: "v. 连接，串联（connect 的现在分词）" },
  dot: { phonetic: "/dɑːt/", meaning: "n. 点，圆点" },
  dots: { phonetic: "/dɑːts/", meaning: "n. 点，点滴（dot 的复数）" },
  drop: { phonetic: "/drɑːp/", meaning: "v. 退学（drop out），落下；n. 滴" },
  dropped: { phonetic: "/drɑːpt/", meaning: "v. 退学，放弃（drop 的过去式）" },
  stay: { phonetic: "/steɪ/", meaning: "v. 停留，保持，继续处于" },
  stayed: { phonetic: "/steɪd/", meaning: "v. 停留，留宿（stay 的过去式）" },
  quit: { phonetic: "/kwɪt/", meaning: "v. 离开，停止，辞职，退学" },
  biological: { phonetic: "/ˌbaɪə'lɑːdʒɪkl/", meaning: "adj. 亲生的，生物学的" },
  unwed: { phonetic: "/ˌʌn'wed/", meaning: "adj. 未婚的" },
  decide: { phonetic: "/dɪ'saɪd/", meaning: "v. 决定，下决心" },
  decided: { phonetic: "/dɪ'saɪdɪd/", meaning: "v. 决定（decide 的过去式）" },
  adoption: { phonetic: "/ə'dɑːpʃn/", meaning: "n. 收养，领养；采用" },
  adopt: { phonetic: "/ə'dɑːpt/", meaning: "v. 收养，领养；采纳" },
  adopted: { phonetic: "/ə'dɑːptɪd/", meaning: "v. 被收养（adopt 的过去分词）" },
  lawyer: { phonetic: "/'lɔɪər/", meaning: "n. 律师" },
  forward: { phonetic: "/'fɔːrwərd/", meaning: "adv. 向前，向未来" },
  backward: { phonetic: "/'bækwərd/", meaning: "adv. 向后，回顾过去" },
  trust: { phonetic: "/trʌst/", meaning: "v./n. 相信，信任" },
  future: { phonetic: "/'fjuːtʃər/", meaning: "n. 未来，前途" },
  gut: { phonetic: "/ɡʌt/", meaning: "n. 直觉，本能；勇气" },
  destiny: { phonetic: "/'destəni/", meaning: "n. 命运，天命" },
  karma: { phonetic: "/'kɑːrmə/", meaning: "n. 因果报应，因缘" },
  loss: { phonetic: "/lɔːs/", meaning: "n. 失去，丧失，亏损" },
  lucky: { phonetic: "/'lʌki/", meaning: "adj. 幸运的" },
  garage: { phonetic: "/ɡə'rɑːʒ/", meaning: "n. 车库" },
  company: { phonetic: "/'kʌmpəni/", meaning: "n. 公司，陪伴" },
  satisfied: { phonetic: "/'sætɪsfaɪd/", meaning: "adj. 满意的，满足的" },
  satisfy: { phonetic: "/'sætɪsfaɪ/", meaning: "v. 使满意，使满足" },
  believe: { phonetic: "/bɪ'liːv/", meaning: "v. 相信，认为" },
  great: { phonetic: "/ɡreɪt/", meaning: "adj. 伟大的，极好的" },
  settle: { phonetic: "/'setl/", meaning: "v. 将就，妥协；定居，解决" },
  matter: { phonetic: "/'mætər/", meaning: "n. 事情，问题；v. 要紧" },
  matters: { phonetic: "/'mætərz/", meaning: "n. 事情，关乎…的事" },
  heart: { phonetic: "/hɑːrt/", meaning: "n. 内心，心脏，核心" },
  death: { phonetic: "/deθ/", meaning: "n. 死亡" },
  quote: { phonetic: "/kwoʊt/", meaning: "n. 名言，引语；v. 引用" },
  certainly: { phonetic: "/'sɜːrtnli/", meaning: "adv. 必定，无疑，当然" },
  heaven: { phonetic: "/'hevn/", meaning: "n. 天堂" },
  destination: { phonetic: "/ˌdestɪ'neɪʃn/", meaning: "n. 目的地，终点" },
  share: { phonetic: "/ʃer/", meaning: "v. 共同拥有，分享" },
  escape: { phonetic: "/ɪ'skeɪp/", meaning: "v./n. 逃脱，逃避" },
  escaped: { phonetic: "/ɪ'skeɪpt/", meaning: "v. 逃脱（escape 的过去分词）" },
  courage: { phonetic: "/'kɜːrɪdʒ/", meaning: "n. 勇气，胆量" },
  follow: { phonetic: "/'fɑːloʊ/", meaning: "v. 追随，遵循，跟随" },
  intuition: { phonetic: "/ˌɪntu'ɪʃn/", meaning: "n. 直觉" },
  become: { phonetic: "/bɪ'kʌm/", meaning: "v. 成为，变成" },
  secondary: { phonetic: "/'sekənderi/", meaning: "adj. 次要的，第二位的" },
  hungry: { phonetic: "/'hʌŋɡri/", meaning: "adj. 渴望的，饥饿的" },
  foolish: { phonetic: "/'fuːlɪʃ/", meaning: "adj. 愚蠢的，大智若愚的" },
  anew: { phonetic: "/ə'nuː/", meaning: "adv. 重新，再一次" },
  wish: { phonetic: "/wɪʃ/", meaning: "v./n. 希望，祝愿" },
  wished: { phonetic: "/wɪʃt/", meaning: "v. 期许，祝愿（wish 的过去分词）" },
};

const IRREGULAR_LEMMAS: Record<string, string> = {
  was: "be",
  were: "be",
  been: "be",
  am: "be",
  is: "be",
  are: "be",
  had: "have",
  has: "have",
  did: "do",
  does: "do",
  done: "do",
  went: "go",
  gone: "go",
  got: "get",
  gotten: "get",
  told: "tell",
  found: "find",
  felt: "feel",
  knew: "know",
  known: "know",
  thought: "think",
  began: "begin",
  begun: "begin",
  grown: "grow",
  grew: "grow",
};

/**
 * 轻量词形还原（将复数、过去式、分词还原为可能的词根原型）
 */
function getCandidateLemmas(word: string): string[] {
  const w = word.toLowerCase();
  const candidates: string[] = [w];

  if (IRREGULAR_LEMMAS[w]) {
    candidates.push(IRREGULAR_LEMMAS[w]);
  }
  if (w.endsWith("ies") && w.length > 4) {
    candidates.push(w.slice(0, -3) + "y");
  }
  if (w.endsWith("es") && w.length > 3) {
    candidates.push(w.slice(0, -2));
    candidates.push(w.slice(0, -1));
  }
  if (w.endsWith("s") && w.length > 2) {
    candidates.push(w.slice(0, -1));
  }
  if (w.endsWith("ied") && w.length > 4) {
    candidates.push(w.slice(0, -3) + "y");
  }
  if (w.endsWith("ed") && w.length > 3) {
    const stem = w.slice(0, -2);
    candidates.push(stem);
    candidates.push(w.slice(0, -1));
    // 双写辅音还原，如 trapped -> trap, dropped -> drop
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      candidates.push(stem.slice(0, -1));
    }
  }
  if (w.endsWith("ing") && w.length > 4) {
    const stem = w.slice(0, -3);
    candidates.push(stem);
    candidates.push(stem + "e"); // living -> live
    if (stem.length >= 3 && stem[stem.length - 1] === stem[stem.length - 2]) {
      candidates.push(stem.slice(0, -1));
    }
  }

  return Array.from(new Set(candidates));
}

/**
 * 清理点击的单词（去掉前后标点、所有格 's 等）
 */
export function cleanClickedWord(raw: string): string {
  let w = raw.trim().replace(/^[^a-zA-Z]+|[^a-zA-Z]+$/g, "");
  if (w.toLowerCase().endsWith("'s")) {
    w = w.slice(0, -2);
  }
  return w;
}

/**
 * 查询单词音标与简明中文释义
 * 1. 优先命中本地词典（毫秒级响应）
 * 2. 未命中时尝试词形还原匹配本地词典
 * 3. 在线查询有道简明词典 JSON 接口作为全量词库兜底
 */
export async function lookupWord(rawWord: string): Promise<WordLookupResult> {
  const clean = cleanClickedWord(rawWord);
  const lower = clean.toLowerCase();

  if (!lower) {
    return {
      word: rawWord,
      phonetic: "",
      meaning: "无法识别该单词",
    };
  }

  // 1. 直接命中本地词库
  if (LOCAL_DICT[lower]) {
    return {
      word: clean,
      phonetic: LOCAL_DICT[lower].phonetic,
      meaning: LOCAL_DICT[lower].meaning,
    };
  }

  // 2. 词形还原命中本地词库
  const candidates = getCandidateLemmas(lower);
  for (const lemma of candidates) {
    if (LOCAL_DICT[lemma]) {
      return {
        word: clean,
        lemma: lemma !== lower ? lemma : undefined,
        phonetic: LOCAL_DICT[lemma].phonetic,
        meaning: LOCAL_DICT[lemma].meaning,
      };
    }
  }

  // 3. 在线词典接口兜底（有道 jsonapi_s，免 Key 返回音标与简明中文释义）
  try {
    const url = `https://dict.youdao.com/jsonapi_s?doctype=json&jsonversion=4&q=${encodeURIComponent(
      lower
    )}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: AbortSignal.timeout(4000),
    });

    if (res.ok) {
      const data = await res.json();
      const wordEntry = data?.ec?.word;
      if (wordEntry) {
        const usphone = wordEntry.usphone || wordEntry.ukphone || "";
        const trs = wordEntry.trs || [];
        const meanings: string[] = [];
        for (const t of trs.slice(0, 2)) {
          const pos = t.pos ? `${t.pos} ` : "";
          const tran = t.tran || "";
          if (tran) meanings.push(`${pos}${tran}`);
        }
        if (meanings.length > 0) {
          return {
            word: clean,
            phonetic: usphone ? `/${usphone}/` : "",
            meaning: meanings.join("；"),
          };
        }
      }
    }
  } catch {
    // 忽略网络错误，进入最终翻译兜底
  }

  // 4. 最终 Google clients5 单字简明翻译兜底
  try {
    const gtxUrl = `https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl=zh-CN&q=${encodeURIComponent(
      lower
    )}`;
    const res = await fetch(gtxUrl, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      const translated =
        typeof data?.[0] === "string" ? data[0] : data?.[0]?.[0];
      if (translated) {
        return {
          word: clean,
          phonetic: "",
          meaning: translated,
        };
      }
    }
  } catch {
    // ignore
  }

  return {
    word: clean,
    phonetic: "",
    meaning: "暂无该词释义",
  };
}
