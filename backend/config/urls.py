from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect

def home_redirect(request):
    return redirect("/admin/")

urlpatterns = [
    path("", home_redirect),
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/communes/", include("apps.communes.urls")),
    path("api/transactions/", include("apps.transactions.urls")),
]
