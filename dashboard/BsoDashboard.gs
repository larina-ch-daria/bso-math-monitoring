var BSO_SHEET = 'LongData_All';            // лист с длинными данными
var BSO_MAXES = {1:4,2:4,3:4,4:6,5:6,6:6,7:6,8:6,9:6,10:6,11:6,12:6,13:6,14:9,15:9,16:10};
var BSO_DIFF  = {'легкий':[1,2,3],'средний':[4,5,6,7,8,9,10,11,12,13],'высокий':[14,15,16]};
var AI_PROVIDER = 'gemini';                    // 'gemini' (ключ Google AI Studio) | 'anthropic' (ключ Anthropic)
var GEMINI_MODEL = 'gemini-3.5-flash';         // можно сменить, напр. 'gemini-3.5-pro'
var AI_MODEL  = 'claude-haiku-4-5-20251001';   // используется только при AI_PROVIDER='anthropic'

// Осенний мониторинг (24.11.2025) — финальные данные, снимок для сравнения
var AUTUMN = {"2": {"Общий": {"Да": {"n": 369, "avg": 41.5, "levels": {"Недостаточный": 124, "Минимальный": 174, "Базовый": 61, "Продвинутый": 10}, "uspevaemost": 66.4, "kachestvo": 19.2, "solvability": {"легкий": 74.8, "средний": 45.0, "высокий": 16.5}}, "Нет": {"n": 369, "avg": 37.4, "levels": {"Недостаточный": 176, "Минимальный": 134, "Базовый": 44, "Продвинутый": 15}, "uspevaemost": 52.3, "kachestvo": 16.0, "solvability": {"легкий": 68.6, "средний": 35.8, "высокий": 15.7}}}, "AZ": {"Да": {"n": 250, "avg": 40.5, "levels": {"Недостаточный": 89, "Минимальный": 115, "Базовый": 41, "Продвинутый": 5}, "uspevaemost": 64.4, "kachestvo": 18.4, "solvability": {"легкий": 72.4, "средний": 44.0, "высокий": 16.8}}, "Нет": {"n": 245, "avg": 40.0, "levels": {"Недостаточный": 100, "Минимальный": 103, "Базовый": 28, "Продвинутый": 14}, "uspevaemost": 59.2, "kachestvo": 17.1, "solvability": {"легкий": 73.9, "средний": 41.2, "высокий": 17.1}}}, "RU": {"Да": {"n": 119, "avg": 43.5, "levels": {"Недостаточный": 35, "Минимальный": 59, "Базовый": 20, "Продвинутый": 5}, "uspevaemost": 70.6, "kachestvo": 21.0, "solvability": {"легкий": 79.8, "средний": 47.1, "высокий": 16.0}}, "Нет": {"n": 124, "avg": 32.4, "levels": {"Недостаточный": 76, "Минимальный": 31, "Базовый": 16, "Продвинутый": 1}, "uspevaemost": 38.7, "kachestvo": 13.7, "solvability": {"легкий": 58.1, "средний": 25.0, "высокий": 12.9}}}}, "3": {"Общий": {"Да": {"n": 304, "avg": 52.2, "levels": {"Недостаточный": 74, "Минимальный": 113, "Базовый": 61, "Продвинутый": 56}, "uspevaemost": 75.7, "kachestvo": 38.5, "solvability": {"легкий": 67.8, "средний": 58.9, "высокий": 36.8}}, "Нет": {"n": 298, "avg": 47.8, "levels": {"Недостаточный": 85, "Минимальный": 125, "Базовый": 50, "Продвинутый": 38}, "uspevaemost": 71.5, "kachestvo": 29.5, "solvability": {"легкий": 63.4, "средний": 55.7, "высокий": 20.8}}}, "AZ": {"Да": {"n": 203, "avg": 50.4, "levels": {"Недостаточный": 61, "Минимальный": 68, "Базовый": 34, "Продвинутый": 40}, "uspevaemost": 70.0, "kachestvo": 36.5, "solvability": {"легкий": 64.5, "средний": 54.2, "высокий": 34.0}}, "Нет": {"n": 201, "avg": 46.8, "levels": {"Недостаточный": 60, "Минимальный": 87, "Базовый": 25, "Продвинутый": 29}, "uspevaemost": 70.1, "kachestvo": 26.9, "solvability": {"легкий": 61.7, "средний": 55.2, "высокий": 20.9}}}, "RU": {"Да": {"n": 101, "avg": 55.9, "levels": {"Недостаточный": 13, "Минимальный": 45, "Базовый": 27, "Продвинутый": 16}, "uspevaemost": 87.1, "kachestvo": 42.6, "solvability": {"легкий": 74.3, "средний": 68.3, "высокий": 42.6}}, "Нет": {"n": 97, "avg": 49.9, "levels": {"Недостаточный": 25, "Минимальный": 38, "Базовый": 25, "Продвинутый": 9}, "uspevaemost": 74.2, "kachestvo": 35.1, "solvability": {"легкий": 67.0, "средний": 56.7, "высокий": 20.6}}}}};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('BsoDashboard')
    .setTitle('БСО · дашборд')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** Читает LongData_All и возвращает посчитанные метрики (тот же формат, что во встроенном дашборде). */
