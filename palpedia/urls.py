from django.urls import path

from . import views


app_name = "palpedia"

urlpatterns = [
    path("", views.index, name="index"),
    path("<slug:pal_slug>/", views.detail, name="detail"),
]
