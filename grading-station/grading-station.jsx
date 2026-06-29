import React, { useState, useMemo, useRef } from "react";
import { Upload, FolderInput, Play, Download, AlertTriangle, CheckCircle2, Loader2, FileText, Trash2, Eye, X, ExternalLink, Copy, Check } from "lucide-react";

/* ============================================================
   СПЕКА 2 КЛАССА (ключ + рубрика + макс-балл).
   Источник: «Ответы» + «Кодификатор» (Мониторинг-апрель).
   Темы зашиты в отдельном маппинге для TASK_TOPICS, здесь
   грейдеру они не нужны — нужен только ключ и рубрика.
   ============================================================ */
const SPEC_G2 = {
  grade: 2,
  totalMax: 100,
  tasks: [
    { id: 1, max: 4, type: "выбор", title: "Сравнение чисел", v1: "47 < 74", v2: "67 > 63", rubric: "макс или 0" },
    { id: 2, max: 4, type: "выбор", title: "Произведение чисел", v1: "20", v2: "27", rubric: "макс или 0" },
    { id: 3, max: 4, type: "таблица разрядов", title: "Разрядные слагаемые", v1: "сот3 дес5 ед2 (352)", v2: "сот4 дес3 ед4 (434)", rubric: "макс или 0" },
    { id: 4, max: 6, type: "открытый", title: "Сложение с дополнением до десятка", v1: "83", v2: "93", rubric: "6=верный приём И верный ответ; 3=приём применён, но арифм. ошибка; 0=приём не применён" },
    { id: 5, max: 6, type: "открытый", title: "Вычитание в столбик", v1: "35", v2: "37", rubric: "6=верная запись в столбик И верный ответ; 3=верный алгоритм, но арифм. ошибка; 0=иначе" },
    { id: 6, max: 6, type: "выбор", title: "Взаимосвязь × и :", v1: "54 − 9 = 45", v2: "56 − 7 = 49", rubric: "макс или 0" },
    { id: 7, max: 6, type: "задача", title: "Определение сдачи", v1: "5 ман.", v2: "18 ман.", rubric: "макс или 0" },
    { id: 8, max: 6, type: "короткий", title: "Число на 1 сотню больше/меньше", v1: "470", v2: "220", rubric: "макс или 0" },
    { id: 9, max: 6, type: "короткий", title: "Число на числовой оси", v1: "250", v2: "150", rubric: "макс или 0" },
    { id: 10, max: 6, type: "короткий", title: "Чтение пиктограммы", v1: "18", v2: "18", rubric: "макс или 0" },
    { id: 11, max: 6, type: "короткий", title: "Найди уменьшаемое", v1: "61", v2: "63", rubric: "макс или 0" },
    { id: 12, max: 6, type: "короткий", title: "Манаты → гяпики", v1: "310", v2: "420", rubric: "6=верно и в гяпиках; 2=верно, но в виде 'X ман Y гяп'; 0=сумма неверна" },
    { id: 13, max: 6, type: "открытый", title: "Запись выражения к задаче", v1: "4·8=32; ответ 32 стула", v2: "5·9=45; ответ 45 роз", rubric: "Выражение: 4=верно и вычислено, 2=верно но арифм. ошибка, 0=неверно. За ответ: +2=верно с пояснением, +0=нет. Σ=6" },
    { id: 14, max: 9, type: "открытый", title: "Двухшаговая задача", v1: "17 шариков (3·8=24; 24−7=17)", v2: "14 наклеек (4·6=24; 24−10=14)", rubric: "Сумма трёх. По действиям: 4=оба действия верны, 2=одно, 0=нет. Выражением: 2=выражение и ответ верны, 1=арифм. ошибка, 0=неверно. За ответ: 3=верно с пояснением, 0=нет. Σ=4+2+3=9" },
    { id: 15, max: 9, type: "открытый", title: "Анализ таблицы расходов", v1: "четверг (30)", v2: "среда (9)", rubric: "День: 5=верно, 0=нет. Объяснение: 4=сравнил все числа/расположил по порядку, 2=неполное но верное, 0=нет. Σ=9" },
    { id: 16, max: 10, type: "открытый", title: "Задача на × и :", v1: "20 л (8:2=4; 4·5=20)", v2: "12 л (6:3=2; 2·6=12)", rubric: "Сумма трёх. По действиям: 4=оба действия верны, 2=одно/арифм. ошибка, 0=нет. Выражением: 3=выражение и ответ верны, 1=арифм. ошибка, 0=неверно. За ответ: 3=верно с пояснением, 0=нет. Σ=4+3+3=10" },
  ],
};

