from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, ProfessionDocument, VerifiedONG, VerifiedUniversity, Engagement


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ["email", "nom", "prenom", "role", "is_active", "is_staff", "is_superuser", "date_joined"]
    list_filter = ["role", "is_active", "is_staff", "is_superuser"]
    search_fields = ["email", "nom", "prenom"]
    ordering = ["-date_joined"]
    readonly_fields = ["date_joined", "updated_at"]

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Informations personnelles", {"fields": ("nom", "prenom", "telephone", "profession")}),
        ("Rôle & Commune", {"fields": ("role", "commune")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "email_verifie")}),
        ("Dates", {"fields": ("date_joined", "updated_at", "last_login")}),
    )



@admin.register(ProfessionDocument)
class ProfessionDocumentAdmin(admin.ModelAdmin):
    list_display = ["nom_fichier", "profession", "type_document", "status"]
    ordering = ["-created_at"]
    readonly_fields = ["id", "created_at", "updated_at"]


@admin.register(VerifiedONG)
class VerifiedONGAdmin(admin.ModelAdmin):
    list_display = ["nom", "pays"]
    ordering = ["nom"]
    readonly_fields = ["id", "created_at"]


@admin.register(VerifiedUniversity)
class VerifiedUniversityAdmin(admin.ModelAdmin):
    list_display = ["nom", "pays", "type_institution"]
    ordering = ["nom"]
    readonly_fields = ["id", "created_at"]


@admin.register(Engagement)
class EngagementAdmin(admin.ModelAdmin):
    list_display = ["id", "type", "status", "date"]
    ordering = ["-date"]
    readonly_fields = ["id", "created_at", "updated_at"]
