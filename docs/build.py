#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Собирает статический демо-дашборд docs/index.html из синтетического LongData.

Метрики считаются в той же схеме, что отдаёт боевой getBsoData() (Apps Script):
  byGrade[2|3].sectors[Общий|AZ|RU][Да|Нет] = {n, avg, levels, uspevaemost,
  kachestvo, tasks[16], solvability}, plus difficulty (пирог) и autumn (срез
  для сравнения динамики). Данные встраиваются в шаблон dashboard_template.html,
  серверные вызовы заменены на встроенные данные и оффлайн-образец ИИ-анализа.

Страница открывается на GitHub Pages и просто двойным кликом — без сервера и ключей.
Запуск:  python docs/build.py
"""
import csv
import json
import os
import random

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "sample-data", "LongData_All.sample.csv")
TPL = os.path.join(HERE, "dashboard_template.html")
OUT = os.path.join(HERE, "index.html")

DIFF_BANDS = {"легкий": [1, 2, 3],
              "средний": [4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
              "высокий": [14, 15, 16]}
LEVEL_NAMES = ["Недостаточный", "Минимальный", "Базовый", "Продвинутый"]


def level(pct):
    if pct >= 81: return "Продвинутый"
    if pct >= 61: return "Базовый"
    if pct >= 31: return "Минимальный"
    return "Недостаточный"


def rnd(x):
    return round(x * 10) / 10


def load_students():
    rows = list(csv.DictReader(open(SRC, encoding="utf-8")))
    maxes = {}
    for r in rows:
        maxes[int(r["Задание"])] = int(r["Макс"])
    S = {}
    for r in rows:
        k = (r["ФИО"], r["Учитель"], r["Класс"])
        s = S.setdefault(k, {"par": r["Параллель"],
                             "sec": r["Сектор"],
                             "ip": "Да" if r["Статус"].strip() == "в проекте" else "Нет",
                             "sc": {}})
        s["sc"][int(r["Задание"])] = int(r["Балл"])
    return list(S.values()), maxes


def metrics(sub, maxes):
    n = len(sub)
    if not n:
        return None
    maxsum = sum(maxes.values())
    lev = {x: 0 for x in LEVEL_NAMES}
    totpct_sum = 0
    for s in sub:
        tot = sum(s["sc"].get(t, 0) for t in maxes)
        pct = 100 * tot / maxsum
        totpct_sum += pct
        lev[level(pct)] += 1
    tasks = []
    for t in sorted(maxes):
        sm = sum(s["sc"].get(t, 0) for s in sub)
        mx = sum(1 for s in sub if s["sc"].get(t, 0) == maxes[t])
        comp = 100 * sm / (n * maxes[t])
        tasks.append({"t": t, "completion": rnd(comp), "maxed": rnd(100 * mx / n),
                      "unsolved": rnd(100 - comp)})
    solv = {}
    for band, ts in DIFF_BANDS.items():
        bm = sum(maxes[t] for t in ts)
        cnt = sum(1 for s in sub if sum(s["sc"].get(t, 0) for t in ts) / bm > 0.5)
        solv[band] = rnd(100 * cnt / n)
    return {"n": n, "avg": rnd(totpct_sum / n), "levels": lev,
            "uspevaemost": rnd(100 * (lev["Минимальный"] + lev["Базовый"] + lev["Продвинутый"]) / n),
            "kachestvo": rnd(100 * (lev["Базовый"] + lev["Продвинутый"]) / n),
            "tasks": tasks, "solvability": solv}


def derive_autumn(spring):
    """Синтетический ранний срез: ученики к весне подросли, проект — заметнее.
    Деградируем весенние метрики на правдоподобную дельту (детерминированно)."""
    rng = random.Random(7)
    out = {}
    for g, secs in spring.items():
        out[g] = {}
        for sec, ips in secs.items():
            out[g][sec] = {}
            for ip, m in ips.items():
                if not m:
                    out[g][sec][ip] = None
                    continue
                # проект растёт сильнее → осенью был ниже
                drop = (11 if ip == "Да" else 7) + rng.uniform(-1.5, 1.5)
                clamp = lambda x: max(0, rnd(x))
                out[g][sec][ip] = {
                    "n": m["n"],
                    "avg": clamp(m["avg"] - drop),
                    "levels": m["levels"],
                    "uspevaemost": clamp(m["uspevaemost"] - drop - 2),
                    "kachestvo": clamp(m["kachestvo"] - drop * 0.7),
                    "tasks": m["tasks"],
                    "solvability": {b: clamp(m["solvability"][b] - drop) for b in m["solvability"]},
                }
    return out


def main():
    students, maxes = load_students()
    spring = {}
    for g in ("2", "3"):
        gl = [s for s in students if s["par"] == g]
        secs = {}
        for sec in ("Общий", "AZ", "RU"):
            base = [s for s in gl if sec == "Общий" or s["sec"] == sec]
            secs[sec] = {
                "Да": metrics([s for s in base if s["ip"] == "Да"], maxes),
                "Нет": metrics([s for s in base if s["ip"] == "Нет"], maxes),
            }
        spring[g] = {"sectors": secs,
                     "difficulty": {b: len(DIFF_BANDS[b]) for b in DIFF_BANDS}}

    data = {
        "byGrade": spring,
        "autumn": derive_autumn({g: spring[g]["sectors"] for g in spring}),
        "generated": "апрель 2026 (синтетика)",
    }

    tpl = open(TPL, encoding="utf-8").read()
    out = tpl.replace("__DEMO_DATA__", json.dumps(data, ensure_ascii=False))
    open(OUT, "w", encoding="utf-8").write(out)
    # краткая сводка
    o2 = spring["2"]["sectors"]["Общий"]
    o3 = spring["3"]["sectors"]["Общий"]
    print(f"docs/index.html собран: {len(out)} символов")
    print(f"  2 класс · общий: в проекте n={o2['Да']['n']} avg={o2['Да']['avg']} "
          f"успев={o2['Да']['uspevaemost']}% | контроль n={o2['Нет']['n']} avg={o2['Нет']['avg']}")
    print(f"  3 класс · общий: в проекте n={o3['Да']['n']} avg={o3['Да']['avg']} "
          f"успев={o3['Да']['uspevaemost']}% | контроль n={o3['Нет']['n']} avg={o3['Нет']['avg']}")


if __name__ == "__main__":
    main()
