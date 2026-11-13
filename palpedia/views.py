from django.shortcuts import render


def index(request):
    return render(request, "palpedia/index.html")


def detail(request, pal_slug):
    return render(request, "palpedia/detail.html", {"pal_slug": pal_slug})
