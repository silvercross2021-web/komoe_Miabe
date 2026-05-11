from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RegisterView, MeView, UserListCreateView, UserDetailView,
    verify_journalist, verify_profession, authorize_blockchain,
    toggle_pause, UserEngagementsView,
    upload_profession_document, list_pending_documents, review_profession_document,
    list_verified_ongs, list_verified_universities, validate_university_affiliation,
    submit_certification_sentinelle, list_pending_certifications, review_certification_sentinelle
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", TokenObtainPairView.as_view(), name="auth-login"),
    path("refresh/", TokenRefreshView.as_view(), name="auth-refresh"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("users/", UserListCreateView.as_view(), name="users-list"),
    path("users/<uuid:id>/", UserDetailView.as_view(), name="users-detail"),
    path("users/<uuid:id>/engagements/", UserEngagementsView.as_view(), name="user-engagements"),
    path("users/<uuid:id>/verify-journalist/", verify_journalist, name="verify-journalist"),
    path("users/<uuid:id>/verify-profession/", verify_profession, name="verify-profession"),
    path("users/<uuid:id>/authorize-blockchain/", authorize_blockchain, name="authorize-blockchain"),

    # ─── H2: Profession Verification ────────────────────────────────────
    path("documents/upload/", upload_profession_document, name="documents-upload"),
    path("documents/pending/", list_pending_documents, name="documents-pending"),
    path("documents/<uuid:id>/review/", review_profession_document, name="documents-review"),
    path("ongs/verified/", list_verified_ongs, name="ongs-verified"),
    path("universities/verified/", list_verified_universities, name="universities-verified"),
    path("validate-university/", validate_university_affiliation, name="validate-university"),

    # ─── Certification Sentinelle ────────────────────────────────────────
    path("certification/submit/", submit_certification_sentinelle, name="certification-submit"),
    path("certification/pending/", list_pending_certifications, name="certification-pending"),
    path("certification/<uuid:user_id>/review/", review_certification_sentinelle, name="certification-review"),

    path("blockchain/toggle-pause/", toggle_pause, name="toggle-pause"),
]
