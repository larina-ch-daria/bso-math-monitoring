#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Собирает статический демо-дашборд docs/index.html из синтетического LongData.

Данные встраиваются прямо в HTML — страница открывается и на GitHub Pages, и
просто двойным кликом по файлу (без сервера, ключей и Google-аккаунта).

Запуск:  python docs/build.py
"""
import csv
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "sample-data", "LongData_All.sample.csv")
OUT = os.path.join(HERE, "index.html")


def load():
    rows = list(csv.DictReader(open(SRC, encoding="utf-8")))
    tasks = {}
    for r in rows:
        no = int(r["Задание"])
        tasks.setdefault(no, {"n": no, "topic": r["Топик"],
                              "d": int(r["Сложность"]), "m": int(r["Макс"])})
    tasks = [tasks[k] for k in sorted(tasks)]
    # dedupe duplicate-PDF case by (ФИО, Учитель)
    S = {}
    for r in rows:
        k = (r["ФИО"], r["Учитель"])
        s = S.setdefault(k, {"se": r["Сектор"], "st": r["Статус"],
                             "p": r["Параллель"], "lv": r["Уровень_ученика"], "sc": {}})
        s["sc"][int(r["Задание"])] = int(r["Балл"])
    students = [{"t": t, "se": s["se"], "st": s["st"], "p": s["p"],
                 "lv": s["lv"], "s": [s["sc"][x["n"]] for x in tasks]}
                for (name, t), s in S.items()]
    return {"tasks": tasks, "students": students}


DATA = load()
HTML = """<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>БСО · Мониторинг по математике — демо-дашборд</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700&display=swap" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/chartjs-plugin-datalabels/2.2.0/chartjs-plugin-datalabels.min.js"></script>
<style>
  :root{
    --bg:#FBFAFE; --card:#FFFFFF; --ink:#2B2440; --muted:#8A82A3;
    --line:#ECE8F5; --accent:#7C6BB0; --accent-soft:#EDE9F7;
    --l1:#E5736A; --l2:#E8B04B; --l3:#5BB6A3; --l4:#6C5CB8;
    --proj:#7C6BB0; --ctrl:#CDC3E8; --az:#7C6BB0; --ru:#5BB6A3;
  }
  *{box-sizing:border-box}
  body{margin:0;font-family:Montserrat,system-ui,sans-serif;background:var(--bg);color:var(--ink)}
  .wrap{display:flex;min-height:100vh}
  /* sidebar */
  .side{width:230px;flex:0 0 230px;background:var(--card);border-right:1px solid var(--line);
        padding:26px 18px;position:sticky;top:0;height:100vh}
  .brand{font-weight:700;font-size:15px;letter-spacing:.2px;line-height:1.35}
  .brand small{display:block;color:var(--muted);font-weight:500;font-size:11px;margin-top:6px;letter-spacing:.3px}
  .nav{margin-top:30px;display:flex;flex-direction:column;gap:4px}
  .nav button{all:unset;cursor:pointer;padding:11px 14px;border-radius:10px;font-size:13.5px;
        font-weight:500;color:var(--muted);transition:.15s}
  .nav button:hover{background:var(--accent-soft);color:var(--ink)}
  .nav button.on{background:var(--accent);color:#fff;font-weight:600}
  .side .foot{position:absolute;bottom:22px;left:18px;right:18px;font-size:10.5px;color:var(--muted);line-height:1.5}
  /* main */
  .main{flex:1;padding:34px 40px 60px;max-width:1180px}
  h1{font-size:21px;font-weight:700;margin:0 0 2px}
  .sub{color:var(--muted);font-size:12.5px;margin-bottom:26px}
  .kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:30px}
  .kpi{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:20px 22px}
  .kpi .v{font-size:30px;font-weight:700;letter-spacing:-.5px}
  .kpi .k{color:var(--muted);font-size:12px;font-weight:500;margin-top:4px}
  .grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
  .panel{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px 16px 8px}
  .panel h3{margin:0 0 4px;font-size:13px;font-weight:600}
  .panel .tag{font-size:10.5px;color:var(--muted);font-weight:500;text-transform:uppercase;letter-spacing:.6px}
  .cbox{position:relative;height:230px;margin-top:8px}     /* фикс. высота — иначе Chart.js растёт бесконечно */
  .cbox.tall{height:300px}
  .full{grid-column:1/-1}
  .seg{display:inline-flex;gap:4px;background:var(--accent-soft);padding:4px;border-radius:10px;margin-bottom:14px}
  .seg button{all:unset;cursor:pointer;padding:7px 14px;border-radius:7px;font-size:12.5px;font-weight:500;color:var(--muted)}
  .seg button.on{background:#fff;color:var(--ink);font-weight:600;box-shadow:0 1px 3px rgba(44,36,64,.08)}
  .view{display:none}.view.on{display:block}
  .note{background:var(--accent-soft);border-radius:12px;padding:14px 16px;font-size:12.5px;color:#5b5278;line-height:1.55;margin-top:24px}
  .note b{color:var(--accent)}
  @media(max-width:860px){.wrap{flex-direction:column}.side{width:auto;flex:none;height:auto;position:static;border-right:none;border-bottom:1px solid var(--line)}
    .side .foot{position:static;margin-top:18px}.nav{flex-direction:row;flex-wrap:wrap}.main{padding:24px 18px}
    .kpis,.grid3{grid-template-columns:1fr}}
</style>
</head>
<body>
<div class="wrap">
  <aside class="side">
    <div class="brand">БСО · Математика<small>Мониторинг 2–3 кл · AZ / RU · демо на синтетике</small></div>
    <nav class="nav" id="nav">
      <button class="on" data-v="ov">Обзор</button>
      <button data-v="diff">Решаемость по сложности</button>
      <button data-v="task">Разбор по заданиям</button>
      <button data-v="coh">Проект vs контроль</button>
    </nav>
    <div class="foot">Данные синтетические, имена вымышлены.<br>Часть кода — с ИИ-ассистентом; логика и метрики авторские.</div>
  </aside>
  <main class="main">
    <!-- ОБЗОР -->
    <section class="view on" id="ov">
      <h1>Обзор</h1>
      <div class="sub">Все ученики выборки · одна страница — без настройки и входа</div>
      <div class="kpis">
        <div class="kpi"><div class="v" id="k-n"></div><div class="k">учеников в выборке</div></div>
        <div class="kpi"><div class="v" id="k-usp"></div><div class="k">успеваемость (не «недостаточный»)</div></div>
        <div class="kpi"><div class="v" id="k-kach"></div><div class="k">качественная («базовый»+«продвинутый»)</div></div>
      </div>
      <div class="grid3">
        <div class="panel"><div class="tag">Общий</div><h3>Распределение по уровням</h3><div class="cbox"><canvas id="lv-all"></canvas></div></div>
        <div class="panel"><div class="tag">Сектор AZ</div><h3>Распределение по уровням</h3><div class="cbox"><canvas id="lv-az"></canvas></div></div>
        <div class="panel"><div class="tag">Сектор RU</div><h3>Распределение по уровням</h3><div class="cbox"><canvas id="lv-ru"></canvas></div></div>
      </div>
    </section>
    <!-- СЛОЖНОСТЬ -->
    <section class="view" id="diff">
      <h1>Решаемость по сложности</h1>
      <div class="sub">Доля учеников, набравших &gt; 50% баллов за задания данного уровня сложности</div>
      <div class="grid3">
        <div class="panel"><div class="tag">Общий</div><h3>Лёгкие · средние · сложные</h3><div class="cbox"><canvas id="df-all"></canvas></div></div>
        <div class="panel"><div class="tag">Сектор AZ</div><h3>Лёгкие · средние · сложные</h3><div class="cbox"><canvas id="df-az"></canvas></div></div>
        <div class="panel"><div class="tag">Сектор RU</div><h3>Лёгкие · средние · сложные</h3><div class="cbox"><canvas id="df-ru"></canvas></div></div>
      </div>
    </section>
    <!-- ЗАДАНИЯ -->
    <section class="view" id="task">
      <h1>Разбор по заданиям</h1>
      <div class="sub">Средний процент набранных баллов по каждому из 16 заданий</div>
      <div class="seg" id="task-seg">
        <button class="on" data-s="all">Общий</button><button data-s="AZ">AZ</button><button data-s="RU">RU</button>
      </div>
      <div class="panel full"><div class="cbox tall"><canvas id="tk"></canvas></div></div>
    </section>
    <!-- КОГОРТЫ -->
    <section class="view" id="coh">
      <h1>Проект vs контроль</h1>
      <div class="sub">Сравнение когорт «в проекте» и «не в проекте»</div>
      <div class="grid3">
        <div class="panel full"><h3>Ключевые метрики, %</h3><div class="cbox tall"><canvas id="ch-kpi"></canvas></div></div>
      </div>
      <div class="note"><b>Что показывает демо.</b> Это статическая копия живого дашборда на синтетических данных.
        В рабочей версии (Google Apps Script + Chart.js) те же метрики считаются на сервере из листа
        <code>LongData_All</code>, добавляются сравнения «весна vs осень» и ИИ-комментарий к срезу.</div>
    </section>
  </main>
</div>
<script>
const BSO = __DATA__;
const LEVELS = ["недостаточный","удовлетворительный","базовый","продвинутый"];
const LCOL = {"недостаточный":"#E5736A","удовлетворительный":"#E8B04B","базовый":"#5BB6A3","продвинутый":"#6C5CB8"};
const FONT = "Montserrat";
Chart.defaults.font.family = FONT;
Chart.defaults.color = "#8A82A3";

function metrics(list){
  const T = BSO.tasks, n = list.length;
  const lv = {"недостаточный":0,"удовлетворительный":0,"базовый":0,"продвинутый":0};
  list.forEach(s=>lv[s.lv]++);
  const usp  = n ? (n-lv["недостаточный"])/n*100 : 0;
  const kach = n ? (lv["базовый"]+lv["продвинутый"])/n*100 : 0;
  const diff = {};
  [1,2,3].forEach(d=>{
    const idx = T.map((t,i)=>({i,t})).filter(x=>x.t.d===d);
    const maxD = idx.reduce((a,x)=>a+x.t.m,0);
    let cnt=0; list.forEach(s=>{const g=idx.reduce((a,x)=>a+s.s[x.i],0); if(maxD>0 && g/maxD>0.5) cnt++;});
    diff[d] = n ? cnt/n*100 : 0;
  });
  const perTask = T.map((t,i)=>{const g=list.reduce((a,s)=>a+s.s[i],0); const mx=t.m*n; return mx? g/mx*100:0;});
  return {n,lv,usp,kach,diff,perTask};
}
const bySector = se => se==="all" ? BSO.students : BSO.students.filter(s=>s.se===se);
const R = x => Math.round(x);

// единый плагин подписей регистрируем per-chart (не глобально — иначе тихо отваливается)
const DL = window.ChartDataLabels;

function levelDoughnut(id, list){
  const m = metrics(list);
  new Chart(document.getElementById(id), {
    type:"doughnut",
    data:{labels:LEVELS, datasets:[{data:LEVELS.map(l=>m.lv[l]),
      backgroundColor:LEVELS.map(l=>LCOL[l]), borderWidth:2, borderColor:"#fff"}]},
    options:{maintainAspectRatio:false, cutout:"58%",
      plugins:{legend:{position:"bottom",labels:{boxWidth:10,font:{size:10},padding:8}},
        datalabels:{color:"#fff",font:{weight:600,size:11},
          formatter:(v,c)=>{const t=c.dataset.data.reduce((a,b)=>a+b,0); return v && v/t>0.06 ? v : "";}}}},
    plugins:[DL]});
}
function diffBars(id, list){
  const m = metrics(list);
  new Chart(document.getElementById(id), {
    type:"bar",
    data:{labels:["Лёгкие","Средние","Сложные"],
      datasets:[{data:[m.diff[1],m.diff[2],m.diff[3]],
        backgroundColor:["#9C8FCB","#7C6BB0","#5C4E96"], borderRadius:6, maxBarThickness:54}]},
    options:{maintainAspectRatio:false,
      scales:{y:{beginAtZero:true,max:100,ticks:{callback:v=>v+"%"},grid:{color:"#F1EEF8"}},x:{grid:{display:false}}},
      plugins:{legend:{display:false},
        datalabels:{anchor:"end",align:"end",color:"#5b5278",font:{weight:600,size:11},formatter:v=>R(v)+"%"}}},
    plugins:[DL]});
}
let taskChart=null;
function taskBars(se){
  const m = metrics(bySector(se));
  const labels = BSO.tasks.map(t=>"№"+t.n);
  const col = BSO.tasks.map(t=>({1:"#9C8FCB",2:"#7C6BB0",3:"#5C4E96"})[t.d]);
  if(taskChart) taskChart.destroy();
  taskChart = new Chart(document.getElementById("tk"), {
    type:"bar",
    data:{labels, datasets:[{data:m.perTask, backgroundColor:col, borderRadius:5, maxBarThickness:40}]},
    options:{maintainAspectRatio:false,
      scales:{y:{beginAtZero:true,max:100,ticks:{callback:v=>v+"%"},grid:{color:"#F1EEF8"}},x:{grid:{display:false}}},
      plugins:{legend:{display:false},
        tooltip:{callbacks:{title:(it)=>"Задание "+BSO.tasks[it[0].dataIndex].n,
          afterTitle:(it)=>BSO.tasks[it[0].dataIndex].topic,
          label:(it)=>"Средний балл: "+R(it.raw)+"%"}},
        datalabels:{anchor:"end",align:"end",color:"#5b5278",font:{weight:600,size:9},formatter:v=>R(v)+"%"}}},
    plugins:[DL]});
}
function cohortChart(){
  const proj = metrics(BSO.students.filter(s=>s.st==="в проекте"));
  const ctrl = metrics(BSO.students.filter(s=>s.st==="не в проекте"));
  new Chart(document.getElementById("ch-kpi"), {
    type:"bar",
    data:{labels:["Успеваемость","Качественная успеваемость"],
      datasets:[
        {label:"В проекте", data:[proj.usp,proj.kach], backgroundColor:"#7C6BB0", borderRadius:6, maxBarThickness:64},
        {label:"Не в проекте", data:[ctrl.usp,ctrl.kach], backgroundColor:"#CDC3E8", borderRadius:6, maxBarThickness:64}
      ]},
    options:{maintainAspectRatio:false,
      scales:{y:{beginAtZero:true,max:100,ticks:{callback:v=>v+"%"},grid:{color:"#F1EEF8"}},x:{grid:{display:false}}},
      plugins:{legend:{position:"top",labels:{boxWidth:12,font:{size:12}}},
        datalabels:{anchor:"end",align:"end",color:"#5b5278",font:{weight:600,size:11},formatter:v=>R(v)+"%"}}},
    plugins:[DL]});
}

// KPI обзора
const mAll = metrics(BSO.students);
document.getElementById("k-n").textContent = mAll.n;
document.getElementById("k-usp").textContent = R(mAll.usp)+"%";
document.getElementById("k-kach").textContent = R(mAll.kach)+"%";

// charts
levelDoughnut("lv-all", BSO.students);
levelDoughnut("lv-az",  bySector("AZ"));
levelDoughnut("lv-ru",  bySector("RU"));
diffBars("df-all", BSO.students);
diffBars("df-az",  bySector("AZ"));
diffBars("df-ru",  bySector("RU"));
taskBars("all");
cohortChart();

// nav
document.getElementById("nav").addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b) return;
  document.querySelectorAll("#nav button").forEach(x=>x.classList.toggle("on",x===b));
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("on",v.id===b.dataset.v));
});
// task sector toggle
document.getElementById("task-seg").addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b) return;
  document.querySelectorAll("#task-seg button").forEach(x=>x.classList.toggle("on",x===b));
  taskBars(b.dataset.s);
});
</script>
</body>
</html>
"""

if __name__ == "__main__":
    out = HTML.replace("__DATA__", json.dumps(DATA, ensure_ascii=False))
    open(OUT, "w", encoding="utf-8").write(out)
    print(f"docs/index.html собран: {len(out)} символов, {len(DATA['students'])} учеников")