const SPEC_G3 = {
  grade: 3,
  totalMax: 100,
  tasks: [
    { id: 1, max: 4, type: "упорядочивание", title: "Упорядочи числа", v1: "по возрастанию: 93, 309, 390, 930", v2: "по убыванию: 504, 450, 405, 54", rubric: "макс или 0" },
    { id: 2, max: 4, type: "выбор рисунка", title: "Закрашена доля (1/4 или 1/3)", v1: "верный рисунок доли (см. бланк)", v2: "верный рисунок доли (см. бланк)", rubric: "макс или 0" },
    { id: 3, max: 4, type: "открытый", title: "Порядок действий", v1: "32 (64:8+12·2)", v2: "53 (48:6+15·3)", rubric: "4=верный ответ; 2=верные промежуточные действия, но ошибка в итоге; 0=неверный порядок действий" },
    { id: 4, max: 6, type: "открытый", title: "Сложение в столбик", v1: "856", v2: "851", rubric: "6=верная запись в столбик И верный ответ; 3=верный алгоритм, но арифм. ошибка; 0=иначе" },
    { id: 5, max: 6, type: "открытый", title: "Умножение через разрядное разложение", v1: "84 (14·6=(10+4)·6=60+24)", v2: "64 (16·4=(10+6)·4=40+24)", rubric: "6=верное разложение, частичные произведения и итог; 3=верное разложение и частичные, ошибка в сумме; 2=нашёл умножением в столбик; 0=разложение не применено" },
    { id: 6, max: 6, type: "короткий", title: "Доля числа", v1: "18", v2: "21", rubric: "макс или 0" },
    { id: 7, max: 6, type: "открытый", title: "Периметр прямоугольника", v1: "24 см (7+5+7+5)", v2: "26 см (9+4+9+4)", rubric: "6=верная формула И верный ответ; 3=формула верна, арифм. ошибка; 0=формула периметра не применена" },
    { id: 8, max: 6, type: "открытый", title: "Вычитание в столбик с переходом", v1: "464", v2: "444", rubric: "6=верная запись с переходом И верный ответ; 3=верный алгоритм, арифм. ошибка; 0=переход не применён" },
    { id: 9, max: 6, type: "выбор+обоснование", title: "Проверка деления с остатком", v1: "вариант 3) верно: 5·9+2=47", v2: "вариант 1) верно: 6·8+5=53", rubric: "макс или 0" },
    { id: 10, max: 6, type: "короткий", title: "Наиб. чётное / наим. нечётное 3-значное", v1: "998", v2: "101", rubric: "макс или 0" },
    { id: 11, max: 6, type: "короткий", title: "Уравнение", v1: "9", v2: "3", rubric: "макс или 0" },
    { id: 12, max: 6, type: "открытый", title: "Неизвестная сторона прямоугольника", v1: "4 см (20:2−6)", v2: "4 см (24:2−8)", rubric: "Решение: 4. За ответ: +2. Σ=6" },
    { id: 13, max: 6, type: "открытый", title: "Расставить скобки", v1: "20−4·(2+3)=0", v2: "30−(4·5+5)=5", rubric: "макс или 0" },
    { id: 14, max: 9, type: "открытый", title: "Комбинированная задача (3 шага)", v1: "19 бутылок (4·6=24; 24−15=9; 9+10=19)", v2: "27 книг (3·8=24; 24−11=13; 13+14=27)", rubric: "Сумма трёх. По действиям: 4=все 3 действия верны, 2=верны не все, 0=нет. Выражением: 2=выражение и ответ верны, 1=арифм. ошибка, 0=неверно. За ответ: 3=верно с пояснением, 0=нет. Σ=4+2+3=9" },
    { id: 15, max: 9, type: "открытый", title: "Анализ линейной диаграммы", v1: "3-я неделя", v2: "3-я неделя", rubric: "Ответ (неделя): 5=верно (3-я), 0=нет. Объяснение: 4=сравнение приростов между всеми неделями, 2=неполное но верное, 0=нет. Σ=9" },
    { id: 16, max: 10, type: "открытый", title: "Задача на доли и умножение", v1: "24 конфеты (12:3=4; 4·6=24)", v2: "12 конфет (15:5=3; 3·4=12)", rubric: "Сумма трёх. По действиям: 4=оба действия верны, 2=1-е верно/ошибка во 2-м, 0=нет. Выражением: 3=выражение и ответ верны, 1=арифм. ошибка, 0=неверно. За ответ: 3=верно с пояснением, 0=нет. Σ=4+3+3=10" },
  ],
};

const SPECS = { 2: SPEC_G2, 3: SPEC_G3 };

const LEVELS = [
  { name: "продвинутый", min: 81 },
  { name: "базовый", min: 61 },
  { name: "минимальный", min: 31 },
  { name: "недостаточный", min: 0 },
];
function levelOf(total) {
  for (const l of LEVELS) if (total >= l.min) return l.name;
  return "—";
}

const MODEL = "claude-sonnet-4-20250514"; // можно заменить на более сильную модель, если доступна

