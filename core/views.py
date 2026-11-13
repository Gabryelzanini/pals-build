from functools import lru_cache
from html.parser import HTMLParser
import re
from urllib.request import Request, urlopen

from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET


class PartnerSkillParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.skills = {}
        self.current = None
        self.capture = None
        self.capture_depth = 0

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        classes = set(attributes.get("class", "").split())

        if tag == "article" and "partner-skill" in classes:
            self.current = {"slug": "", "pal": [], "skill": [], "description": []}
            return

        if not self.current:
            return

        if self.capture:
            if tag == "br":
                self.current[self.capture].append(" ")
                return
            if tag in {"area", "base", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}:
                return
            self.capture_depth += 1
            return

        if tag == "div" and "name" in classes:
            self.capture = "skill"
        elif tag == "a" and "pal-name" in classes:
            self.capture = "pal"
            self.current["slug"] = attributes.get("href", "").rstrip("/").split("/")[-1]
        elif tag == "p" and "descr" in classes:
            self.capture = "description"

        if self.capture:
            self.capture_depth = 1

    def handle_data(self, data):
        if self.current and self.capture:
            self.current[self.capture].append(data)

    def handle_endtag(self, tag):
        if not self.current:
            return

        if self.capture:
            self.capture_depth -= 1
            if self.capture_depth == 0:
                self.capture = None

        if tag == "article":
            slug = self.current["slug"]
            if slug:
                self.skills[slug] = {
                    "pal": " ".join("".join(self.current["pal"]).split()),
                    "skill": " ".join("".join(self.current["skill"]).split()),
                    "description": " ".join("".join(self.current["description"]).split()),
                }
            self.current = None
            self.capture = None
            self.capture_depth = 0


class PalContentParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.section = None
        self.section_depth = 0
        self.item_depth = None
        self.capture = None
        self.capture_depth = 0
        self.capture_parts = []
        self.current_active = None
        self.partner = {"name": "", "description": ""}
        self.active_skills = []
        self.drops = []

    def _start_capture(self, kind):
        self.capture = kind
        self.capture_depth = 1
        self.capture_parts = []

    def _finish_capture(self):
        value = " ".join("".join(self.capture_parts).split())
        if self.capture == "partner_name":
            self.partner["name"] = value
        elif self.capture == "partner_description":
            self.partner["description"] = value
        elif self.capture == "active_name" and self.current_active is not None:
            self.current_active["name"] = value
        elif self.capture == "active_level" and self.current_active is not None:
            match = re.search(r"\d+", value)
            self.current_active["level"] = int(match.group()) if match else None
        elif self.capture == "active_description" and self.current_active is not None:
            self.current_active["description"] = value
        elif self.capture == "drop_name" and value:
            self.drops.append(value)
        self.capture = None
        self.capture_depth = 0
        self.capture_parts = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        classes = set(attributes.get("class", "").split())

        if self.section is None and tag == "div":
            if {"passive", "skills"}.issubset(classes):
                self.section = "partner"
            elif {"active", "skills"}.issubset(classes):
                self.section = "active"
            elif "drops" in classes:
                self.section = "drops"
            if self.section:
                self.section_depth = 1
                return

        if self.section is None:
            return

        if tag == "div":
            self.section_depth += 1

        if self.capture:
            if tag == "br":
                self.capture_parts.append(" ")
            elif tag not in {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}:
                self.capture_depth += 1
            return

        if self.section == "partner":
            if tag == "div" and "name" in classes:
                self._start_capture("partner_name")
            elif tag == "p":
                self._start_capture("partner_description")
        elif self.section == "active":
            if tag == "div" and "item" in classes and self.current_active is None:
                self.current_active = {"name": "", "level": None, "description": ""}
                self.item_depth = self.section_depth
            elif self.current_active is not None and tag == "div" and "name" in classes:
                self._start_capture("active_name")
            elif self.current_active is not None and tag == "div" and "level" in classes:
                self._start_capture("active_level")
            elif self.current_active is not None and tag == "p":
                self._start_capture("active_description")
        elif self.section == "drops" and tag == "div" and "name" in classes:
            self._start_capture("drop_name")

    def handle_data(self, data):
        if self.capture:
            self.capture_parts.append(data)

    def handle_endtag(self, tag):
        if self.section is None:
            return

        if self.capture:
            self.capture_depth -= 1
            if self.capture_depth == 0:
                self._finish_capture()

        if tag != "div":
            return

        if self.section == "active" and self.current_active is not None and self.section_depth == self.item_depth:
            if self.current_active.get("name"):
                self.active_skills.append(self.current_active)
            self.current_active = None
            self.item_depth = None

        self.section_depth -= 1
        if self.section_depth == 0:
            self.section = None


@lru_cache(maxsize=1)
def _partner_skills_pt_br():
    request = Request(
        "https://palworld.gg/pt-BR/partner-skills",
        headers={"User-Agent": "PalsBuild/1.0 (+local fan project)"},
    )
    with urlopen(request, timeout=6) as response:
        html = response.read().decode("utf-8")
    parser = PartnerSkillParser()
    parser.feed(html)
    return parser.skills


@lru_cache(maxsize=320)
def _pal_content_pt_br(slug):
    request = Request(
        f"https://palworld.gg/pt-BR/pal/{slug}",
        headers={"User-Agent": "PalsBuild/1.0 (+local fan project)"},
    )
    with urlopen(request, timeout=8) as response:
        html = response.read().decode("utf-8")
    parser = PalContentParser()
    parser.feed(html)
    partner = parser.partner if any(parser.partner.values()) else None
    return {"partner": partner, "activeSkills": parser.active_skills, "drops": parser.drops}


def home(request):
    return render(request, "core/home.html")


def team_builder(request):
    return render(request, "core/team_builder.html")


def _api_response(payload, *, status=200, max_age=None):
    response = JsonResponse(payload, status=status)
    if status >= 400:
        response["Cache-Control"] = "no-store"
    elif max_age is not None:
        response["Cache-Control"] = f"public, max-age={max_age}"
    return response


@require_GET
def partner_skills(request):
    try:
        return _api_response({"skills": _partner_skills_pt_br()}, max_age=3600)
    except Exception:
        return _api_response({"skills": {}, "error": "Fonte de habilidades indisponível."}, status=502)


@require_GET
def pal_content(request, pal_slug):
    if not re.fullmatch(r"[a-z0-9-]+", pal_slug):
        return _api_response({"error": "Identificador de Pal inválido."}, status=400)
    try:
        return _api_response(_pal_content_pt_br(pal_slug), max_age=86400)
    except Exception:
        return _api_response(
            {"partner": None, "activeSkills": [], "drops": [], "error": "Conteúdo em português indisponível."},
            status=502,
        )
