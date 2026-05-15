from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import User, Role, Profession, PUBLIC_ROLES, Engagement, ProfessionDocument
from ..communes.models import Commune


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    professions = serializers.ListField(child=serializers.CharField(), required=False, write_only=True)
    commune = serializers.PrimaryKeyRelatedField(queryset=Commune.objects.all(), required=False, allow_null=True)

    class Meta:
        model = User
        fields = ["email", "nom", "prenom", "role", "profession", "professions", "password", "password_confirm",
                  "telephone", "media_organisation", "commune"]
        extra_kwargs = {
            "role": {"required": False},
            "profession": {"required": False},
            "professions": {"required": False},
            "commune": {"required": False},
        }

    def validate_role(self, value):
        if value not in PUBLIC_ROLES:
            raise serializers.ValidationError(
                "L'inscription libre est réservée aux citoyens. "
                "Les comptes institutionnels sont créés par la DGDDL."
            )
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password": "Les mots de passe ne correspondent pas."})
        # Par défaut : rôle CITOYEN
        attrs.setdefault("role", Role.CITOYEN)

        # La commune est OBLIGATOIRE pour les citoyens
        commune = attrs.get("commune")
        if not commune:
            raise serializers.ValidationError({"commune": "La sélection d'une commune est obligatoire."})

        # Valider les professions si fourni
        professions = attrs.get("professions", [])
        if professions:
            valid_professions = {p[0] for p in Profession.choices}
            for prof in professions:
                if prof not in valid_professions:
                    raise serializers.ValidationError({"professions": f"Profession invalide: {prof}"})

            # Si JOURNALISTE ou ONG est sélectionné, media_organisation est obligatoire
            if any(prof in ["JOURNALISTE", "ONG"] for prof in professions):
                if not attrs.get("media_organisation"):
                    raise serializers.ValidationError(
                        {"media_organisation": "Le nom du média/organisation est obligatoire pour les journalistes et ONG."}
                    )

        return attrs

    def create(self, validated_data):
        validated_data.pop("password_confirm")
        professions = validated_data.pop("professions", [])
        password = validated_data.pop("password")
        user = User(**validated_data)
        user.professions = professions
        user.set_password(password)
        user.save()
        return user


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.ReadOnlyField()
    commune_nom = serializers.SerializerMethodField()
    profile_completion = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id", "email", "nom", "prenom", "full_name", "role", "profession", "professions",
            "commune", "commune_nom", "wallet_address", "is_blockchain_authorized",
            "telephone", "media_organisation", "journaliste_verifie",
            "email_verifie", "avatar", "reputation_score", "profile_completion",
            "profession_verified", "profession_verified_date",
            "cni_numero", "cni_date_expiration", "certification_status", "certification_reviewed_date",
            "is_active", "date_joined",
        ]
        read_only_fields = [
            "id", "journaliste_verifie", "professions", "profile_completion",
            "email_verifie", "reputation_score", "date_joined",
            "profession_verified", "profession_verified_date",
            "cni_numero", "cni_date_expiration", "certification_status", "certification_reviewed_date",
        ]

    def get_commune_nom(self, obj):
        return obj.commune.nom if obj.commune else None

    def get_profile_completion(self, obj):
        return obj.profile_completion


class UserCreateByAdminSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    wallet_address = serializers.CharField(max_length=42, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ["email", "nom", "prenom", "role", "commune", "password", "wallet_address"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        wallet_address = validated_data.pop("wallet_address", "")
        user = User(**validated_data)
        user.set_password(password)
        if wallet_address:
            user.wallet_address = wallet_address
        user.save()
        return user


class EngagementSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source="user.full_name")
    user_email = serializers.ReadOnlyField(source="user.email")

    class Meta:
        model = Engagement
        fields = ["id", "type", "description", "date", "status", "proof_hash", "user_profession", "user_name", "user_email", "created_at"]
        read_only_fields = ["id", "date", "user_profession", "user_name", "user_email", "created_at"]


# ─── H2 : Profession Verification Serializers ──────────────────────────────

class ProfessionDocumentSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source="user.full_name")
    reviewed_by_name = serializers.ReadOnlyField(source="reviewed_by.full_name")

    class Meta:
        from .models import ProfessionDocument
        model = ProfessionDocument
        fields = [
            "id", "user", "user_name", "profession", "type_document",
            "nom_fichier", "ipfs_hash", "ipfs_url",
            "status", "reviewed_by", "reviewed_by_name", "reviewed_at",
            "rejection_reason", "created_at", "updated_at"
        ]
        read_only_fields = [
            "id", "user", "ipfs_hash", "ipfs_url",
            "status", "reviewed_by", "reviewed_at", "created_at", "updated_at"
        ]


class VerifiedONGSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import VerifiedONG
        model = VerifiedONG
        fields = ["id", "nom", "pays", "region", "numero_registration", "website", "email_domain", "verified_by_dgddl", "verified_at", "description"]
        read_only_fields = ["id", "verified_at"]


class VerifiedUniversitySerializer(serializers.ModelSerializer):
    class Meta:
        from .models import VerifiedUniversity
        model = VerifiedUniversity
        fields = ["id", "nom", "pays", "email_domain", "website", "type_institution"]
        read_only_fields = ["id"]


class CertificationSentinelleSerializer(serializers.Serializer):
    cni_numero = serializers.CharField(max_length=50, required=True)
    cni_date = serializers.DateField(required=True)
    document = serializers.FileField(required=False, allow_null=True)

    def validate_cni_numero(self, value):
        if not value or len(value.strip()) < 5:
            raise serializers.ValidationError("Le numéro de CNI doit être valide.")
        return value

    def validate_cni_date(self, value):
        from datetime import date
        if value < date.today():
            raise serializers.ValidationError("Le document doit être valide (date d'expiration future).")
        return value

    def validate_document(self, value):
        max_size = 5 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("Le fichier ne doit pas dépasser 5 Mo.")

        valid_types = ['image/jpeg', 'image/png', 'application/pdf']
        if value.content_type not in valid_types:
            raise serializers.ValidationError("Format non autorisé. Acceptés: JPG, PNG, PDF.")

        return value
