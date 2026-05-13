from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, ProfessionDocument, VerifiedONG, VerifiedUniversity, Engagement


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "nom", "prenom", "role", "commune", "is_active", "is_staff", "is_superuser", "date_joined"]
    list_filter = ["role", "is_active", "is_staff", "is_superuser", "email_verifie", "is_blockchain_authorized"]
    search_fields = ["email", "nom", "prenom", "wallet_address"]
    ordering = ["-date_joined"]
    readonly_fields = ["date_joined", "updated_at"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Informations personnelles", {"fields": ("nom", "prenom", "telephone", "profession")}),
        ("Rôle & Commune", {"fields": ("role", "commune")}),
        ("Blockchain", {"fields": ("wallet_address", "is_blockchain_authorized")}),
        ("Réputation & Certification", {"fields": ("reputation_score", "certification_status", "certification_reviewed_by", "profession_verified")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "email_verifie", "groups", "user_permissions")}),
        ("Dates", {"fields": ("date_joined", "updated_at", "last_login")}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password1", "password2", "nom", "prenom", "role", "commune", "is_staff", "is_superuser"),
        }),
    )


@admin.register(ProfessionDocument)
class ProfessionDocumentAdmin(admin.ModelAdmin):
    list_display = ["nom_fichier", "user", "profession", "type_document", "status", "reviewed_at"]
    list_filter = ["type_document", "status", "profession"]
    search_fields = ["nom_fichier", "user__email"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(VerifiedONG)
class VerifiedONGAdmin(admin.ModelAdmin):
    list_display = ["nom", "pays", "verified_by_dgddl", "verified_at"]
    list_filter = ["pays", "verified_by_dgddl"]
    search_fields = ["nom", "email_domain"]
    ordering = ["nom"]
    readonly_fields = ["id", "created_at"]


@admin.register(VerifiedUniversity)
class VerifiedUniversityAdmin(admin.ModelAdmin):
    list_display = ["nom", "pays", "type_institution"]
    list_filter = ["pays", "type_institution"]
    search_fields = ["nom", "email_domain"]
    ordering = ["nom"]
    readonly_fields = ["id", "created_at"]


@admin.register(Engagement)
class EngagementAdmin(admin.ModelAdmin):
    list_display = ["user", "type", "status", "date"]
    list_filter = ["type", "status"]
    search_fields = ["user__email"]
    ordering = ["-date"]
    readonly_fields = ["id", "created_at", "updated_at"]
