from django.urls import path

from . import views


app_name = "core"

urlpatterns = [
    path("", views.home, name="home"),
    path("criador-de-times/", views.team_builder, name="team_builder"),
    path("api/partner-skills/", views.partner_skills, name="partner_skills"),
    path("api/pal-content/<slug:pal_slug>/", views.pal_content, name="pal_content"),
]
