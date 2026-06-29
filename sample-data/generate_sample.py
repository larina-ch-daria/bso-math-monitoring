#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Генератор СИНТЕТИЧЕСКИХ данных БСО (имена вымышленные, структура — как в проде).

Создаёт два согласованных файла:
  - roster.sample.csv : эталонный список учеников (учитель/школа/класс/сектор/проект)
  - raw.sample.csv    : "широкая" выгрузка результатов (по колонке на каждое задание t1..t16)

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

# Вымышленные имена для двух секторов
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


def make_name(sector, rng, seen):
    """Возвращает уникальное вымышленное ФИО."""
    for _ in range(200):
        first = rng.choice(AZ_FIRST if sector == "AZ" else RU_FIRST)
        last = rng.choice(AZ_LAST if sector == "AZ" else RU_LAST)
        last = last + ("а" if sector == "RU" and rng.random() < 0.5 else "")
        name = f"{first} {last}"
        if name not in seen:
            seen.add(name)
            return name
    # запасной вариант на случай исчерпания пула
    name = f"{first} {last}-{len(seen)}"
    seen.add(name)
    return name


def load_tasks():
    tasks = []
    with open(os.path.join(SPECS, "task_topics.csv"), encoding="utf-8") as f:
        for row in csv.DictReader(f):
            tasks.append({"no": int(row["task_no"]),
                          "max": int(row["max_score"]),
                          "diff": int(row["difficulty"])})
    return tasks


def main():
    rng = random.Random(SEED)
    tasks = load_tasks()

    # Учителя: ~14 групп (в проде ~52), по 2 классам и 2 секторам
    teachers = []
    tid = 0
    for sector in ("AZ", "RU"):
        for grade in (2, 3):
            for _ in range(rng.randint(3, 4)):
                tid += 1
                in_project = rng.random() < 0.5
                teachers.append({
                    "teacher": f"Учитель {tid:02d}",
                    "school": rng.choice(SCHOOLS),
                    "grade": grade,
                    "klass": f"{grade}{rng.choice(['А', 'Б', 'В'])}",
                    "sector": sector,
                    "in_project": "в проекте" if in_project else "не в проекте",
                })

    # Раскидываем учеников по группам
    roster, raw = [], []
    seen_names = set()
    students_left = N_STUDENTS
    for i, t in enumerate(teachers):
        remaining_groups = len(teachers) - i
        size = max(6, round(students_left / remaining_groups))
        size = min(size, students_left)
        students_left -= size
        for _ in range(size):
            name = make_name(t["sector"], rng, seen_names)
            roster.append({
                "ФИО": name, "Учитель": t["teacher"], "Школа": t["school"],
                "Класс": t["klass"], "Сектор": t["sector"],
                "Статус": t["in_project"],
            })
            # Профиль успеваемости ученика: 0..1, смещаем баллы заданий
            ability = min(1.0, max(0.0, rng.gauss(0.68, 0.18)))
            scores = {}
            for task in tasks:
                # сложнее задание -> ниже шанс
                penalty = (task["diff"] - 1) * 0.12
                p = max(0.05, min(0.98, ability - penalty))
                got = sum(1 for _ in range(task["max"]) if rng.random() < p)
                scores[f"t{task['no']}"] = got
            row = {"ФИО": name, "Учитель": t["teacher"], "Класс": t["klass"]}
            row.update({k: scores[k] for k in (f"t{n['no']}" for n in tasks)})
            raw.append(row)

    # --- Контролируемые кейсы для демонстрации reconcile.py (помечены в README) ---
    # 1) Дубль: тот же ученик с идентичными баллами попал в выгрузку дважды
    #    (как один и тот же PDF, обработанный два раза).
    dup = dict(raw[0])
    raw.append(dup)
    # 2) Расхождение класса между источниками для одного ученика
    #    (как «битая» строка в эталонном списке).
    raw[5]["Класс"] = "3В" if not raw[5]["Класс"].startswith("3") else "2В"

    # roster.sample.csv
    with open(os.path.join(HERE, "roster.sample.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["ФИО", "Учитель", "Школа", "Класс", "Сектор", "Статус"])
        w.writeheader()
        w.writerows(roster)

    # raw.sample.csv (широкий формат)
    task_cols = [f"t{n['no']}" for n in tasks]
    with open(os.path.join(HERE, "raw.sample.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["ФИО", "Учитель", "Класс"] + task_cols)
        w.writeheader()
        w.writerows(raw)

    print(f"Сгенерировано: {len(roster)} учеников, {len(tasks)} заданий.")
    print(f"  roster.sample.csv  ({len(roster)} строк)")
    print(f"  raw.sample.csv     ({len(raw)} строк, широкий формат)")


if __name__ == "__main__":
    main()
