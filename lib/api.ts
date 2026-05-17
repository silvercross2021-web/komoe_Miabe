/**
 * Client HTTP KOMOE — wraps fetch avec gestion JWT automatique.
 * Stocke access/refresh tokens dans localStorage.
 * Refresh automatique si le token access est expiré (401).
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

// ─── Token helpers ──────────────────────────────────────────────────────────

export const tokens = {
  getAccess: (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem("komoe_access") : null,
  getRefresh: (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem("komoe_refresh") : null,
  set: (access: string, refresh: string) => {
    localStorage.setItem("komoe_access", access);
    localStorage.setItem("komoe_refresh", refresh);
    // Cookie for proxy.ts middleware (server-side route protection)
    if (typeof document !== "undefined") {
      document.cookie = `komoe_access=${access}; path=/; max-age=3600; SameSite=Lax`;
    }
  },
  clear: () => {
    localStorage.removeItem("komoe_access");
    localStorage.removeItem("komoe_refresh");
    if (typeof document !== "undefined") {
      document.cookie = "komoe_access=; path=/; max-age=0; SameSite=Lax";
    }
  },
};

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ApiError {
  status: number;
  data: Record<string, unknown>;
  message: string;
}

// ─── Core fetch wrapper ──────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const accessToken = tokens.getAccess();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Auto-refresh si 401
  if (res.status === 401 && retry) {
    const refreshToken = tokens.getRefresh();
    if (!refreshToken) {
      tokens.clear();
      throw { status: 401, data: {}, message: "Session expirée" } as ApiError;
    }

    const refreshRes = await fetch(`${BASE_URL}/api/auth/refresh/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh: refreshToken }),
    });

    if (!refreshRes.ok) {
      tokens.clear();
      throw { status: 401, data: {}, message: "Session expirée" } as ApiError;
    }

    const { access } = await refreshRes.json();
    tokens.set(access, refreshToken);
    return apiFetch<T>(path, options, false);
  }

  if (!res.ok) {
    let data: Record<string, unknown> = {};
    try { data = await res.json(); } catch { /* vide */ }
    const message =
      (data.detail as string) ||
      Object.values(data).flat().join(" ") ||
      `Erreur ${res.status}`;
    
    const error = new Error(message) as any;
    error.status = res.status;
    error.data = data;
    throw error;
  }

  if (res.status === 204 || res.status === 200 && res.headers.get('content-length') === '0') {
    return undefined as unknown as T;
  }
  return res.json() as Promise<T>;
}

// ─── API Auth ────────────────────────────────────────────────────────────────