function getBsoData() {
  var sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(BSO_SHEET);
  if (!sh) throw new Error('Не найден лист «' + BSO_SHEET + '»');
  var v = sh.getDataRange().getValues();
  if (v.length < 2) throw new Error('Лист «' + BSO_SHEET + '» пуст');

  var head = v[0].map(function (h) { return String(h).trim().toLowerCase(); });
  function col(opts) { for (var i = 0; i < head.length; i++) if (opts.indexOf(head[i]) >= 0) return i; return -1; }
  var ci = {
    u:   col(['ученик']),
    t:   col(['задание']),
    b:   col(['баллы', 'балл']),
    k:   col(['класс']),
    teh: col(['учитель']),
    lang:col(['язык', 'lang']),
    ip:  col(['в проекте'])
  };
  if (ci.u < 0 || ci.t < 0 || ci.b < 0) throw new Error('Не найдены колонки ученик/задание/баллы');

  // собираем учеников: ключ = ученик + учитель + класс
  var students = {};
  for (var r = 1; r < v.length; r++) {
    var row = v[r];
    var name = String(row[ci.u] || '').trim();
    if (!name) continue;
    var key = name + '\u0001' + String(row[ci.teh] || '') + '\u0001' + String(row[ci.k] || '');
    var s = students[key];
    if (!s) s = students[key] = {
      sc: {},
      k: String(row[ci.k] || ''),
      lang: String(ci.lang >= 0 ? row[ci.lang] : '').toUpperCase(),
      ip: String(ci.ip >= 0 ? row[ci.ip] : '').trim()
    };
    var tn = parseInt(row[ci.t], 10);
    var b = Number(row[ci.b]); if (isNaN(b)) b = 0;
    if (tn >= 1 && tn <= 16) s.sc[tn] = b;
  }
  var list = Object.keys(students).map(function (k) { return students[k]; });

  function grade(s) { var m = String(s.k).match(/\d/); return m ? m[0] : '?'; }
  function ipNorm(s) { var x = String(s.ip).toLowerCase(); return (x === 'да' || x === 'bəli' || x === 'b\u0259li') ? 'Да' : 'Нет'; }
  function bandmax(band) { var ts = BSO_DIFF[band], m = 0; for (var i = 0; i < ts.length; i++) m += BSO_MAXES[ts[i]]; return m; }
  function level(tot) { if (tot >= 81) return 'Продвинутый'; if (tot >= 61) return 'Базовый'; if (tot >= 31) return 'Минимальный'; return 'Недостаточный'; }
  function rnd(x) { return Math.round(x * 10) / 10; }

  function metrics(sub) {
    var n = sub.length;
    if (!n) return null;
    var totSum = 0, lev = { 'Недостаточный': 0, 'Минимальный': 0, 'Базовый': 0, 'Продвинутый': 0 }, i, t;
    for (i = 0; i < n; i++) { var tot = 0; for (t = 1; t <= 16; t++) tot += (sub[i].sc[t] || 0); totSum += tot; lev[level(tot)]++; }
    var tasks = [];
    for (t = 1; t <= 16; t++) {
      var sm = 0, mx = 0;
      for (i = 0; i < n; i++) { var sc = sub[i].sc[t] || 0; sm += sc; if (sc === BSO_MAXES[t]) mx++; }
      var comp = 100 * sm / (n * BSO_MAXES[t]);
      tasks.push({ t: t, completion: rnd(comp), maxed: rnd(100 * mx / n), unsolved: rnd(100 - comp) });
    }
    var solv = {};
    for (var band in BSO_DIFF) {
      var bm = bandmax(band), cnt = 0, ts = BSO_DIFF[band];
      for (i = 0; i < n; i++) { var bsum = 0; for (var j = 0; j < ts.length; j++) bsum += (sub[i].sc[ts[j]] || 0); if (bsum / bm > 0.5) cnt++; }
      solv[band] = rnd(100 * cnt / n);
    }
    return {
      n: n, avg: rnd(totSum / n), levels: lev,
      uspevaemost: rnd(100 * (lev['Минимальный'] + lev['Базовый'] + lev['Продвинутый']) / n),
      kachestvo: rnd(100 * (lev['Базовый'] + lev['Продвинутый']) / n),
      tasks: tasks, solvability: solv
    };
  }

  var out = { byGrade: {}, generated: new Date().toLocaleString('ru-RU') };
  ['2', '3'].forEach(function (g) {
    var gl = list.filter(function (s) { return grade(s) === g; });
    var secs = {};
    ['Общий', 'AZ', 'RU'].forEach(function (sec) {
      var base = gl.filter(function (s) { return sec === 'Общий' || s.lang === sec; });
      secs[sec] = {
        'Да': metrics(base.filter(function (s) { return ipNorm(s) === 'Да'; })),
        'Нет': metrics(base.filter(function (s) { return ipNorm(s) === 'Нет'; }))
      };
    });
    var diff = {}; for (var band in BSO_DIFF) diff[band] = BSO_DIFF[band].length;
    out.byGrade[g] = { sectors: secs, difficulty: diff };
  });
  out.autumn = AUTUMN;
  return out;
}

