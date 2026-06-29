#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Рендерит несколько ПРИМЕРОВ работ учеников в PDF — «вход» всей цепочки данных.

Это синтетические работы (вымышленные имена): то, что в проде сканируется и
поступает на ИИ-станцию проверки. Текст в PDF — настоящий (выделяется), поэтому
pipeline/grade.py --from-pdf может извлечь ответы и показать разбор.

Запуск:  python sample-data/render_work_samples.py
"""
import csv
import os

from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

HERE = os.path.dirname(os.path.abspath(__file__))
SPECS = os.path.join(HERE, "..", "specs")
OUT = os.path.join(HERE, "work-samples")
SEP = "|"

pdfmetrics.registerFont(TTFont("DV", "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"))
pdfmetrics.registerFont(TTFont("DVB", "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"))


def load(path):
    return list(csv.DictReader(open(path, encoding="utf-8")))


def main():
    key = {int(r["task_no"]): {"p": r["prompts"].split(SEP), "topic": ""}
           for r in load(os.path.join(SPECS, "answer_key.csv"))}
    topics = {int(r["task_no"]): r["topic"] for r in load(os.path.join(SPECS, "task_topics.csv"))}
    answers = load(os.path.join(HERE, "answers.sample.csv"))
    roster = {r["ФИО"]: r for r in load(os.path.join(HERE, "roster.sample.csv"))}

    # выберем 3 разных по силе ученика (по числу непустых верных-похожих ответов — грубо по сумме цифр)
    def rough(r):
        return sum(len(r[f"a{t}"]) for t in key)
    uniq = []
    seen = set()
    for r in answers:
        if r["ФИО"] in seen:
            continue
        seen.add(r["ФИО"]); uniq.append(r)
    uniq.sort(key=rough)
    picks = [uniq[int(len(uniq) * q)] for q in (0.25, 0.55, 0.85)]

    for idx, stu in enumerate(picks, 1):
        meta = roster.get(stu["ФИО"], {})
        path = os.path.join(OUT, f"work_{idx:02d}.pdf")
        c = canvas.Canvas(path, pagesize=A4)
        W, H = A4
        y = H - 50
        c.setFont("DVB", 15); c.drawString(40, y, "БСО · Математика — апрель"); y -= 22
        c.setFont("DV", 10)
        c.drawString(40, y, f"Школа: {meta.get('Школа','—')}    Класс: {stu['Класс']}    "
                            f"Сектор: {meta.get('Сектор','—')}"); y -= 15
        c.drawString(40, y, f"Учитель: {stu['Учитель']}"); y -= 15
        c.drawString(40, y, f"Ученик: {stu['ФИО']}"); y -= 22
        c.setStrokeColorRGB(.8, .78, .88); c.line(40, y, W - 40, y); y -= 18

        for t in sorted(key):
            prompts = key[t]["p"]
            stud = stu[f"a{t}"].split(SEP)
            label = f"{t}) {topics[t]}: " + "  ".join(prompts) + "   Ответ: "
            c.setFont("DV", 9.5); c.setFillColorRGB(.15, .12, .25)
            c.drawString(46, y, label)
            w = c.stringWidth(label, "DV", 9.5)
            c.setFont("DVB", 9.5); c.setFillColorRGB(.18, .35, .70)   # «вписанный» ответ
            c.drawString(46 + w, y, "; ".join(stud))
            c.setFillColorRGB(0, 0, 0)
            y -= 17
            if y < 60:
                c.showPage(); y = H - 50
        c.save()
        print(f"  {os.path.basename(path)}  — {stu['ФИО']} ({stu['Класс']}, {meta.get('Сектор','?')})")

    print(f"Готово: {len(picks)} примера работ в {OUT}/")


if __name__ == "__main__":
    main()