function buildPrompt(spec) {
  const key = spec.tasks
    .map(
      (t) =>
        `№${t.id} (макс ${t.max}, ${t.type}) ${t.title}\n   В1: ${t.v1}\n   В2: ${t.v2}\n   Балл: ${t.rubric}`
    )
    .join("\n");
  return (
`Ты опытный проверяющий. На изображениях — скан рукописной работы ученика ${spec.grade} класса по математике (мониторинг). ИГНОРИРУЙ встроенный текстовый слой PDF — он ненадёжен, читай само изображение.

ПОРЯДОК ДЕЙСТВИЙ для каждого из 16 заданий:
1) Определи ВАРИАНТ (на листе напечатано «Вариант 1» или «Вариант 2») — это критично, ключи у вариантов разные.
2) Прочитай, что РЕАЛЬНО написал ученик в ответе (поле stu).
3) Возьми верный ответ ИМЕННО этого варианта (см. ключ ниже).
4) Поставь балл:
   - Закрытые/короткие задания: ответ ученика совпал с верным ответом варианта → ставь МАКСИМУМ; не совпал → 0. ЖЁСТКОЕ ПРАВИЛО: если ответ ученика совпадает с верным — НИКОГДА не ставь 0.
   - Открытые задания: частичный балл строго по рубрике.
   - Ответ не найден/нечитаем → s = null.
5) c — твоя уверенность в чтении (0..1). Ставь c < 0.6, если почерк неоднозначен.

Самопроверка перед ответом: для каждого закрытого задания сверь stu и верный ответ — если они равны, балл обязан быть максимальным.

КЛЮЧ И РУБРИКА (В1 / В2):
${key}

Верни ТОЛЬКО JSON, без пояснений и без markdown. Поле stu — короткая запись того, что написал ученик (как видишь на листе). Верный ответ в JSON не пиши.
{"v":1,"tasks":[{"t":1,"stu":"47<74","s":4,"c":0.95},{"t":2,"stu":"25","s":0,"c":0.9}]}`
  );
}

function fileToBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(",")[1]);
    r.onerror = () => rej(new Error("Не удалось прочитать файл"));
    r.readAsDataURL(file);
  });
}

function extractJson(text) {
  let t = String(text || "").replace(/```json|```/g, "").trim();
  const a = t.indexOf("{");
  const b = t.lastIndexOf("}");
  if (a !== -1 && b !== -1) t = t.slice(a, b + 1);
  return JSON.parse(t);
}

async function gradeFile(file, spec) {
  const data64 = await fileToBase64(file);
  const body = {
    model: MODEL,
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: [
          { type: "document", source: { type: "base64", media_type: "application/pdf", data: data64 } },
          { type: "text", text: buildPrompt(spec) },
        ],
      },
    ],
  };

  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const data = await resp.json();
      const text = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      const parsed = extractJson(text);
      return parsed;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error("Ошибка проверки");
}

let _uid = 0;
const nextId = () => "row_" + ++_uid;

