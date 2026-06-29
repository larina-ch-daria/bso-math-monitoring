#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Конвертация результатов БСО из «широкого» формата в «длинный» (LongData_All).

Вход:
  --raw     широкая выгрузка (по колонке t1..t16 на задание)
  --roster  эталонный список (сектор/язык, статус «в проекте / не в проекте»)
Выход:
  --out     длинный CSV: одна строка на (ученик × задание), обогащённая метаданными.

Каждая строка несёт: метаданные ученика (учитель/школа/класс/параллель/сектор/статус),
данные задания (номер/топик/сложность/балл/макс) и итоговый уровень ученика по работе.

Запуск:
  python pipeline/wide_to_long.py --raw sample-data/raw.sample.csv \\
        --roster sample-data/roster.sample.csv --out sample-data/LongData_All.sample.csv
"""
import argparse
import csv

from common import (load_levels, load_tasks, level_for_pct, normalize_name,
                    parallel_of, read_csv)

LONG_COLUMNS = [
    "ФИО", "Учитель", "Школа", "Класс", "Параллель", "Сектор", "Статус",
    "Задание", "Топик", "Сложность", "Балл", "Макс", "Уровень_ученика",
]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", required=True)
    ap.add_argument("--roster", required=True)
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    raw = read_csv(args.raw)
    roster = read_csv(args.roster)
    tasks = load_tasks()
    levels = load_levels()

    ros_by_name = {normalize_name(r["ФИО"]): r for r in roster}
    task_cols = sorted(
        [c for c in raw[0].keys() if c.startswith("t") and c[1:].isdigit()],
        key=lambda c: int(c[1:]),
    )

    rows = []
    n_skipped = 0
    for r in raw:
        key = normalize_name(r["ФИО"])
        meta = ros_by_name.get(key)
        if meta is None:
            n_skipped += 1  # нет в эталонном списке — не обогащаем (см. reconcile)
            continue

        # Итоговый уровень ученика по всей работе
        total = sum(int(r[c]) for c in task_cols)
        total_max = sum(tasks[int(c[1:])]["max_score"] for c in task_cols)
        pct = round(100 * total / total_max) if total_max else 0
        level = level_for_pct(pct, levels)

        klass = meta.get("Класс") or r.get("Класс", "")
        for c in task_cols:
            no = int(c[1:])
            spec = tasks[no]
            rows.append({
                "ФИО": r["ФИО"].strip(),
                "Учитель": meta["Учитель"],
                "Школа": meta.get("Школа", ""),
                "Класс": klass,
                "Параллель": parallel_of(klass),
                "Сектор": meta.get("Сектор", ""),
                "Статус": meta.get("Статус", ""),
                "Задание": no,
                "Топик": spec["topic"],
                "Сложность": spec["difficulty"],
                "Балл": int(r[c]),
                "Макс": spec["max_score"],
                "Уровень_ученика": level,
            })

    with open(args.out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=LONG_COLUMNS)
        w.writeheader()
        w.writerows(rows)

    n_students = len(rows) // len(task_cols) if task_cols else 0
    print(f"LongData_All готов: {len(rows)} строк ({n_students} учеников × {len(task_cols)} заданий)")
    if n_skipped:
        print(f"Пропущено учеников без записи в roster: {n_skipped} (разберите через reconcile.py)")
    print(f"Записано в: {args.out}")


if __name__ == "__main__":
    main()
