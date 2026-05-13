from django.contrib import admin
from django.urls import path, include
from django.shortcuts import redirect
from django.http import JsonResponse
import traceback

def home_redirect(request):
    return redirect("/admin/")

def diagnostic(request):
    """Endpoint de diagnostic pour dépanner les erreurs 500"""
    try:
        from apps.transactions.models import Signalement, VoteProposition, Transaction
        result = {
            "status": "ok",
            "signalements_count": Signalement.objects.count(),
            "votes_count": VoteProposition.objects.count(),
            "transactions_count": Transaction.objects.count(),
        }

        # Test rendering __str__ methods
        result["signalements_str_test"] = []
        for s in Signalement.objects.all()[:3]:
            try:
                result["signalements_str_test"].append({
                    "id": str(s.id),
                    "str": str(s)[:100]
                })
            except Exception as e:
                result["signalements_str_test"].append({
                    "id": str(s.id),
                    "error": str(e)
                })

        return JsonResponse(result)
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc()
        }, status=500)

urlpatterns = [
    path("", home_redirect),
    path("diagnostic/", diagnostic),
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/communes/", include("apps.communes.urls")),
    path("api/transactions/", include("apps.transactions.urls")),
]
