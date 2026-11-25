from unittest.mock import patch

from django.test import SimpleTestCase, TestCase
from django.urls import reverse

from .views import PalContentParser, PartnerSkillParser


class ContentParserTests(SimpleTestCase):
    def test_partner_parser_keeps_only_visible_portuguese_text(self):
        parser = PartnerSkillParser()
        parser.feed(
            '<article class="partner-skill">'
            '<div class="name">Perseguidor dos Sonhos</div>'
            '<a class="pal-name" href="/pt-BR/pal/daedream">Daedream</a>'
            '<p class="descr">Ataques do elemento <img alt="Dark">Escuridão.</p>'
            '</article>'
        )
        skill = parser.skills["daedream"]
        self.assertEqual(skill["skill"], "Perseguidor dos Sonhos")
        self.assertEqual(skill["description"], "Ataques do elemento Escuridão.")
        self.assertNotIn("Dark", skill["description"])

    def test_pal_content_parser_extracts_partner_active_skill_and_drop(self):
        parser = PalContentParser()
        parser.feed(
            '<div class="passive skills"><div class="name">Vendaval Relâmpago</div>'
            '<div class="content"><p>Você pode montar nas suas costas.</p></div>'
            '<div class="name">Outra informação</div><p>Texto que não pertence à habilidade.</p></div>'
            '<div class="active skills"><div class="item"><div class="name">Tiro de Faísca</div>'
            '<div class="level">- Lv 7</div><div class="content"><p>Dispara uma esfera elétrica.</p></div>'
            '<div class="name">Alcance:</div>'
            '</div></div><div class="drops"><div class="name">Couro</div></div>'
        )
        self.assertEqual(parser.active_skills[0]["name"], "Tiro de Faísca")
        self.assertEqual(parser.partner["name"], "Vendaval Relâmpago")
        self.assertEqual(parser.partner["description"], "Você pode montar nas suas costas.")
        self.assertEqual(parser.active_skills[0]["level"], 7)
        self.assertEqual(parser.active_skills[0]["description"], "Dispara uma esfera elétrica.")
        self.assertEqual(parser.drops, ["Couro"])


class HomePageTests(TestCase):
    def test_home_page_responds(self):
        response = self.client.get(reverse("core:team_builder"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Seu universo")
        self.assertContains(response, "Palworld")


class TeamBuilderPageTests(TestCase):
    def test_team_builder_page_responds(self):
        response = self.client.get(reverse("core:team_builder"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Criador de times")
        self.assertContains(response, "Monte seu time")

    @patch("core.views._partner_skills_pt_br")
    def test_partner_skills_endpoint(self, partner_skills_mock):
        partner_skills_mock.return_value = {
            "cattiva": {"pal": "Cattiva", "skill": "Quem Não Tem Cão", "description": "Efeito."}
        }
        response = self.client.get(reverse("core:partner_skills"))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["skills"]["cattiva"]["pal"], "Cattiva")
        self.assertEqual(response["Cache-Control"], "public, max-age=3600")

    @patch("core.views._pal_content_pt_br")
    def test_pal_content_endpoint(self, pal_content_mock):
        pal_content_mock.return_value = {
            "partner": {"name": "Vendaval Relâmpago", "description": "Você pode montar nas suas costas."},
            "activeSkills": [],
            "drops": ["Couro"],
        }
        response = self.client.get(reverse("core:pal_content", kwargs={"pal_slug": "univolt"}))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["partner"]["name"], "Vendaval Relâmpago")
        self.assertEqual(response["Cache-Control"], "public, max-age=86400")

    def test_pal_content_rejects_invalid_slug(self):
        response = self.client.get(reverse("core:pal_content", kwargs={"pal_slug": "slug_invalido"}))
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response["Cache-Control"], "no-store")

    @patch("core.views._pal_content_pt_br", side_effect=TimeoutError)
    def test_pal_content_does_not_cache_external_failure(self, _pal_content_mock):
        response = self.client.get(reverse("core:pal_content", kwargs={"pal_slug": "univolt"}))
        self.assertEqual(response.status_code, 502)
        self.assertEqual(response["Cache-Control"], "no-store")

    def test_api_endpoints_only_accept_get(self):
        response = self.client.post(reverse("core:partner_skills"))
        self.assertEqual(response.status_code, 405)

