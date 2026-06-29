#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Общие помощники пайплайна БСО."""
import csv
import json
import os
import re

SPECS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "specs")

# Токены класса, которые иногда прилипают к ФИО в выгрузках: "2 a", "3-А", "(2б)"
_CLASS_TOKEN = re.compile(r"[\(\[]?\s*\d\s*[-\s]?[абвгабвгaАБВГ]\s*[\)\]]?\s*$", re.IGNORECASE)
_MULTISPACE = re.compile(r"\s+")


def normalize_name(name: str) -> str:
    """Приводит ФИО к виду для надёжного матчинга между источниками."""
    s = (name or "").strip()
    s = _CLASS_TOKEN.sub("", s)          # отрезаем хвост вида "2 а" / "3-А"
    s = _MULTISPACE.sub(" ", s).strip()
    return s.casefold()


def parallel_of(klass: str) -> str:
    """Параллель = первая цифра класса ('2Б' -> '2')."""
    m = re.search(r"\d", klass or "")
    return m.group(0) if m else "?"


def load_levels():
    with open(os.path.join(SPECS, "levels.json"), encoding="utf-8") as f:
        return json.load(f)["levels"]


def level_for_pct(pct: float, levels) -> str:
    for lv in levels:
        if lv["min_pct"] <= pct <= lv["max_pct"]:
            return lv["name"]
    return levels[-1]["name"]


def load_tasks():
    tasks = {}
    with open(os.path.join(SPECS, "task_topics.csv"), encoding="utf-8") as f:
        for row in csv.DictReader(f):
            tasks[int(row["task_no"])] = {
                "topic": row["topic"],
                "difficulty": int(row["difficulty"]),
                "max_score": int(row["max_score"]),
            }
    return tasks


def read_csv(path):
    with open(path, encoding="utf-8") as f:
        return list(csv.DictReader(f))
