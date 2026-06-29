#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Грейдер БСО: ответы ученика → баллы по ключу.

Это прозрачный, детерминированный аналог ИИ-станции проверки (grading-station/).
В проде ответы из РУКОПИСНЫХ работ извлекает Claude (vision); здесь — либо берём
готовые ответы из answers.sample.csv, либо извлекаем из примеров работ в PDF.

Правило подсчёта (одно, явное):
  • за каждое верное под-задание — 1 балл;
  • балл за работу = число совпавших с ключом под-ответов, не больше макс. балла;
  • если ответ совпал с ключом — балл засчитывается ВСЕГДА (никаких ложных нулей).

Режимы:
  # массово из таблицы ответов → баллы (широкий формат) для всего пайплайна
  python pipeline/grade.py --answers sample-data/answers.sample.csv \
        --out sample-data/raw.sample.csv

  # извлечь ответы из примеров работ в PDF и показать разбор по заданиям
  python pipeline/grade.py --from-pdf sample-data/work-samples
"""
import argparse
import csv
import os
import re

SEP = "|"
SPECS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "specs")


def load_key():
    key, mx = {}, {}
    with open(os.path.join(SPECS, "answer_key.csv"), encoding="utf-8") as f:
        for r in csv.DictReader(f):
            key[int(r["task_no"])] = [t.strip() for t in r["answers"].split(SEP)]
    with open(os.path.join(SPECS, "task_topics.csv"), encoding="utf-8") as f:
        for r in csv.DictReader(f):
            mx[int(r["task_no"])] = int(r["max_score"])
    return key, mx


def norm(tok):
    return (tok or "").strip().casefold()


def score_task(student_tokens, key_tokens, max_score):
    """Балл = число совпавших под-ответов (по позициям), не больше max_score."""
    pts = sum(1 for i, k in enumerate(key_tokens)
              if i < len(student_tokens) and norm(student_tokens[i]) == norm(k))
    return min(pts, max_score)


def grade_row(answers_by_task, key, mx):
    """answers_by_task: {task_no: [tok,...]} → {task_no: score}"""
    return {t: score_task(answers_by_task.get(t, []), key[t], mx[t]) for t in key}


# ---------- режим 1: массово из таблицы ответов ----------
def run_table(answers_path, out_path):
    key, mx = load_key()
    tasks = sorted(key)
    rows = list(csv.DictReader(open(answers_path, encoding="utf-8")))
    out = []
    for r in rows:
        ans = {t: r[f"a{t}"].split(SEP) for t in tasks}
        sc = grade_row(ans, key, mx)
        row = {"ФИО": r["ФИО"], "Учитель": r["Учитель"], "Класс": r["Класс"]}
        row.update({f"t{t}": sc[t] for t in tasks})
        out.append(row)
    cols = ["ФИО", "Учитель", "Класс"] + [f"t{t}" for t in tasks]
    with open(out_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader(); w.writerows(out)
    tot = sum(sum(r[f"t{t}"] for t in tasks) for r in out)
    print(f"Оценено {len(out)} работ × {len(tasks)} заданий → {out_path}")
    print(f"Средний балл за работу: {tot/len(out):.1f} из {sum(mx.values())}")


# ---------- режим 2: извлечь ответы из PDF и показать разбор ----------
def extract_from_pdf(path):
    """Возвращает (meta, {task_no:[tok,...]}) из примера работы в PDF."""
    import pdfplumber
    with pdfplumber.open(path) as pdf:
        text = "\n".join(p.extract_text() or "" for p in pdf.pages)
    meta = {}
    m = re.search(r"Ученик:\s*(.+)", text)
    if m: meta["ФИО"] = m.group(1).strip()
    m = re.search(r"Учитель:\s*(.+)", text)
    if m: meta["Учитель"] = m.group(1).strip()
    # каждая строка задания: "N) ... Ответ: x; y"
    ans = {}
    for line in text.splitlines():
        m = re.match(r"\s*(\d+)\)\s*.*?Ответ:\s*(.+)$", line)
        if m:
            no = int(m.group(1))
            ans[no] = [t.strip() for t in re.split(r"[;,]", m.group(2)) if t.strip()]
    return meta, ans


def run_pdf(folder):
    key, mx = load_key()
    files = sorted(f for f in os.listdir(folder) if f.lower().endswith(".pdf"))
    if not files:
        print("PDF-работ не найдено в", folder); return
    for fn in files:
        meta, ans = extract_from_pdf(os.path.join(folder, fn))
        sc = grade_row(ans, key, mx)
        total, maxtot = sum(sc.values()), sum(mx.values())
        print(f"\n=== {fn} ===")
        print(f"Ученик: {meta.get('ФИО','?')}   Учитель: {meta.get('Учитель','?')}")
        print(f"{'№':>2}  {'ответ ученика':<14} {'ключ':<14} балл")
        for t in sorted(key):
            stu = SEP.join(ans.get(t, ["—"]))
            print(f"{t:>2}  {stu:<14} {SEP.join(key[t]):<14} {sc[t]}/{mx[t]}")
        print(f"ИТОГО: {total}/{maxtot}  ({round(100*total/maxtot)}%)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--answers")
    ap.add_argument("--out")
    ap.add_argument("--from-pdf", dest="from_pdf")
    a = ap.parse_args()
    if a.from_pdf:
        run_pdf(a.from_pdf)
    elif a.answers and a.out:
        run_table(a.answers, a.out)
    else:
        ap.error("укажи --answers + --out, либо --from-pdf DIR")


if __name__ == "__main__":
    try:
        main()
    except BrokenPipeError:
        pass