/** ИИ-анализ текущего среза. По умолчанию — Gemini (ключ GEMINI_API_KEY из Google AI Studio). */
function getAiAnalysis(promptText) {
  return (AI_PROVIDER === 'anthropic') ? anthropicAnalyze_(promptText) : geminiAnalyze_(promptText);
}

function geminiAnalyze_(promptText) {
  var key = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
  if (!key) return { ok: false, text: 'ИИ-анализ не настроен. В Apps Script: ⚙ Project Settings → Script Properties → добавь свойство GEMINI_API_KEY (ключ из Google AI Studio, aistudio.google.com → Get API key).' };
  try {
    var url = 'https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent';
    var res = UrlFetchApp.fetch(url, {
      method: 'post', contentType: 'application/json',
      headers: { 'x-goog-api-key': key },
      payload: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) return { ok: false, text: 'Ошибка Gemini (' + res.getResponseCode() + '). Проверь ключ и доступ к модели ' + GEMINI_MODEL + '.' };
    var data = JSON.parse(res.getContentText());
    var text = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts)
      text = data.candidates[0].content.parts.map(function (p) { return p.text || ''; }).join('');
    return { ok: true, text: text || 'Пустой ответ.' };
  } catch (e) {
    return { ok: false, text: 'Не удалось вызвать Gemini: ' + e };
  }
}

function anthropicAnalyze_(promptText) {
  var key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!key) return { ok: false, text: 'ИИ-анализ не настроен. Добавь ANTHROPIC_API_KEY в Script Properties (или переключи AI_PROVIDER на gemini).' };
  try {
    var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post', contentType: 'application/json',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      payload: JSON.stringify({ model: AI_MODEL, max_tokens: 700, messages: [{ role: 'user', content: promptText }] }),
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) return { ok: false, text: 'Ошибка API (' + res.getResponseCode() + ').' };
    var data = JSON.parse(res.getContentText());
    var text = (data.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('\n');
    return { ok: true, text: text };
  } catch (e) {
    return { ok: false, text: 'Не удалось вызвать ИИ: ' + e };
  }
}

function authNow() {
  // одноразовая функция: выдаёт разрешение на выход в интернет
  UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models');
}