#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Генератор СИНТЕТИЧЕСКИХ данных БСО (имена вымышленные, структура — как в проде).

Создаёт исходную точку всей цепочки данных:
  - roster.sample.csv   : эталонный список учеников (учитель/школа/класс/сектор/проект)
  - answers.sample.csv  : ОТВЕТЫ учеников по 16 заданиям (то, что они «написали»)

Дальше по цепочке:
  answers → pipeline/grade.py (сверка с ключом) → raw.sample.csv (баллы)
          → pipeline/wide_to_long.py → LongData_All → docs/ дашборд

Реальные данные учеников НИКОГДА не попадают в репозиторий — здесь всё сгенерировано.
Запуск:  python sample-data/generate_sample.py
"""
import csv
import os
import random

SEED = 20240419
N_STUDENTS = 140
HERE = os.path.dirname(os.path.abspath(__file__))
SPECS = os.path.join(HERE, "..", "specs")

AZ_FIRST = ["Айсель", "Орхан", "Нармин", "Эльвин", "Лейла", "Кямран", "Зейнаб",
            "Тогрул", "Сабина", "Рашад", "Гюнель", "Эмиль", "Фидан", "Турал",
            "Ламия", "Ниджат", "Севиндж", "Анар", "Хаяла", "Фарид"]
AZ_LAST = ["Алиев", "Мамедов", "Гусейнов", "Гасанов", "Рагимов", "Бабаев",
           "Сулейманов", "Керимов", "Исмаилов", "Ахмедов"]
RU_FIRST = ["Артём", "София", "Максим", "Анна", "Дмитрий", "Мария", "Иван",
            "Полина", "Егор", "Виктория", "Кирилл", "Алиса", "Никита",
            "Дарья", "Роман", "Ева", "Тимур", "Милана", "Глеб", "Варвара"]
RU_LAST = ["Иванов", "Петров", "Смирнов", "Кузнецов", "Соколов", "Попов",
           "Лебедев", "Новиков", "Морозов", "Волков"]
SCHOOLS = ["Школа №12", "Школа №34", "Гимназия №7", "Лицей №3"]
SEP = "|"   # разделитель под-ответов внутри одного задания


def make_name(sector, rng, seen):
    for _ in range(200):
        first = rng.choice(AZ_FIRST if sector == "AZ" else RU_FIRST)
        last = rng.choice(AZ_LAST if sector == "AZ" else RU_LAST)
        last = last + ("а" if sector == "RU" and rng.random() < 0.5 else "")
        name = f"{first} {last}"
        if name not in seen:
            seen.add(name)
            return name
    name = f"{first} {last}-{len(seen)}"
    seen.add(name)
    return name


def load_key():
    key = {}
    with open(os.path.join(SPECS, "answer_key.csv"), encoding="utf-8") as f:
        for r in csv.DictReader(f):
            key[int(r["task_no"])] = r["answers"].split(SEP)
    return key


def wrong(tok, rng):
    """Правдоподобно неверный ответ для одного под-задания."""
    if tok in (">", "<", "="):
        return rng.choice([x for x in (">", "<", "=") if x != tok])
    if tok.lstrip("-").isdigit():
        v = int(tok)
        cand = v + rng.choice([-2, -1, 1, 2, 3, -3, 5, -5, 10])
        if cand == v:
            cand = v + 1
        return str(max(0, cand))
    return tok + "?"


def main():
    rng = random.Random(SEED)
    key = load_key()
    tasks = sorted(key)               # [1..16]
    diff = {1: 0.07, 2: 0.13, 3: 0.21}  # «штраф» к шансу по сложности (см. specs)
    # сложность берём из task_topics
    tdiff = {}
    with open(os.path.join(SPECS, "task_topics.csv"), encoding="utf-8") as f:
        for r in csv.DictReader(f):
            tdiff[int(r["task_no"])] = int(r["difficulty"])

    teachers, tid = [], 0
    for sector in ("AZ", "RU"):
        for grade in (2, 3):
            for _ in range(rng.randint(3, 4)):
                tid += 1
                teachers.append({
                    "teacher": f"Учитель {tid:02d}", "school": rng.choice(SCHOOLS),
                    "klass": f"{grade}{rng.choice(['А', 'Б', 'В'])}", "sector": sector,
                    "in_project": "в проекте" if rng.random() < 0.5 else "не в проекте",
                })

    roster, answers = [], []
    seen, left = set(), N_STUDENTS
    acols = [f"a{t}" for t in tasks]
    for i, t in enumerate(teachers):
        size = min(left, max(6, round(left / (len(teachers) - i))))
        left -= size
        for _ in range(size):
            name = make_name(t["sector"], rng, seen)
            roster.append({"ФИО": name, "Учитель": t["teacher"], "Школа": t["school"],
                           "Класс": t["klass"], "Сектор": t["sector"], "Статус": t["in_project"]})
            ability = min(1.0, max(0.0, rng.gauss(0.74, 0.16)))
            row = {"ФИО": name, "Учитель": t["teacher"], "Класс": t["klass"]}
            for tno in tasks:
                p = max(0.05, min(0.98, ability - diff[tdiff[tno]]))
                toks = [tok if rng.random() < p else wrong(tok, rng) for tok in key[tno]]
                row[f"a{tno}"] = SEP.join(toks)
            answers.append(row)

    # --- Контролируемые QA-кейсы (для демонстрации reconcile.py; помечены в README) ---
    answers.append(dict(answers[0]))                       # 1) дубль (один PDF дважды)
    answers[5]["Класс"] = "3В" if not answers[5]["Класс"].startswith("3") else "2В"  # 2) расхождение класса

    with open(os.path.join(HERE, "roster.sample.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["ФИО", "Учитель", "Школа", "Класс", "Сектор", "Статус"])
        w.writeheader(); w.writerows(roster)
    with open(os.path.join(HERE, "answers.sample.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["ФИО", "Учитель", "Класс"] + acols)
        w.writeheader(); w.writerows(answers)

    print(f"Сгенерировано: {len(roster)} учеников, {len(tasks)} заданий.")
    print(f"  roster.sample.csv   ({len(roster)} строк)")
    print(f"  answers.sample.csv  ({len(answers)} строк — ответы учеников)")


if __name__ == "__main__":
    main()
