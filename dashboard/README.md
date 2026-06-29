# Дашборд (Google Apps Script web app)

Сюда положи файлы дашборда из рабочего диалога:

- `BsoDashboard.gs` — серверная логика: чтение `LongData_All`, расчёт метрик,
  функция `getAiAnalysis()` (провайдер Gemini/Anthropic через константу).
- `BsoDashboard.html` — UI: левая навигация (4 вкладки), Chart.js с
  `chartjs-plugin-datalabels`, разрезы Общий / AZ / RU.

**Перед коммитом:** вынеси ID таблицы, ID папок Drive и API-ключи в
**Script Properties** — в коде их быть не должно.

Заметки по граблям Chart.js (чтобы не повторять):
- каждый `<canvas>` оборачивать в контейнер `.cbox` фиксированной высоты при
  `maintainAspectRatio:false` — иначе график растёт бесконечно;
- `chartjs-plugin-datalabels` регистрировать **per-chart** в `plugins:[]`, не
  глобально (иначе тихо отваливается из-за порядка загрузки CDN);
- для двух датасетов в одной категории — helper `barPair`, иначе столбцы
  расползаются по всей ширине.
