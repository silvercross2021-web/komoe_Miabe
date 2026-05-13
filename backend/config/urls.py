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
    """Data viewer with tables - bypasses Django admin template rendering issues"""
    try:
        from apps.transactions.models import Signalement, VoteProposition, Transaction
        from apps.communes.models import Commune, Projet
        from django.http import HttpResponse

        html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Komoe - Data Viewer</title>
    <style>
        * { margin: 0; padding: 0; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; background: #f0f2f5; padding: 20px; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #2c3e50; margin: 30px 0 10px 0; padding-bottom: 10px; border-bottom: 3px solid #3498db; }
        .section { background: white; padding: 20px; margin: 20px 0; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h2 { color: #34495e; font-size: 18px; margin: 0 0 15px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #3498db; color: white; padding: 12px; text-align: left; font-weight: 600; }
        td { padding: 10px 12px; border-bottom: 1px solid #ecf0f1; }
        tr:hover { background: #f8f9fa; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 3px; font-size: 12px; font-weight: 500; }
        .badge-active { background: #d4edda; color: #155724; }
        .badge-reject { background: #f8d7da; color: #721c24; }
        .badge-validated { background: #d1ecf1; color: #0c5460; }
        .stat { display: inline-block; margin-right: 20px; color: #7f8c8d; }
        .back-link { display: inline-block; margin-bottom: 20px; padding: 8px 16px; background: #34495e; color: white; text-decoration: none; border-radius: 4px; }
        .back-link:hover { background: #2c3e50; }
    </style>
</head>
<body>
    <div class="container">
        <a href="/admin/" class="back-link">← Retour à l'administration</a>
        <h1>📊 Komoe - Visionneuse de Données</h1>
"""

        # Signalements
        sig_count = Signalement.objects.count()
        html += f'<div class="section"><h2>Signalements <span class="stat">({sig_count} total)</span></h2><table><thead><tr><th>Sujet</th><th>Statut</th><th>Prioritaire</th><th>Créé</th></tr></thead><tbody>'
        for s in Signalement.objects.all()[:100]:
            badge_class = 'badge-active' if s.statut == 'ACTIF' else ('badge-validated' if 'VALIDE' in s.statut else 'badge-reject')
            html += f'<tr><td>{s.sujet}</td><td><span class="badge {badge_class}">{s.statut}</span></td><td>{"✓" if s.is_prioritaire else ""}</td><td>{s.created_at.strftime("%d/%m/%Y %H:%M")}</td></tr>'
        html += '</tbody></table></div>'

        # Communes
        comm_count = Commune.objects.count()
        html += f'<div class="section"><h2>Communes <span class="stat">({comm_count} total)</span></h2><table><thead><tr><th>Nom</th><th>Région</th><th>Maire</th><th>Budget Annuel</th></tr></thead><tbody>'
        for c in Commune.objects.all()[:100]:
            html += f'<tr><td>{c.nom}</td><td>{c.region}</td><td>{c.maire_nom}</td><td>{c.budget_annuel_fcfa:,} FCFA</td></tr>'
        html += '</tbody></table></div>'

        # Transactions
        trans_count = Transaction.objects.count()
        html += f'<div class="section"><h2>Transactions <span class="stat">({trans_count} total)</span></h2><table><thead><tr><th>Type</th><th>Montant</th><th>Statut</th><th>Commune</th><th>Créé</th></tr></thead><tbody>'
        for t in Transaction.objects.all()[:100]:
            html += f'<tr><td>{t.type}</td><td>{t.montant_fcfa:,} FCFA</td><td><span class="badge {("badge-validated" if t.statut == "VALIDE" else "badge-reject")}">{t.statut}</span></td><td>{t.commune.nom}</td><td>{t.created_at.strftime("%d/%m/%Y %H:%M")}</td></tr>'
        html += '</tbody></table></div>'

        # Votes Proposition
        votes_count = VoteProposition.objects.count()
        html += f'<div class="section"><h2>Votes Propositions <span class="stat">({votes_count} total)</span></h2><table><thead><tr><th>Proposition</th><th>Vote</th><th>Citoyen</th></tr></thead><tbody>'
        for v in VoteProposition.objects.all()[:100]:
            html += f'<tr><td>{v.proposition.titre[:60]}</td><td><span class="badge badge-active">{v.type_vote}</span></td><td>{v.citoyen.email}</td></tr>'
        html += '</tbody></table></div>'

        # Projets
        proj_count = Projet.objects.count()
        html += f'<div class="section"><h2>Projets <span class="stat">({proj_count} total)</span></h2><table><thead><tr><th>Nom</th><th>Statut</th><th>Budget</th><th>Commune</th></tr></thead><tbody>'
        for p in Projet.objects.all()[:100]:
            html += f'<tr><td>{p.nom}</td><td>{p.statut}</td><td>{p.budget_alloue_fcfa:,} FCFA</td><td>{p.commune.nom}</td></tr>'
        html += '</tbody></table></div>'

        html += '</div></body></html>'
        return HttpResponse(html, content_type="text/html")
    except Exception as e:
        from django.http import HttpResponse
        return HttpResponse(f"<h1>Erreur</h1><pre>{str(e)}\n{traceback.format_exc()}</pre>",
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
