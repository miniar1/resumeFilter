# ========================== EXTRACTION D'INFORMATIONS ==========================
def extraire_email(texte):
    """Extrait l'email du CV"""
    pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    emails = re.findall(pattern, texte)
    return emails[0] if emails else None

def extraire_telephone(texte):
    """Extrait le numéro de téléphone du CV"""
    patterns = [
        r'\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}',
        r'\d{2}[-.\s]?\d{3}[-.\s]?\d{3}',
    ]
    for pattern in patterns:
        telephones = re.findall(pattern, texte)
        if telephones:
            return telephones[0]
    return None

def extraire_competences(texte, liste_competences):
    """Extrait les compétences trouvées dans le CV"""
    texte_lower = texte.lower()
    competences_trouvees = []
    for comp in liste_competences:
        if comp.lower() in texte_lower:
            competences_trouvees.append(comp)
    return competences_trouvees

def extraire_experience(texte):
    """Estime l'expérience en années"""
    # Recherche de patterns comme "5 ans d'expérience", "3 années"
    patterns = [
        r'(\d+)\s*ans?\s+d[\'e]\s*expérience',
        r'(\d+)\s+années?\s+d[\'e]\s*expérience',
        r'expérience[:\s]+(\d+)\s*ans?',
        r'(\d+)\+?\s*years?\s+(?:of\s+)?experience',
    ]
    for pattern in patterns:
        match = re.search(pattern, texte.lower())
        if match:
            return int(match.group(1))
    return 0

# ========================== TRAITEMENT MULTIPLE ==========================
def traiter_cv(fichier_path, competences_requises, output_dir="resultats_cv"):
    """Traite un seul CV et retourne les informations extraites"""
    os.makedirs(output_dir, exist_ok=True)
    
    nom_fichier = os.path.basename(fichier_path)
    print(f"\n📄 Traitement de : {nom_fichier}")
    
    try:
        # Extraction du texte
        texte = extract_text(fichier_path)
        
        # Sauvegarde du texte extrait
        base_name = os.path.splitext(nom_fichier)[0]
        texte_path = os.path.join(output_dir, f"{base_name}_texte.txt")
        with open(texte_path, "w", encoding="utf-8") as f:
            f.write(texte)
        
        # Extraction des informations
        cv_info = {
            "fichier": nom_fichier,
            "chemin": fichier_path,
            "email": extraire_email(texte),
            "telephone": extraire_telephone(texte),
            "competences": extraire_competences(texte, competences_requises),
            "experience_annees": extraire_experience(texte),
            "photo_profil": None,
            "texte_extrait": texte_path,
            "date_traitement": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        
        print(f"  ✅ Email: {cv_info['email']}")
        print(f"  ✅ Téléphone: {cv_info['telephone']}")
        print(f"  ✅ Compétences trouvées: {len(cv_info['competences'])}/{len(competences_requises)}")
        print(f"  ✅ Expérience: {cv_info['experience_annees']} ans")
        
        return cv_info
        
    except Exception as e:
        print(f"  ❌ Erreur lors du traitement: {e}")
        return None

def traiter_plusieurs_cv(fichiers_paths, competences_requises):
    """Traite plusieurs CV et génère un rapport"""
    resultats = []
    
    print(f"\n🚀 Traitement de {len(fichiers_paths)} CV...\n")
    print("="*60)
    
    for fichier in fichiers_paths:
        cv_info = traiter_cv(fichier, competences_requises)
        if cv_info:
            resultats.append(cv_info)
    
    # Sauvegarde des résultats en JSON
    output_dir = "utils/rapport_cv"
    os.makedirs(output_dir, exist_ok=True)
    
    rapport_path = os.path.join(output_dir, f"rapport_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json")
    with open(rapport_path, "w", encoding="utf-8") as f:
        json.dump(resultats, f, ensure_ascii=False, indent=2)
    
    print("\n" + "="*60)
    print(f"✅ Traitement terminé: {len(resultats)}/{len(fichiers_paths)} CV traités avec succès")
    print(f"📊 Rapport sauvegardé: {rapport_path}")
    
    return resultats