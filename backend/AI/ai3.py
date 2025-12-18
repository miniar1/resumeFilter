#!/usr/bin/env python3
"""
cv_screening.py - Script de screening de CV avec intégration API
Usage: python cv_screening.py <json_data_file>
"""

import sys
import json
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import LabelEncoder
import PyPDF2
import pdfplumber
import docx2txt
import re
from pathlib import Path

# ==================== EXTRACTION DE TEXTE ====================

def extract_text_from_pdf(pdf_path):
    """Extrait le texte d'un PDF"""
    text = ""
    try:
        # Méthode 1: pdfplumber (meilleure pour la plupart des PDFs)
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
        
        # Si pdfplumber échoue, essayer PyPDF2
        if not text.strip():
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"
    except Exception as e:
        print(f"⚠️ Error extracting text from {pdf_path}: {e}", file=sys.stderr)
    
    return text.strip()

def extract_text_from_docx(docx_path):
    """Extrait le texte d'un DOCX"""
    try:
        text = docx2txt.process(docx_path)
        return text.strip()
    except Exception as e:
        print(f"⚠️ Error extracting text from {docx_path}: {e}", file=sys.stderr)
        return ""

def extract_resume_text(file_path):
    """Extrait le texte d'un CV (PDF ou DOCX)"""
    file_path = Path(file_path)
    
    if file_path.suffix.lower() == '.pdf':
        return extract_text_from_pdf(file_path)
    elif file_path.suffix.lower() in ['.docx', '.doc']:
        return extract_text_from_docx(file_path)
    else:
        print(f"⚠️ Unsupported file format: {file_path}", file=sys.stderr)
        return ""

# ==================== CHARGEMENT DU MODÈLE ====================

# Get the script's directory for absolute path resolution
SCRIPT_DIR = Path(__file__).parent.absolute()
# The dataset is in the utils folder at the project root
DATASET_PATH = SCRIPT_DIR.parent.parent / 'utils' / 'Resume.csv'

