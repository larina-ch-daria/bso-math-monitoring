#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Кросс-сверка широкой выгрузки результатов (raw) с эталонным списком (roster).

Проверяет:
  - совпадение учителей 1:1;
  - наличие каждого ученика в обоих источниках (после нормализации ФИО);
  - подозрительные дубли (один и тот же ученик с идентичными баллами);
  - расхождения класса/учителя между источниками.

Ничего не меняет — только печатает отчёт. Запуск:
  python pipeline/reconcile.py --raw sample-data/raw.sample.csv \\
                               --roster sample-data/roster.sample.csv
"""
import argparse
from collections import Counter, defaultdict

from common import normalize_name, read_csv


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--raw", required=True)
    ap.add_argument("--roster", required=True)
    args = ap.parse_args()

    raw = read_csv(args.raw)
    roster = read_csv(args.roster)

    task_cols = [c for c in raw[0].keys() if c.startswith("t") and c[1:].isdigit()]

    raw_keys = {normalize_name(r["ФИО"]) for r in raw}
    ros_keys = {normalize_name(r["ФИО"]) for r in roster}

    teachers_raw = {r["Учитель"] for r in raw}
    teachers_ros = {r["Учитель"] for r in roster}

    print("=== СВЕРКА RAW ↔ ROSTER ===")
    print(f"Учеников в raw:    {len(raw)}")
    print(f"Учеников в roster: {len(roster)}")
    print(f"Учителей в raw:    {len(teachers_raw)}")
    print(f"Учителей в roster: {len(teachers_ros)}")

    print("\n-- Учителя --")
    only_raw_t = teachers_raw - teachers_ros
    only_ros_t = teachers_ros - teachers_raw
    print("OK: все учителя совпадают 1:1" if not (only_raw_t or only_ros_t)
          else f"ТОЛЬКО в raw: {sorted(only_raw_t)}\nТОЛЬКО в roster: {sorted(only_ros_t)}")

    print("\n-- Ученики --")
    missing = ros_keys - raw_keys   # есть в списке, нет результатов
    extra = raw_keys - ros_keys     # есть результаты, нет в списке
    print(f"Нет результатов (в roster, не в raw): {len(missing)}")
    for k in sorted(missing):
        print(f"   • {k}")
    print(f"Лишние (в raw, не в roster): {len(extra)}")
    for k in sorted(extra):
        print(f"   • {k}")
    if not missing and not extra:
        print("OK: все ученики присутствуют в обоих источниках")

    print("\n-- Возможные дубли (одинаковые ФИО + идентичные баллы) --")
    sig = defaultdict(list)
    for r in raw:
        key = (normalize_name(r["ФИО"]),) + tuple(r[c] for c in task_cols)
        sig[key].append(r["Учитель"])
    dupes = {k: v for k, v in sig.items() if len(v) > 1}
    if not dupes:
        print("OK: подозрительных дублей не найдено")
    else:
        for key, teachers in dupes.items():
            print(f"   • {key[0]} — встречается у: {teachers} (одинаковые баллы → вероятно один PDF дважды)")

    print("\n-- Расхождения класса между источниками --")
    ros_by_name = {(normalize_name(r["ФИО"]), r["Учитель"]): r for r in roster}
    mism = 0
    for r in raw:
        k = (normalize_name(r["ФИО"]), r["Учитель"])
        if k in ros_by_name and r.get("Класс") and ros_by_name[k].get("Класс"):
            if r["Класс"].strip().upper() != ros_by_name[k]["Класс"].strip().upper():
                mism += 1
                print(f"   • {k[0]} ({k[1]}): raw={r['Класс']} vs roster={ros_by_name[k]['Класс']}")
    if mism == 0:
        print("OK: классы совпадают")

    print("\nГотово.")


if __name__ == "__main__":
    main()
