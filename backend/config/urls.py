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
        from apps.transactions.admin import SignalementAdmin
        from django.contrib.admin.sites import AdminSite

        # Test simple querysets
        queryset_tests = {}
        for model_name, model_class in [
            ("signalement", Signalement),
            ("voteproposition", VoteProposition),
            ("transaction", Transaction),
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
        try:
            admin_site = AdminSite()
            sig_admin = SignalementAdmin(Signalement, admin_site)
            queryset = sig_admin.get_queryset(None)
            admin_tests["signalement_admin_queryset"] = queryset.count()

            # Try to get list_display
            admin_tests["signalement_list_display"] = sig_admin.list_display

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

def admin_changelist_test(request):
    """Test admin changelist rendering directly"""
    try:
        from apps.transactions.models import Signalement
        from apps.transactions.admin import SignalementAdmin
        from django.contrib.admin.sites import AdminSite
        from django.contrib.auth.models import User
        from django.test import RequestFactory

        # Create a fake request
        factory = RequestFactory()
        fake_request = factory.get('/admin/transactions/signalement/')

        # Create a fake user
        class FakeUser:
            def __init__(self):
                self.is_active = True
                self.is_staff = True
                self.is_superuser = True
                self.has_perm = lambda x: True

        fake_request.user = FakeUser()

        # Test the admin changelist
        admin_site = AdminSite()
        sig_admin = SignalementAdmin(Signalement, admin_site)

        # Try to render changelist
        result = sig_admin.changelist_view(fake_request)

        if hasattr(result, 'render'):
            return JsonResponse({
                "status": "ok",
                "changelist_view_status": "TemplateResponse",
                "status_code": result.status_code
            })
        else:
            return JsonResponse({
                "status": "ok",
                "changelist_view_result": str(result)[:200]
            })

    except Exception as e:
        return JsonResponse({
            "status": "error",
            "error": str(e),
            "type": type(e).__name__,
            "traceback": traceback.format_exc()[:500]
        }, status=500)

urlpatterns = [
    path("", home_redirect),
    path("diagnostic/", diagnostic),
    path("admin_test/", admin_changelist_test),
    path("admin/", admin.site.urls),
    path("api/auth/", include("apps.users.urls")),
    path("api/communes/", include("apps.communes.urls")),
    path("api/transactions/", include("apps.transactions.urls")),
]