function cleanTeacher(seg) {
  return String(seg || "")
    .replace(/\.pdf$/i, "")
    .replace(/^\s*школа\s*№?\s*\d+\s*[-–—]\s*/i, "")
    .replace(/\(\s*(не\s*)?в\s*проекте\s*\)/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}
function parseInProject(seg) {
  const s = String(seg || "").toLowerCase();
  if (/\(\s*не\s*в\s*проекте\s*\)/.test(s)) return "Нет";
  if (/\(\s*в\s*проекте\s*\)/.test(s)) return "Да";
  return null;
}
function detectSectorFromPath(path) {
  const segs = String(path || "").split("/");
  for (const s of segs) {
    const t = s.trim().toLowerCase();
    if (/^(az|аз)\b/.test(t) || t.indexOf("az-сектор") !== -1 || t.indexOf("аз-сектор") !== -1) return "AZ";
    if (/^(ru|ру|рус)\b/.test(t) || t.indexOf("ру-сектор") !== -1 || t.indexOf("ru-сектор") !== -1) return "RU";
  }
  return null;
}
function extractSchool(seg) {
  const m = String(seg || "").match(/школа\s*№?\s*\d+/i);
  return m ? m[0].replace(/\s+/g, " ").trim() : "";
}
function cleanStudentName(fileName) {
  return String(fileName)
    .replace(/\.pdf$/i, "")
    .replace(/\s*[-–—]?\s*[23]\s*[A-Za-zА-Яа-я]\b\.?$/i, "") // убираем класс-суффикс "2C"/"3 A"
    .replace(/\s+/g, " ")
    .trim();
}
function parseClassToken(fileName) {
  const m = String(fileName).replace(/\.pdf$/i, "").match(/\b([23])\s*([A-Za-zА-Яа-я])\b/);
  if (!m) return null;
  return { grade: Number(m[1]), klass: (m[1] + m[2]).toUpperCase() };
}
function topItem(arr) {
  const c = {};
  arr.forEach((x) => { if (x) c[x] = (c[x] || 0) + 1; });
  let best = null, n = 0;
  Object.keys(c).forEach((k) => { if (c[k] > n) { n = c[k]; best = k; } });
  return best;
}

export default function GradingStation() {
  const [sector, setSector] = useState("AZ"); // AZ | RU  -> lang
  const [grade, setGrade] = useState(2);
  const [inProject, setInProject] = useState("Да");
  const [rows, setRows] = useState([]); // {id, fileName, file, name, variant, scores{}, confs{}, notes{}, status}
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [apiNote, setApiNote] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selId, setSelId] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [exportText, setExportText] = useState(null);
  const [copied, setCopied] = useState(false);
  const fileRef = useRef(null);
  const folderRef = useRef(null);
  React.useEffect(() => {
    if (folderRef.current) {
      folderRef.current.setAttribute("webkitdirectory", "");
      folderRef.current.setAttribute("directory", "");
    }
  }, []);
  React.useEffect(() => {
    if (selId == null) { setPdfUrl(""); return; }
    const row = rows.find((r) => r.id === selId);
    if (!row || !row.file) { setPdfUrl(""); return; }
    const u = URL.createObjectURL(row.file);
    setPdfUrl(u);
    return () => URL.revokeObjectURL(u);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selId]);

  const spec = SPECS[grade];
  const tasks = spec.tasks;

  function ingest(items) {
    const incoming = items.filter((it) => it.file && it.file.type === "application/pdf");
    if (!incoming.length) return;

    setRows((prev) => {
      const seen = new Set(prev.map((r) => r.key));
      const add = [];
      incoming.forEach(({ file, path }) => {
        const key = path || file.name;
        if (seen.has(key)) return;
        seen.add(key);
        const segs = String(path || file.name).split("/");
        const folderSeg = segs.length > 1 ? segs[segs.length - 2] : "";
        const tok = parseClassToken(file.name);
        add.push({
          id: nextId(),
          key,
          fileName: file.name,
          file,
          folder: folderSeg || "—",
          teacher: cleanTeacher(folderSeg),
          school: extractSchool(folderSeg),
          klass: tok ? tok.klass : "",
          name: cleanStudentName(file.name) || file.name.replace(/\.pdf$/i, ""),
          variant: 1,
          ip: parseInProject(folderSeg), // из названия папки; null = взять «по умолчанию»
          scores: {}, confs: {}, notes: {},
          status: "pending",
        });
      });
      return [...prev, ...add];
    });

    // сектор и параллель — общие; пытаемся определить из пути, иначе оставляем как есть
    const paths = incoming.map((it) => it.path || it.file.name);
    const sec = topItem(paths.map((p) => detectSectorFromPath(p)));
    if (sec) setSector(sec);

    const grades = incoming.map((it) => parseClassToken(it.file.name)).filter(Boolean).map((t) => String(t.grade));
    const uniqGrades = Array.from(new Set(grades));
    if (uniqGrades.length > 1) {
      setApiNote("В выборке работы разных параллелей (" + uniqGrades.join(", ") + "). Грейдер использует один ключ — загружай параллели по отдельности.");
    } else if (uniqGrades.length === 1) {
      const g = Number(uniqGrades[0]);
      if (SPECS[g]) setGrade(g);
      else setApiNote("Похоже, это работы " + uniqGrades[0] + " класса — ключ для него ещё не зашит.");
    }
  }

  function onFileInput(fileList) {
    ingest(Array.from(fileList).map((f) => ({ file: f, path: f.webkitRelativePath || f.name })));
  }

  async function entriesFromDataTransfer(dt) {
    const out = [];
    const walk = (entry, prefix) =>
      new Promise((resolve) => {
        if (!entry) return resolve();
        if (entry.isFile) {
          entry.file(
            (f) => { out.push({ file: f, path: (prefix ? prefix + "/" : "") + f.name }); resolve(); },
            () => resolve()
          );
        } else if (entry.isDirectory) {
          const reader = entry.createReader();
          const readBatch = () =>
            reader.readEntries(async (ents) => {
              if (!ents.length) return resolve();
              for (const e of ents) await walk(e, (prefix ? prefix + "/" : "") + entry.name);
              readBatch();
            }, () => resolve());
          readBatch();
        } else resolve();
      });

    const roots = Array.from(dt.items || [])
      .map((it) => (it.webkitGetAsEntry ? it.webkitGetAsEntry() : null))
      .filter(Boolean);
    if (roots.length) {
      for (const r of roots) await walk(r, "");
      return out;
    }
    return Array.from(dt.files || []).map((f) => ({ file: f, path: f.name }));
  }

  async function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const items = await entriesFromDataTransfer(e.dataTransfer);
    ingest(items);
  }

  async function gradeAll() {
    const pending = rows.filter((r) => r.status === "pending" || r.status === "error");
    if (!pending.length) return;
    setBusy(true);
    setApiNote("");
    setProgress({ done: 0, total: pending.length });

    let apiFailed = false;
    for (let i = 0; i < pending.length; i++) {
      const row = pending[i];
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "grading" } : r)));
      try {
        const res = await gradeFile(row.file, spec);
        const vv = res.v === 2 ? 2 : 1;
        const scores = {};
        const confs = {};
        const notes = {};
        (res.tasks || []).forEach((o) => {
          const t = Number(o.t);
          const found = tasks.find((x) => x.id === t);
          if (!found) return;
          let s = o.s;
          if (s === null || s === undefined || s === "") s = null;
          else {
            s = Math.max(0, Math.min(found.max, Number(s)));
          }
          scores[t] = s;
          confs[t] = typeof o.c === "number" ? o.c : null;
          const stu = (o.stu === null || o.stu === undefined) ? "" : String(o.stu);
          const key = vv === 2 ? found.v2 : found.v1;
          notes[t] = (stu ? "ты: " + stu : "") + (key ? "  ·  верно: " + key : "");
        });
        setRows((prev) =>
          prev.map((r) =>
            r.id === row.id
              ? {
                  ...r,
                  status: "done",
                  variant: res.v === 2 ? 2 : 1,
                  scores,
                  confs,
                  notes,
                }
              : r
          )
        );
      } catch (e) {
        apiFailed = true;
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: "error" } : r)));
      }
      setProgress({ done: i + 1, total: pending.length });
    }
    if (apiFailed)
      setApiNote(
        "Часть работ не удалось проверить автоматически. Можно повторить «Проверить» или проставить баллы вручную — таблица и выгрузка работают в любом случае."
      );
    setBusy(false);
  }

  function setScore(rowId, taskId, val, max) {
    let v = val === "" ? null : Math.max(0, Math.min(max, Number(val)));
    if (val !== "" && !isFinite(Number(val))) v = null;
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, scores: { ...r.scores, [taskId]: v } } : r))
    );
  }
  function setName(rowId, val) {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, name: val } : r)));
  }
  function setVariant(rowId, val) {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, variant: Number(val) } : r)));
  }
  function setRowProject(rowId, val) {
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, ip: val } : r)));
  }
  function setGroupField(folder, field, val) {
    setRows((prev) => prev.map((r) => (r.folder === folder ? { ...r, [field]: val } : r)));
  }
  function removeRow(rowId) {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  }

  const totals = useMemo(() => {
    const m = {};
    rows.forEach((r) => {
      let sum = 0;
      let missing = false;
      tasks.forEach((t) => {
        const s = r.scores[t.id];
        if (s === null || s === undefined) missing = true;
        else sum += Number(s);
      });
      m[r.id] = { sum, missing };
    });
    return m;
  }, [rows, tasks]);

  const unresolved = rows.reduce((acc, r) => acc + (totals[r.id]?.missing ? 1 : 0), 0);
  const lang = sector; // AZ | RU

  const groups = useMemo(() => {
    const order = [];
    const map = new Map();
    rows.forEach((r) => {
      const k = r.folder || "—";
      if (!map.has(k)) { map.set(k, []); order.push(k); }
      map.get(k).push(r);
    });
    return order.map((k) => ({ folder: k, rows: map.get(k) }));
  }, [rows]);

  function buildLongRows() {
    const out = [["ученик", "задание", "баллы", "максимум", "класс", "учитель", "язык", "в проекте"]];
    rows
      .filter((r) => r.status === "done" || Object.keys(r.scores).length)
      .forEach((r) => {
        const ip = r.ip || inProject;
        tasks.forEach((t) => {
          const s = r.scores[t.id];
          out.push([r.name, String(t.id), s === null || s === undefined ? "" : String(s), String(t.max), r.klass, r.teacher, lang, ip]);
        });
      });
    return out;
  }

  function openExport() {
    const tsv = buildLongRows().map((r) => r.join("\t")).join("\n");
    setExportText(tsv);
  }

  async function copyExport() {
    const text = exportText || "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true); setTimeout(() => setCopied(false), 1500); return;
    } catch (e) { /* fallback ниже */ }
    const ta = document.getElementById("exp-ta");
    if (ta) {
      ta.focus(); ta.select();
      try { document.execCommand("copy"); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (e) {}
    }
  }

  function downloadCsv() {
    const esc = (x) => {
      const s = String(x ?? "");
      return /[",\n\t]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
    };
    const csv = "\uFEFF" + buildLongRows().map((r) => r.map(esc).join(",")).join("\n");
    try {
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safe = (x, d) => (x || d).replace(/[\\/:*?"<>|]/g, " ").trim();
      const teachers = Array.from(new Set(rows.map((r) => r.teacher).filter(Boolean)));
      const tag = teachers.length === 1 ? safe(teachers[0], "учитель") : (grade + "класс_параллель");
      const parts = ["LongData", sector, tag].filter(Boolean);
      a.download = `${parts.join("_")}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { /* загрузка может быть заблокирована песочницей — используйте копирование */ }
  }

  const exportableRows = rows.filter((r) => Object.keys(r.scores).length);
  const missingMeta = exportableRows.filter((r) => !r.teacher || !r.klass).length;
  const canExport = exportableRows.length > 0 && missingMeta === 0;

  const confColor = (c, s) => {
    if (s === null || s === undefined) return "bg-rose-100 text-rose-700 ring-1 ring-rose-300";
    if (c !== null && c < 0.6) return "bg-amber-50 text-amber-800 ring-1 ring-amber-300";
    return "bg-white text-slate-800";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      <div
        className={`mx-auto max-w-[1200px] px-5 py-6 ${dragOver ? "outline-dashed outline-2 outline-indigo-400 outline-offset-[-8px] rounded-2xl" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
        onDrop={onDrop}
      >
        {/* Header */}
        <header className="mb-5">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Станция проверки</h1>
            <span className="text-sm text-slate-500">мониторинг · математика · {grade} класс</span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Claude ставит черновые баллы по сканам, вы проверяете спорные ячейки, на выходе — CSV для&nbsp;
            <span className="font-mono text-slate-700">LongData_All</span>.
          </p>
        </header>

        {/* Context */}
        <section className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <label className="text-sm">
              <span className="mb-1 block text-slate-500">Сектор → язык отчёта</span>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-1.5">
                <option value="AZ">AZ</option>
                <option value="RU">RU</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-500">Параллель (ключ проверки)</span>
              <select value={grade} onChange={(e) => setGrade(Number(e.target.value))} className="w-full rounded-lg border border-slate-300 px-2 py-1.5">
                <option value={2}>2 класс</option>
                <option value={3}>3 класс</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="mb-1 block text-slate-500">В проекте (по умолч., если не из папки)</span>
              <select value={inProject} onChange={(e) => setInProject(e.target.value)} className="w-full rounded-lg border border-slate-300 px-2 py-1.5">
                <option value="Да">Да</option>
                <option value="Нет">Нет</option>
              </select>
            </label>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Учитель, школа, класс и метка «в проекте» берутся из названий папок и файлов — по каждой папке отдельно (см. заголовки групп ниже). Можно загрузить сразу всю параллель.
          </p>
        </section>

        {/* Upload + actions */}
        <section className="mb-4 flex flex-wrap items-center gap-3">
          <input ref={fileRef} type="file" accept="application/pdf" multiple className="hidden" onChange={(e) => onFileInput(e.target.files)} />
          <input ref={folderRef} type="file" multiple className="hidden" onChange={(e) => onFileInput(e.target.files)} />
          <button onClick={() => folderRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <FolderInput size={16} /> Выбрать папку
          </button>
          <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <Upload size={16} /> Добавить PDF
          </button>
          <button onClick={gradeAll} disabled={busy || !rows.some((r) => r.status === "pending" || r.status === "error")} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-40">
            {busy ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
            {busy ? `Проверка ${progress.done}/${progress.total}` : "Проверить (Claude)"}
          </button>
          <button onClick={openExport} disabled={!canExport} className="inline-flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-40">
            <Download size={16} /> Экспорт
          </button>
          <span className="text-sm text-slate-500">{rows.length} работ{unresolved ? ` · ${unresolved} с пустыми ячейками` : ""}</span>
        </section>

        {apiNote && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> <span>{apiNote}</span>
          </div>
        )}

        {/* Table */}
        {rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-400">
            <FileText size={28} className="mx-auto mb-2 opacity-60" />
            Выберите папку учителя или сразу всю параллель (или перетащите сюда). Школа, учитель, класс и метка «в проекте» определяются из названий папок по каждому учителю отдельно; имена учеников — из имён файлов. Сектор и параллель — общие, задаются сверху.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-600">
                  <th className="sticky left-0 z-10 bg-slate-100 px-3 py-2 text-left font-medium">Ученик</th>
                  <th className="px-2 py-2 font-medium">Вар.</th>
                  {tasks.map((t) => (
                    <th key={t.id} className="px-1 py-2 text-center font-medium" title={`${t.title} (макс ${t.max})`}>
                      {t.id}
                    </th>
                  ))}
                  <th className="px-2 py-2 text-center font-medium">Σ</th>
                  <th className="px-2 py-2 text-center font-medium">Уровень</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => {
                  const head = g.rows[0] || {};
                  return (
                    <React.Fragment key={g.folder}>
                      <tr className="border-t-2 border-slate-200 bg-slate-50">
                        <td colSpan={tasks.length + 5} className="px-3 py-2">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                            <input value={head.teacher || ""} onChange={(e) => setGroupField(g.folder, "teacher", e.target.value)} placeholder="Учитель" className="w-52 rounded border border-slate-300 px-2 py-1 text-sm font-semibold text-slate-800" />
                            <input value={head.school || ""} onChange={(e) => setGroupField(g.folder, "school", e.target.value)} placeholder="Школа" className="w-28 rounded border border-slate-200 px-2 py-1 text-xs text-slate-600" />
                            <input value={head.klass || ""} onChange={(e) => setGroupField(g.folder, "klass", e.target.value)} placeholder="Класс (2C)" className="w-24 rounded border border-slate-200 px-2 py-1 text-xs text-slate-600" />
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              В&nbsp;проекте
                              <select value={head.ip || inProject} onChange={(e) => setGroupField(g.folder, "ip", e.target.value)} className="rounded border border-slate-300 px-1.5 py-1 text-xs">
                                <option value="Да">Да</option>
                                <option value="Нет">Нет</option>
                              </select>
                            </div>
                            <span className="text-xs text-slate-400">· {g.rows.length} работ</span>
                            {(!head.teacher || !head.klass) && <span className="text-xs text-rose-500">⚠ заполните учителя/класс</span>}
                          </div>
                        </td>
                      </tr>
                      {g.rows.map((r) => {
                        const tot = totals[r.id] || { sum: 0, missing: false };
                        return (
                    <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="sticky left-0 z-10 bg-white px-3 py-1.5">
                        <div className="flex items-center gap-2">
                          <span className="shrink-0">
                            {r.status === "grading" ? (
                              <Loader2 size={14} className="animate-spin text-indigo-500" />
                            ) : r.status === "done" ? (
                              <CheckCircle2 size={14} className="text-emerald-500" />
                            ) : r.status === "error" ? (
                              <AlertTriangle size={14} className="text-rose-500" />
                            ) : (
                              <span className="inline-block h-2 w-2 rounded-full bg-slate-300" />
                            )}
                          </span>
                          <button onClick={() => setSelId(r.id)} title="Открыть работу" className="shrink-0 text-slate-300 hover:text-indigo-600">
                            <Eye size={15} />
                          </button>
                          <input value={r.name} onChange={(e) => setName(r.id, e.target.value)} className="w-40 rounded border border-transparent px-1 py-0.5 hover:border-slate-200 focus:border-indigo-300 focus:outline-none" />
                        </div>
                        <button onClick={() => setSelId(r.id)} className="ml-6 block max-w-[180px] truncate text-left text-[11px] text-slate-400 hover:text-indigo-600 hover:underline" title={r.fileName}>{r.fileName}</button>
                      </td>
                      <td className="px-2 py-1.5 text-center">
                        <select value={r.variant} onChange={(e) => setVariant(r.id, e.target.value)} className="rounded border border-slate-200 px-1 py-0.5 text-xs">
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                        </select>
                      </td>
                      {tasks.map((t) => {
                        const s = r.scores[t.id];
                        const c = r.confs[t.id];
                        return (
                          <td key={t.id} className="px-0.5 py-1.5 text-center">
                            <input
                              value={s === null || s === undefined ? "" : s}
                              onChange={(e) => setScore(r.id, t.id, e.target.value, t.max)}
                              title={r.notes[t.id] || `макс ${t.max}`}
                              className={`w-9 rounded px-0.5 py-0.5 text-center font-mono tabular-nums ${confColor(c, s)}`}
                            />
                          </td>
                        );
                      })}
                      <td className="px-2 py-1.5 text-center font-mono font-semibold tabular-nums text-slate-900">
                        {tot.sum}
                        {tot.missing && <span className="ml-0.5 text-rose-500">*</span>}
                      </td>
                      <td className="px-2 py-1.5 text-center text-xs text-slate-600">{levelOf(tot.sum)}</td>
                      <td className="px-2 py-1.5 text-center">
                        <button onClick={() => removeRow(r.id)} className="text-slate-300 hover:text-rose-500">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-amber-50 ring-1 ring-amber-300" /> низкая уверенность — проверьте</span>
          <span className="inline-flex items-center gap-1.5"><span className="inline-block h-3 w-3 rounded bg-rose-100 ring-1 ring-rose-300" /> пусто/нечитаемо — поставьте балл</span>
          <span className="inline-flex items-center gap-1.5"><span className="text-rose-500">*</span> в сумме есть незаполненные задания</span>
        </div>
        <p className="mt-3 text-xs text-slate-400">
          Σ из 100. Это черновик для проверки человеком — итоговые проценты, уровни и сравнение с параллелью считает уже твой конвейер из CSV.
        </p>
      </div>

      {/* PDF review drawer */}
      {selId != null && (() => {
        const r = rows.find((x) => x.id === selId);
        if (!r) return null;
        const tot = totals[r.id] || { sum: 0, missing: false };
        return (
          <div className="fixed inset-0 z-50 flex">
            <div className="flex-1 bg-slate-900/40" onClick={() => setSelId(null)} />
            <div className="flex h-full w-full max-w-[860px] flex-col bg-white shadow-2xl">
              {/* header */}
              <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                <input
                  value={r.name}
                  onChange={(e) => setName(r.id, e.target.value)}
                  className="min-w-0 flex-1 rounded border border-transparent px-1 py-0.5 text-base font-semibold text-slate-900 hover:border-slate-200 focus:border-indigo-300 focus:outline-none"
                />
                <span className="text-xs text-slate-500">Вариант</span>
                <select value={r.variant} onChange={(e) => setVariant(r.id, e.target.value)} className="rounded border border-slate-300 px-1.5 py-0.5 text-sm">
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                </select>
                <span className="text-xs text-slate-500">В проекте</span>
                <select value={r.ip || inProject} onChange={(e) => setRowProject(r.id, e.target.value)} className="rounded border border-slate-300 px-1.5 py-0.5 text-sm">
                  <option value="Да">Да</option>
                  <option value="Нет">Нет</option>
                </select>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-sm font-mono font-semibold tabular-nums text-slate-900">
                  {tot.sum}{tot.missing && <span className="text-rose-500">*</span>}<span className="text-slate-400">/100</span>
                </span>
                <span className="hidden text-xs text-slate-500 sm:inline">{levelOf(tot.sum)}</span>
                {pdfUrl && (
                  <a href={pdfUrl} target="_blank" rel="noopener noreferrer" title="Открыть в новой вкладке" className="text-slate-400 hover:text-indigo-600">
                    <ExternalLink size={16} />
                  </a>
                )}
                <button onClick={() => setSelId(null)} className="text-slate-400 hover:text-slate-700">
                  <X size={18} />
                </button>
              </div>

              {/* body: PDF + scores */}
              <div className="flex min-h-0 flex-1 flex-col md:flex-row">
                <div className="min-h-[320px] flex-1 bg-slate-100">
                  {pdfUrl ? (
                    <iframe title="work" src={pdfUrl} className="h-full w-full" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-slate-400">Загрузка PDF…</div>
                  )}
                </div>
                <div className="w-full shrink-0 overflow-y-auto border-t border-slate-200 p-3 md:w-80 md:border-l md:border-t-0">
                  <div className="mb-2 text-xs font-medium text-slate-500">Баллы по заданиям</div>
                  {tasks.map((t) => {
                    const s = r.scores[t.id];
                    const c = r.confs[t.id];
                    return (
                      <div key={t.id} className="flex items-center gap-2 border-b border-slate-100 py-1.5">
                        <div className="w-5 shrink-0 text-right font-mono text-xs text-slate-400">{t.id}</div>
                        <div className="min-w-0 flex-1 text-xs leading-tight text-slate-600">
                          {t.title} <span className="text-slate-400">· макс {t.max}</span>
                          {r.notes[t.id] ? <div className="text-[11px] text-slate-500">{r.notes[t.id]}</div> : null}
                        </div>
                        <input
                          value={s === null || s === undefined ? "" : s}
                          onChange={(e) => setScore(r.id, t.id, e.target.value, t.max)}
                          className={`w-11 shrink-0 rounded px-1 py-0.5 text-center font-mono tabular-nums ${confColor(c, s)}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Export modal (copy-friendly, sandbox-safe) */}
      {exportText != null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setExportText(null)} />
          <div className="relative z-10 flex max-h-[85vh] w-full max-w-[760px] flex-col rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <div className="text-base font-semibold text-slate-900">Экспорт в LongData_All</div>
                <div className="text-xs text-slate-500">Скопируйте и вставьте в лист <span className="font-mono">LongData_All</span> (колонки разложатся сами).</div>
              </div>
              <button onClick={() => setExportText(null)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="flex items-center gap-2 px-4 py-2">
              <button onClick={copyExport} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700">
                {copied ? <Check size={15} /> : <Copy size={15} />} {copied ? "Скопировано" : "Скопировать"}
              </button>
              <button onClick={downloadCsv} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Download size={15} /> Скачать .csv
              </button>
              <span className="text-xs text-slate-400">Если скачивание заблокировано песочницей — используйте «Скопировать».</span>
            </div>
            <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
              <textarea
                id="exp-ta"
                readOnly
                value={exportText}
                onFocus={(e) => e.target.select()}
                className="h-72 w-full resize-none rounded-lg border border-slate-300 p-2 font-mono text-xs text-slate-800"
              />
              <p className="mt-2 text-xs text-slate-400">
                Первая строка — заголовки. Если вставляете в уже заполненный лист, пропустите её. Пустые ячейки баллов означают незаполненные задания — заполните их до импорта.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}