class CVScreener:
    def __init__(self, dataset_path=None):
        """Initialise le screener avec le dataset"""
        print("🔄 Loading CV screening model...", file=sys.stderr)
        
        # Use the provided path or default to the calculated absolute path
        if dataset_path is None:
            dataset_path = DATASET_PATH
        
        # Charger le dataset
        print(f"📂 Loading dataset from: {dataset_path}", file=sys.stderr)
        self.CVs = pd.read_csv(dataset_path, encoding='latin-1')
        print(f"✅ Dataset loaded: {len(self.CVs)} CVs", file=sys.stderr)
        print(f"Colonnes : {self.CVs.columns.tolist()}", file=sys.stderr)
        # Préparer les données
        self.CVs['CV_text'] = (
            self.CVs['Resume_str'].fillna('') + ' ' + 
            self.CVs['Resume_html'].fillna('')
        )
        
        # Encoder les catégories
        self.le = LabelEncoder()
        self.CVs['Category_encoded'] = self.le.fit_transform(self.CVs['Category'])
        
        # Entraîner le modèle
        self._train_model()
        
        print("✅ Model loaded successfully", file=sys.stderr)
    
    def _train_model(self):
        """Entraîne le modèle de classification"""
        # TF-IDF Vectorizer
        self.vectorizer = TfidfVectorizer(
            max_features=5000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
        # Vectoriser les CV
        X = self.vectorizer.fit_transform(self.CVs['CV_text'])
        y = self.CVs['Category_encoded']
        
        # Entraîner le classificateur
        self.clf = RandomForestClassifier(n_estimators=100, random_state=42)
        self.clf.fit(X, y)
    
    def screen_candidates(self, job_data, resume_texts):
        """
        Screen les candidats pour un poste donné
        
        Args:
            job_data: dict avec category, description, nb_postes, min_score, etc.
            resume_texts: list de textes de CV extraits
        
        Returns:
            list de dicts avec les résultats
        """
        print(f"\n🎯 Screening for: {job_data['category']}", file=sys.stderr)
        print(f"   Candidates to screen: {len(resume_texts)}", file=sys.stderr)
        
        if not resume_texts:
            return []
        
        # Vectoriser les CV et la job description
        all_texts = resume_texts + [job_data['description']]
        all_vectors = self.vectorizer.transform(all_texts)
        
        cv_vectors = all_vectors[:-1]
        job_vector = all_vectors[-1]
        
        # Calculer les probabilités de catégorie
        probas = self.clf.predict_proba(cv_vectors)
        
        # Trouver l'index de la catégorie cible
        try:
            target_idx = self.le.transform([job_data['category']])[0]
            category_scores = probas[:, target_idx]
        except:
            # Si la catégorie n'existe pas, utiliser la prédiction
            category_scores = np.max(probas, axis=1)
        
        # Calculer la similarité cosinus
        similarity_scores = cosine_similarity(cv_vectors, job_vector).flatten()
        
        # Score combiné (60% similarité, 40% catégorie)
        final_scores = (0.4 * category_scores) + (0.6 * similarity_scores)
        
        # Debug: Print scores for all candidates
        print(f"   📊 Score details:", file=sys.stderr)
        for i, (cat_score, sim_score, final_score) in enumerate(
            zip(category_scores, similarity_scores, final_scores)
        ):
            print(f"      CV {i+1}: cat={cat_score:.3f}, sim={sim_score:.3f}, final={final_score:.3f}", file=sys.stderr)
        
        # Créer les résultats pour TOUS les candidats (triés par score)
        results = []
        min_score = job_data.get('min_score', 0.0)  # Default to 0 to show all
        
        for i, (cat_score, sim_score, final_score, text) in enumerate(
            zip(category_scores, similarity_scores, final_scores, resume_texts)
        ):
            # Include all candidates but mark those below threshold
            results.append({
                'candidate_id': i + 1,
                'category_score': float(cat_score),
                'similarity_score': float(sim_score),
                'final_score': float(final_score),
                'meets_threshold': bool(final_score >= min_score),
                'cv_preview': text[:200] + '...' if len(text) > 200 else text
            })
        
        # Trier par score final (meilleur en premier)
        results.sort(key=lambda x: x['final_score'], reverse=True)
        
        # Limiter au nombre de postes demandés
        nb_postes = job_data.get('nb_postes', 10)
        results = results[:nb_postes]
        
        print(f"✅ Screening complete: {len(results)} candidates selected", file=sys.stderr)
        
        return results

# ==================== FONCTION PRINCIPALE ====================

def main():
    if len(sys.argv) < 2:
        print("Usage: python cv_screening.py <json_data_file>", file=sys.stderr)
        sys.exit(1)
    
    # Lire le fichier JSON
    json_file = sys.argv[1]
    
    try:
        with open(json_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error reading JSON file: {e}", file=sys.stderr)
        sys.exit(1)
    
    job_data = data['job']
    resume_paths = data['resume_paths']
    
    # Extraire le texte des CV
    print(f"\n📄 Extracting text from {len(resume_paths)} resumes...", file=sys.stderr)
    resume_texts = []
    valid_paths = []
    
    for path in resume_paths:
        text = extract_resume_text(path)
        if text:
            resume_texts.append(text)
            valid_paths.append(path)
        else:
            print(f"⚠️ Skipping {path}: no text extracted", file=sys.stderr)
    
    if not resume_texts:
        print("❌ No valid resumes found", file=sys.stderr)
        print(json.dumps([]))
        sys.exit(0)
    
    # Initialiser le screener
    screener = CVScreener()
    
    # Faire le screening
    results = screener.screen_candidates(job_data, resume_texts)
    
    # Ajouter les chemins de fichiers aux résultats
    for i, result in enumerate(results):
        result['file_path'] = valid_paths[result['candidate_id'] - 1]
        result['file_name'] = Path(valid_paths[result['candidate_id'] - 1]).name
    
    # Sortir les résultats en JSON
    print(json.dumps(results, indent=2))

if __name__ == "__main__":
    main()