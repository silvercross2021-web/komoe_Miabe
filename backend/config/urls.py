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
        from apps.communes.models import Commune, Projet
        from apps.transactions.admin import SignalementAdmin
        from apps.communes.admin import CommuneAdmin
        from django.contrib.admin.sites import AdminSite

        # Test simple querysets
        queryset_tests = {}
        for model_name, model_class in [
            ("signalement", Signalement),
            ("voteproposition", VoteProposition),
            ("transaction", Transaction),
            ("commune", Commune),
            ("projet", Projet),
        ]:
            try:
                count = model_class.objects.count()
                queryset_tests[f"{model_name}_count"] = count

                # Try to render the first item
                if count > 0:
                    item = model_class.objects.first()
                    queryset_tests[f"{model_name}_first_str"] = str(item)[:100]

            except Exception as e:
                queryset_tests[f"{model_name}_error"] = str(e)

            # Test admin rendering
            admin_tests = {}
            for admin_name, admin_class, model_class in [
                ("signalement", SignalementAdmin, Signalement),
                ("commune", CommuneAdmin, Commune),
            ]:
                try:
                    admin_site = AdminSite()
                    instance = admin_class(model_class, admin_site)
                    queryset = instance.get_queryset(None)
                    admin_tests[f"{admin_name}_admin_queryset"] = queryset.count()
                    admin_tests[f"{admin_name}_list_display"] = instance.list_display
                except Exception as e:
                    admin_tests[f"{admin_name}_admin_error"] = str(e)

        except Exception as e:
            admin_tests["signalement_admin_error"] = str(e)

        return JsonResponse({
            "status": "ok",
            "queryset_tests": queryset_tests,
            "admin_tests": admin_tests,
        })
    except Exception as e:
        return JsonResponse({
            "status": "error",
            "error": str(e),
            "traceback": traceback.format_exc()
        }, status=500)

def simple_list_view(request):
    """Simple HTML list that bypasses Django admin"""
    try:
        from apps.transactions.models import Signalement, VoteProposition, Transaction

        signalements = Signalement.objects.all()[:10]
        votes = VoteProposition.objects.all()[:10]
        transactions = Transaction.objects.all()[:10]

        html = "<h1>Django Data List (No Admin)</h1>"
        html += "<h2>Signalements ({} total)</h2><ul>".format(Signalement.objects.count())
        for s in signalements:
            html += f"<li>{s.sujet} - {s.statut}</li>"
        html += "</ul>"

        html += "<h2>Votes ({} total)</h2><ul>".format(VoteProposition.objects.count())
        for v in votes:
            html += f"<li>{v.type_vote}</li>"
        html += "</ul>"

        html += "<h2>Transactions ({} total)</h2><ul>".format(Transaction.objects.count())
        for t in transactions:
            html += f"<li>{t.type} - {t.montant_fcfa}</li>"
        html += "</ul>"

        from django.http import HttpResponse
        return HttpResponse(html, content_type="text/html")
    except Exception as e:
        from django.http import HttpResponse
        return HttpResponse(f"<h1>Error</h1><pre>{str(e)}\n{traceback.format_exc()}</pre>",
                          content_type="text/html", status=500)

def admin_changelist_test(request):
    """Test admin changelist rendering with real authenticated user"""
    try:
        from apps.transactions.models import Signalement
        from apps.transactions.admin import SignalementAdmin
        from django.contrib import admin
        from django.test import RequestFactory

        # Use the real admin site
        admin_site = admin.site
        sig_admin = admin_site._registry[Signalement]

        # Create a request with the real user
        factory = RequestFactory()
        fake_request = factory.get('/admin/transactions/signalement/')
        fake_request.user = request.user
        fake_request.session = request.session

        # Add Django middleware attributes
        fake_request.resolver_match = None

        result = {
            "user_info": {
                "is_authenticated": request.user.is_authenticated,
                "is_staff": getattr(request.user, 'is_staff', False),
                "is_superuser": getattr(request.user, 'is_superuser', False),
            }
        }

        try:
            # Try to render changelist
            response = sig_admin.changelist_view(fake_request)

            result["changelist_view"] = {
                "status": "ok",
                "status_code": response.status_code if hasattr(response, 'status_code') else 'unknown',
                "has_render": hasattr(response, 'render')
            }
        except Exception as e:
            result["changelist_view"] = {
                "status": "error",
                "error": str(e),
                "type": type(e).__name__
            }

        return JsonResponse(result)

    except Exception as e:
        return JsonResponse({
            "status": "error",
            "error": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc()[:1000]
        }, status=500)

urlpatterns = [
    path("", home_redirect),
    path("diagnostic/", diagnostic),
    path("admin_test/", admin_changelist_test),
    path("simple_list/", simple_list_view),
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/communes/", include("apps.communes.urls")),
    path("api/transactions/", include("apps.transactions.urls")),
]