export interface LoginPayload { email: string; password: string }
export interface LoginResponse { access: string; refresh: string }
export interface RegisterPayload {
  email: string; nom: string; prenom: string;
  role?: string; professions?: string[];
  password: string; password_confirm: string;
  telephone?: string; media_organisation?: string;
  commune?: number; date_naissance?: string;
}
export interface UserProfile {
  id: string; email: string; nom: string; prenom: string; full_name: string;
  role: string; profession: string; professions?: string[]; commune: number | null; commune_nom: string | null;
  wallet_address: string; journaliste_verifie: boolean;
  email_verifie: boolean; is_blockchain_authorized: boolean; avatar: string; reputation_score: number;
  profession_verified: boolean; profession_verified_date: string | null;
  is_active: boolean; is_verified: boolean; is_expert: boolean; date_joined: string; telephone?: string;
  certification_status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface Engagement {
  id: string;
  type: "vote" | "signalement" | "participation" | "commentaire";
  description: string;
  date: string;
  status: "completed" | "pending" | "processing";
  proof_hash?: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  user_profession?: "CITOYEN" | "JOURNALISTE" | "ONG" | "CHERCHEUR" | "BAILLEUR";
  created_at?: string;
}

export interface ProfessionDocument {
  id: string;
  user: string;
  user_name: string;
  profession: "JOURNALISTE" | "ONG" | "CHERCHEUR" | "BAILLEUR";
  type_document: "CARTE_IDENTITE" | "AFFILIATION_ONG" | "BADGE_JOURNALISTE" | "DIPLOME_UNIVERSITE" | "AUTRE";
  nom_fichier: string;
  ipfs_hash: string;
  ipfs_url: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reviewed_by?: string;
  reviewed_by_name?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface VerifiedONG {
  id: string;
  nom: string;
  pays: string;
  region?: string;
  numero_registration: string;
  website?: string;
  email_domain?: string;
  verified_by_dgddl: boolean;
  verified_at?: string;
  description?: string;
}

export interface VerifiedUniversity {
  id: string;
  nom: string;
  pays: string;
  email_domain: string;
  website?: string;
  type_institution: "UNIVERSITE" | "ECOLE_SUPERIEURE" | "INSTITUT_RECHERCHE" | "AUTRE";
}

export const authApi = {
  login: (payload: LoginPayload) =>
    apiFetch<LoginResponse>("/api/auth/login/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  register: (payload: RegisterPayload) =>
    apiFetch<{ message: string; user: UserProfile }>("/api/auth/register/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  me: () => apiFetch<UserProfile>("/api/auth/me/"),

  refresh: (refreshToken: string) =>
    apiFetch<{ access: string }>("/api/auth/refresh/", {
      method: "POST",
      body: JSON.stringify({ refresh: refreshToken }),
    }),

  list: () => apiFetch<UserProfile[] | { results: UserProfile[]; count: number }>("/api/auth/users/"),
  
  create: (payload: Record<string, unknown>) => apiFetch<UserProfile>("/api/auth/users/", {
    method: "POST",
    body: JSON.stringify(payload),
  }),

  authorizeBlockchain: (id: string, walletAddress: string) =>
    apiFetch<{ message: string; user: UserProfile; tx_hash: string }>(
      `/api/auth/users/${id}/authorize-blockchain/`,
      {
        method: "POST",
        body: JSON.stringify({ wallet_address: walletAddress }),
      }
    ),

  togglePause: (action: "pause" | "unpause") =>
    apiFetch<{ message: string; tx_hash: string }>("/api/auth/blockchain/toggle-pause/", {
      method: "POST",
      body: JSON.stringify({ action }),
    }),

  updateMe: (payload: Partial<UserProfile>) =>
    apiFetch<UserProfile>("/api/auth/me/", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  detail: (id: string) => apiFetch<UserProfile>(`/api/auth/users/${id}/`),

  getEngagements: (id: string) => apiFetch<{ results: Engagement[] }>(`/api/auth/users/${id}/engagements/`),

  delete: (id: string): Promise<void> => apiFetch<void>(`/api/auth/users/${id}/`, {
    method: "DELETE",
  }),

  uploadDocument: (profession: string, typeDocument: string, file: File) => {
    const formData = new FormData();
    formData.append("profession", profession);
    formData.append("type_document", typeDocument);
    formData.append("document", file);
    return apiFetch<ProfessionDocument>("/api/auth/documents/upload/", {
      method: "POST",
      body: formData,
    });
  },

  listPendingDocuments: (profession?: string) => {
    const params = profession ? `?profession=${profession}` : "";
    return apiFetch<{ results: ProfessionDocument[]; count: number }>(`/api/auth/documents/pending/${params}`);
  },

  reviewDocument: (id: string, action: "approve" | "reject", reason?: string) =>
    apiFetch<{ message: string; document: ProfessionDocument }>(`/api/auth/documents/${id}/review/`, {
      method: "PATCH",
      body: JSON.stringify({ action, reason }),
    }),

  validateUniversityAffiliation: () =>
    apiFetch<{ is_valid: boolean; university?: VerifiedUniversity; message?: string }>(
      "/api/auth/validate-university/",
      { method: "POST" }
    ),

  getVerifiedONGs: (pays?: string) => {
    const params = pays ? `?pays=${pays}` : "";
    return apiFetch<{ results: VerifiedONG[]; count: number }>(`/api/auth/ongs/verified/${params}`);
  },

  getVerifiedUniversities: (pays?: string) => {
    const params = pays ? `?pays=${pays}` : "";
    return apiFetch<{ results: VerifiedUniversity[]; count: number }>(`/api/auth/universities/verified/${params}`);
  },

  submitCertification: (cniNumero: string, cniDate: string, document: File) => {
    const formData = new FormData();
    formData.append("cni_numero", cniNumero);
    formData.append("cni_date", cniDate);
    formData.append("document", document);
    return apiFetch<{ message: string; document_id: string; status: string; estimated_verification: string }>(
      "/api/auth/certification/submit/",
      { method: "POST", body: formData }
    );
  },

  listPendingCertifications: () =>
    apiFetch<{ count: number; pending_certifications: UserProfile[] }>("/api/auth/certification/pending/"),

  reviewCertification: (userId: string, action: "approve" | "reject") =>
    apiFetch<{ message: string; user_id: string; status: string; is_blockchain_authorized: boolean }>(
      `/api/auth/certification/${userId}/review/`,
      { method: "PATCH", body: JSON.stringify({ action }) }
    ),
};

// ─── API Communes ─────────────────────────────────────────────────────────────

export interface Commune {
  id: number; code: string; nom: string; region: string;
  population: number; superficie_km2: number; budget_annuel_fcfa: number;
  maire_nom: string; is_active: boolean;
  budget_depense_fcfa: number;
  score_transparence: number;
  blockchain_tx_hash_dotation?: string;
  created_at: string; updated_at: string;
}

export interface CommuneListFilters {
  search?: string;
  region?: string;
  limit?: number;
  offset?: number;
}

export const communesApi = {
  list: (filters?: CommuneListFilters) => {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.region) params.set("region", filters.region);
    if (filters?.limit) params.set("limit", String(filters.limit));
    if (filters?.offset) params.set("offset", String(filters.offset));
    const qs = params.toString();
    return apiFetch<Commune[]>(
      `/api/communes/${qs ? `?${qs}` : ""}`
    );
  },
  detail: (id: number) => apiFetch<Commune>(`/api/communes/${id}/`),
  update: (id: number, payload: Partial<Commune>) =>
    apiFetch<Commune>(`/api/communes/admin/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  confirmerDotation: (id: number, txHash: string) =>
    apiFetch<{ message: string }>(`/api/communes/admin/${id}/confirmer-dotation/`, {
      method: "PATCH",
      body: JSON.stringify({ blockchain_tx_hash_dotation: txHash }),
    }),
};


// ─── API Transactions ─────────────────────────────────────────────────────────

export interface Transaction {
  id: string; commune: number; commune_detail: Commune;
  type: "DEPENSE" | "RECETTE"; statut: string;
  montant_fcfa: number; categorie: string; description: string;
  periode: string; ipfs_hash: string; ipfs_url: string;
  blockchain_tx_hash_soumission: string;
  blockchain_tx_hash_validation: string;
  soumis_par_detail: UserProfile | null;
  valide_par_detail: UserProfile | null;
  projet?: number | null;
  created_at: string; validated_at: string | null;
  updated_at: string;
  corrections?: Transaction[] | null;
}

export interface TransactionListFilters {
  commune?: number;
  type?: "DEPENSE" | "RECETTE";
  statut?: string;
  limit?: number;
  offset?: number;
  projet?: number;
}

export interface TransactionCreatePayload {
  commune: number;
  type: "DEPENSE" | "RECETTE";
  montant_fcfa: number;
  categorie: string;
  description: string;
  periode: string;
  ipfs_hash?: string;
  blockchain_tx_hash_soumission?: string;
  projet?: number | null;
}

export const transactionsApi = {
  list: (filters?: TransactionListFilters) => {
    const params = new URLSearchParams();
    if (filters?.commune) params.set("commune", String(filters.commune));
    if (filters?.type) params.set("type", filters.type);
    if (filters?.statut) params.set("statut", filters.statut);
    if (filters?.limit) params.set("limit", String(filters.limit));
    if (filters?.projet) params.set("projet", String(filters.projet));
    if (filters?.offset) params.set("offset", String(filters.offset));
    const qs = params.toString();
    return apiFetch<{ results: Transaction[]; count: number }>(
      `/api/transactions/${qs ? `?${qs}` : ""}`
    );
  },

  byCommune: (communeId: number, filters?: Omit<TransactionListFilters, "commune">) => {
    const params = new URLSearchParams();
    if (filters?.statut) params.set("statut", filters.statut);
    if (filters?.type) params.set("type", filters.type);
    if (filters?.limit) params.set("limit", String(filters.limit));
    if (filters?.offset) params.set("offset", String(filters.offset));
    const qs = params.toString();
    return apiFetch<{ results: Transaction[]; count: number }>(
      `/api/transactions/commune/${communeId}/${qs ? `?${qs}` : ""}`
    );
  },

  detail: (id: string) =>
    apiFetch<Transaction>(`/api/transactions/${id}/`),

  soumettre: (payload: TransactionCreatePayload) =>
    apiFetch<Transaction>("/api/transactions/soumettre/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  delete: (id: string): Promise<void> =>
    apiFetch<void>(`/api/transactions/${id}/`, {
      method: "DELETE",
    }),

  update: (id: string, payload: Partial<TransactionCreatePayload>) =>
    apiFetch<Transaction>(`/api/transactions/${id}/`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  valider: (id: string, txHash?: string) =>
    apiFetch<{ message: string; transaction: Transaction }>(
      `/api/transactions/${id}/valider/`,
      {
        method: "PATCH",
        body: JSON.stringify({ blockchain_tx_hash: txHash ?? null })
      }
    ),

  rejeter: (id: string, motif: string) =>
    apiFetch<{ message: string; transaction: Transaction }>(
      `/api/transactions/${id}/rejeter/`,
      {
        method: "PATCH",
        body: JSON.stringify({ motif }),
      }
    ),

  confirmerHash: (id: string, txHash: string) =>
    apiFetch<{ message: string; transaction: Transaction }>(
      `/api/transactions/${id}/confirmer-hash/`,
      {
        method: "PATCH",
        body: JSON.stringify({ blockchain_tx_hash_soumission: txHash }),
      }
    ),

  creerRecette: (payload: Omit<TransactionCreatePayload, "type">) =>
    apiFetch<Transaction>("/api/transactions/recettes/", {
      method: "POST",
      body: JSON.stringify({ ...payload, type: "RECETTE" }),
    }),

  confirmerRecette: (id: string, txHash: string) =>
    apiFetch<{ message: string; transaction: Transaction }>(
      `/api/transactions/recettes/${id}/confirmer/`,
      {
        method: "PATCH",
        body: JSON.stringify({ blockchain_tx_hash_validation: txHash }),
      }
    ),
};

export interface Commentaire {
  id: string;
  signalement: string;
  auteur: string | null;
  auteur_nom: string;
  auteur_role: string;
  contenu: string;
  type_commentaire: "AVIS" | "JUSTIFICATION" | "ENQUETE";
  image_url?: string;
  created_at: string;
}

export interface Signalement {
  id: string;
  commune: number;
  commune_detail: Commune;
  sujet: string;
  description: string;
  transaction: string | null;
  transaction_detail?: Transaction;
  auteur: string | null;
  auteur_detail: UserProfile | null;
  statut: "NOUVEAU" | "VIRAL" | "ENQUETE_DGDDL" | "VALIDE_FRAUDE" | "REJETE_FAUX" | "CLOS";
  is_prioritaire: boolean;
  is_reviewed: boolean;
  nb_preuves: number;
  nb_votes: number;
  nb_credibles: number;
  nb_infondes: number;
  pct_credible: number;
  mon_vote: "CREDIBLE" | "INFONDE" | null;
  enquete_lancee_par?: string | null;
  enquete_lancee_a?: string | null;
  resolution?: "FRAUDE" | "FAUX" | "INFONDE" | null;
  resolution_justification?: string | null;
  resolution_par?: string | null;
  resolution_a?: string | null;
  blockchain_tx_hash_enquete?: string | null;
  blockchain_tx_hash_resolution?: string | null;
  created_by_profession: "CITOYEN" | "JOURNALISTE" | "ONG" | "CHERCHEUR" | "BAILLEUR";
  commentaires: Commentaire[];
  preuves: PreuveSignalement[];
  actions_dgddl: ActionDGDDL[];
  created_at: string;
  updated_at?: string;
}

export interface ActionDGDDL {
  id: string;
  action_type: string;
  description: string;
  effectuee_par_nom: string;
  created_at: string;
}

export interface SignalementCreatePayload {
  commune: number;
  sujet: string;
  description: string;
  transaction?: string | null;
}

export interface PreuveSignalement {
  id: string;
  signalement: string;
  ipfs_hash: string;
  ipfs_url: string;
  nom_fichier: string;
  type_fichier: "image" | "pdf" | "autre";
  uploaded_at: string;
}


// ─── H3 : Propositions de dépenses ──────────────────────────────────────────

export interface Proposition {
  id: string;
  commune: number;
  commune_detail?: { id: number; nom: string; region: string };
  titre: string;
  description: string;
  categorie: string;
  budget_demande_fcfa: number;
  soumis_par?: string;
  soumis_par_detail?: { id: string; full_name: string };
  statut: "ACTIVE" | "VALIDEE" | "REJETEE" | "EXPIREE" | "CONVERTIE" | "SUGGESTION" | "OFFICIELLE" | "APPROUVEE";
  deadline_vote: string | null;
  nb_soutiens: number;
  nb_oppositions: number;
  score_vote: number;
  pct_soutien: number;
  mon_vote: "SOUTIEN" | "OPPOSITION" | null;
  commentaires: CommentaireProposition[];
  preuves: PreuveProposition[];
  nb_preuves: number;
  maire_signature_hash?: string;
  is_official?: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommentaireProposition {
  id: string;
  proposition: string;
  auteur: string | null;
  auteur_nom: string;
  contenu: string;
  image_url?: string;
  created_at: string;
}

export interface PreuveProposition {
  id: string;
  proposition: string;
  ipfs_hash: string;
  ipfs_url: string;
  nom_fichier: string;
  type_fichier: "image" | "pdf" | "autre";
  uploaded_at: string;
}

export interface PropositionCreatePayload {
  commune: number;
  titre: string;
  description: string;
  categorie: string;
  budget_demande_fcfa: number;
}

// ─── Phase 2 : Rapports & Notifications ──────────────────────────────────────

export interface AppNotification {
  id: string;
  titre: string;
  message: string;
  type_notif: "TRANSACTION" | "VOTE" | "PROPOSITION" | "SIGNALEMENT" | "SYSTEME";
  is_read: boolean;
  created_at: string;
}

export const rapportsApi = {
  getDownloadUrl: (communeId: number) =>
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/transactions/commune/${communeId}/rapport/`,
  exportTransactionsCsvUrl: (params?: { commune?: number; type?: string }) => {
    const base = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/transactions/open/export/transactions.csv`;
    const qs = new URLSearchParams();
    if (params?.commune) qs.set("commune", String(params.commune));
    if (params?.type) qs.set("type", params.type);
    const q = qs.toString();
    return q ? `${base}?${q}` : base;
  },
  exportSignalementsCsvUrl: (params?: { commune?: number }) => {
    const base = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/api/transactions/open/export/signalements.csv`;
    const qs = new URLSearchParams();
    if (params?.commune) qs.set("commune", String(params.commune));
    const q = qs.toString();
    return q ? `${base}?${q}` : base;
  },
};

export const notificationsApi = {
  list: () => apiFetch<{ results: AppNotification[]; count: number }>("/api/transactions/notifications/"),
  markAllAsRead: () => apiFetch<{ message: string }>("/api/transactions/notifications/read/", { method: "PATCH" }),
  getStreamUrl: () => `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/transactions/notifications/stream/`,
};

export const signalementsApi = {
  list: (params?: { commune?: number; mes_signalements?: boolean; mes_votes?: boolean; statut?: string }) => {
    const search = new URLSearchParams();
    if (params?.commune) search.set("commune", params.commune.toString());
    if (params?.mes_signalements) search.set("mes_signalements", "true");
    if (params?.mes_votes) search.set("mes_votes", "true");
    if (params?.statut) search.set("statut", params.statut);
    return apiFetch<{ results: Signalement[]; count: number }>(`/api/transactions/signalements/?${search.toString()}`);
  },
  detail: (id: string) => apiFetch<Signalement>(`/api/transactions/signalements/${id}/`),
  create: (data: SignalementCreatePayload) => apiFetch<Signalement>("/api/transactions/signalements/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Signalement>) => apiFetch<Signalement>(`/api/transactions/signalements/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  voter: (id: string, verdict: "CREDIBLE" | "INFONDE") =>
    apiFetch<{ message: string }>(`/api/transactions/signalements/${id}/voter/`, { method: "POST", body: JSON.stringify({ verdict }) }),
  ajouterPreuve: (id: string, data: { ipfs_hash: string; ipfs_url: string; nom_fichier: string; type_fichier: string }) =>
    apiFetch<PreuveSignalement>(`/api/transactions/signalements/${id}/preuves/`, { method: "POST", body: JSON.stringify(data) }),
  listeCommentaires: (id: string) =>
    apiFetch<Commentaire[]>(`/api/transactions/signalements/${id}/commentaires/`),
  ajouterCommentaire: (id: string, data: { contenu: string; type_commentaire: "AVIS" | "JUSTIFICATION" | "ENQUETE"; image_url?: string }) =>
    apiFetch<Commentaire>(`/api/transactions/signalements/${id}/commentaires/`, { method: "POST", body: JSON.stringify(data) }),
  lancerEnquete: (id: string) =>
    apiFetch<Signalement>(`/api/transactions/signalements/${id}/enquete/lancer/`, { method: "PATCH" }),
  ajouterNoteEnquete: (id: string, note: string) =>
    apiFetch<{ message: string }>(`/api/transactions/signalements/${id}/enquete/note/`, { method: "POST", body: JSON.stringify({ note }) }),
  resoudreEnquete: (id: string, data: { resolution: "FRAUDE" | "FAUX" | "INFONDE"; justification?: string; montant_corrige?: number }) =>
    apiFetch<Signalement>(`/api/transactions/signalements/${id}/enquete/resoudre/`, { method: "PATCH", body: JSON.stringify(data) }),
};

export const anomaliesApi = {
  list: () => apiFetch<{ anomalies: unknown[] }>("/api/transactions/anomalies/"),
};

export const openDataApi = {
  getStats: () => apiFetch<Record<string, unknown>>("/api/transactions/open/stats/"),
};

export interface Projet {
  id: number;
  commune: number;
  commune_detail?: { id: number; nom: string; region: string };
  nom: string;
  description: string;
  budget_alloue_fcfa: number;
  budget_consomme_fcfa: number;
  taux_execution: number;
  statut: "BROUILLON" | "EN_ATTENTE" | "EN_COURS" | "ACHEVE" | "ANNULE" | "SOUS_ENQUETE";
  bailleur?: string | null;
  blockchain_audit_hash?: string;
  parent_proposition?: number;
  created_at: string;
  updated_at?: string;
}

export const projetsApi = {
  list: (filters?: { commune?: number }) => {
    const search = new URLSearchParams();
    if (filters?.commune) search.set("commune", filters.commune.toString());
    const qs = search.toString();
    return apiFetch<{ results: Projet[]; count: number }>(`/api/communes/projets/${qs ? `?${qs}` : ""}`);
  },
  getDetail: (id: string | number) => apiFetch<Projet>(`/api/communes/projets/${id}/`),
  update: (id: string | number, data: Partial<Projet>) =>
    apiFetch<Projet>(`/api/communes/projets/${id}/`, { method: "PATCH", body: JSON.stringify(data) }),
  delete: (id: string | number) => apiFetch<void>(`/api/communes/projets/${id}/`, { method: "DELETE" }),
};

export const propositionsApi = {
  list: (params?: { commune?: number; statut?: string }) => {
    const search = new URLSearchParams();
    if (params?.commune) search.set("commune", params.commune.toString());
    if (params?.statut) search.set("statut", params.statut);
    return apiFetch<{ results: Proposition[]; count: number }>(`/api/transactions/propositions/?${search.toString()}`);
  },
  detail: (id: string) => apiFetch<Proposition>(`/api/transactions/propositions/${id}/`),
  create: (data: Partial<Proposition>) => 
    apiFetch<Proposition>("/api/transactions/propositions/", { method: "POST", body: JSON.stringify(data) }),
  voter: (id: string, type_vote: "SOUTIEN" | "OPPOSITION") =>
    apiFetch<any>(`/api/transactions/propositions/${id}/voter/`, { method: "POST", body: JSON.stringify({ type_vote }) }),
  retirerVote: (id: string) =>
    apiFetch<{ message: string }>(`/api/transactions/propositions/${id}/voter/`, { method: "DELETE" }),
  
  // Gouvernance Maire
  officialiser: (id: string, data: { tx_hash: string; budget_alloue_fcfa: number }) =>
    apiFetch<{ message: string; statut: string }>(`/api/transactions/propositions/${id}/officialiser/`, { 
      method: "PATCH", 
      body: JSON.stringify(data) 
    }),
  cloturer: (id: string) =>
    apiFetch<{ message: string; statut: string }>(`/api/transactions/propositions/${id}/cloturer/`, { method: "PATCH" }),
  
  ajouterPreuve: (id: string, data: any) =>
    apiFetch<any>(`/api/transactions/propositions/${id}/preuves/`, { method: "POST", body: JSON.stringify(data) }),
  commentaires: (id: string) =>
    apiFetch<any[]>(`/api/transactions/propositions/${id}/commentaires/`),
  ajouterCommentaire: (id: string, data: { contenu: string; type_commentaire?: string; image_url?: string }) =>
    apiFetch<any>(`/api/transactions/propositions/${id}/commentaires/`, { method: "POST", body: JSON.stringify(data) }),
};
