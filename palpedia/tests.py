from django.test import TestCase
from django.urls import reverse


class PalpediaPageTests(TestCase):
    def test_palpedia_page_responds(self):
        response = self.client.get(reverse("palpedia:index"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Palworld")
        self.assertContains(response, 'id="result-count"')
        self.assertContains(response, 'aria-live="polite"')
        self.assertNotContains(response, 'id="pal-dialog"')

    def test_pal_detail_page_responds(self):
        response = self.client.get(reverse("palpedia:detail", kwargs={"pal_slug": "anubis"}))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Carregando detalhes")
        self.assertContains(response, 'data-pal-slug="anubis"')
        self.assertContains(response, 'aria-hidden="true"')
