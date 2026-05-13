from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["email", "nom", "prenom", "role", "commune", "is_active", "is_staff", "is_superuser", "created_at"]
    list_filter = ["role", "is_active", "is_staff", "is_superuser", "email_verifie", "is_blockchain_authorized"]
    search_fields = ["email", "nom", "prenom", "wallet_address"]
    ordering = ["-created_at"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Informations personnelles", {"fields": ("nom", "prenom", "telephone", "profession")}),
        ("Rôle & Commune", {"fields": ("role", "commune")}),
        ("Blockchain", {"fields": ("wallet_address", "is_blockchain_authorized")}),
        ("Réputation & Certification", {"fields": ("reputation_score", "certification_status", "certification_reviewed_by", "profession_verified")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "email_verifie", "groups", "user_permissions")}),
        ("Dates", {"fields": ("last_login",)}),
    )

    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": ("email", "password1", "password2", "nom", "prenom", "role", "commune", "is_staff", "is_superuser"),
        }),
    )
