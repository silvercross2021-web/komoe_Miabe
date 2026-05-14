from rest_framework.permissions import BasePermission
from .models import Role, Profession


class IsDGDDL(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.DGDDL


class IsAgentFinancier(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.AGENT_FINANCIER


class IsMaire(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.MAIRE


class IsCourComptes(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == Role.COUR_COMPTES


class IsInstitutional(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_institutional_role


class IsPublicUser(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_public_role


class IsAgentOrMaire(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            Role.AGENT_FINANCIER, Role.MAIRE
        )


class IsMaireOfCommune(BasePermission):
    """Vérifie si l'utilisateur est le Maire de la commune de l'objet ciblé."""
    def has_object_permission(self, request, view, obj):
        return (
            request.user.is_authenticated and
            request.user.role == Role.MAIRE and
            request.user.commune == obj.commune
        )


# ─── Profession-based permissions (Phase 1) ──────────────────────────────────


class IsJournalisteVerified(BasePermission):
    """JOURNALISTE avec profession vérifiée."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.profession == Profession.JOURNALISTE and
            request.user.profession_verified
        )


class IsONGVerified(BasePermission):
    """ONG avec profession vérifiée."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.profession == Profession.ONG and
            request.user.profession_verified
        )


class IsBailleur(BasePermission):
    """BAILLEUR (pas de vérification spéciale requise, juste le rôle)."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.profession == Profession.BAILLEUR
        )


class IsChercheur(BasePermission):
    """CHERCHEUR avec profession vérifiée."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            request.user.profession == Profession.CHERCHEUR and
            request.user.profession_verified
        )


class IsVerifiedUser(BasePermission):
    """
    Vérifie si l'utilisateur est 'vérifié' selon les standards de la plateforme.
    - Pour les citoyens/journalistes/ONG : doit avoir la certification Sentinelle (APPROVED).
    - Pour les rôles institutionnels (Maire, Agent, DGDDL) : sont vérifiés par défaut lors de la création par admin.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # DGDDL et Cour des Comptes sont toujours autorisés
        if request.user.role in [Role.DGDDL, Role.COUR_COMPTES]:
            return True
            
        # Rôles institutionnels (Maire, Agent) sont autorisés s'ils sont rattachés à une commune
        if request.user.is_institutional_role:
            return request.user.commune is not None
            
        # Citoyens et autres rôles publics doivent être certifiés Sentinelle
        return request.user.certification_status == "APPROVED"
