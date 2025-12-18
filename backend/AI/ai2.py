import pandas as pd
from sklearn.model_selection import train_test_split #{pour diviser les données en ensembles d'entraînement et de test}
from sklearn.feature_extraction.text import TfidfVectorizer #{pour transformer le texte en vecteurs TF-IDF}
from sklearn.ensemble import RandomForestClassifier #{modèle de classification}
from sklearn.metrics import classification_report, accuracy_score 
from sklearn.preprocessing import LabelEncoder
import numpy as np
import tkinter as tk #fnetere de dialoge
from tkinter import filedialog, messagebox, ttk
import PyPDF2 #lecture des fichiers PDF/doc/os
#import docx
import os

import pdfplumber
import docx2txt
from pdf2image import convert_from_path
import pytesseract
from PIL import Image
import cv2
import json
from datetime import datetime
import re

# ---------------------------------------------------------
# 1) Charger le dataset
# ---------------------------------------------------------
print("🔄 Chargement du dataset...")
CVs = pd.read_csv("utils/Resume.csv", encoding='latin-1')
print("\n✅ Dataset chargé avec succès")
print(f"Nombre de CVs : {len(CVs)}")
print(CVs.head())
print(CVs.iloc[[1600, 1700, 1800, 1900, 2000, 2200, 2300, 2355]])
print(CVs.tail())
print(CVs.info())
print(f"Colonnes : {CVs.columns.tolist()}")

# ---------------------------------------------------------
# 2) Préparer les données
# ---------------------------------------------------------
print("\n🔧 Préparation des données...")
CVs['CV_text'] = CVs['Resume_str'].fillna('') + ' ' + CVs['Resume_html'].fillna('')

# Encoder les catégories
le = LabelEncoder()
CVs['Category_encoded'] = le.fit_transform(CVs['Category'])

print(f"\n📂 Catégories disponibles :")
for i, cat in enumerate(le.classes_):
    print(f"  {i}: {cat}")

# ---------------------------------------------------------
# 3) Entraîner le modèle de scoring
# ---------------------------------------------------------
print("\n🔄 Entraînement du modèle de scoring...")

X_train, X_test, y_train, y_test = train_test_split(
    CVs['CV_text'], CVs['Category_encoded'], 
    test_size=0.2, random_state=42, stratify=CVs['Category_encoded']
)

# TF-IDF Vectorizer
vectorizer = TfidfVectorizer(max_features=5000, stop_words='english', ngram_range=(1, 2))
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

# Modèle
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train_vec, y_train)

# Évaluation
pred = clf.predict(X_test_vec)
print(f"\n📊 Accuracy : {accuracy_score(y_test, pred):.3f}")


# ========================== FILTRAGE DES CV ==========================


# ========================== PROGRAMME PRINCIPAL ==========================

# ---------------------------------------------------------
# 6) Fonction principale de sélection
# ---------------------------------------------------------
def select_best_candidates(
    df, 
    target_category, 
    job_description, 
    nb_postes=3,
    min_score=0.3
):
    """
    Sélectionne les meilleurs candidats selon :
    - Catégorie cible (filtrage)
    - Description du poste (scoring)
    - Nombre de postes disponibles
    
    Args:
        df: DataFrame avec colonnes 'CV_text' et 'Category'
        target_category: Catégorie recherchée (ex: "Data Science", "Java Developer")
        job_description: Description détaillée du poste
        nb_postes: Nombre de candidats à sélectionner
        min_score: Score minimum pour être considéré
        
    Returns:
        DataFrame avec les meilleurs candidats classés
    """
    
    print(f"\n🎯 Recherche de candidats pour: {target_category}")
    print(f"   Nombre de postes: {nb_postes}")
    
    # 1) Filtrer par catégorie
    filtered_cvs = df[df['Category'] == target_category].copy() 
    
    if len(filtered_cvs) == 0:
        print(f"❌ Aucun CV trouvé dans la catégorie '{target_category}'")
        return pd.DataFrame()
    
    print(f"✅ {len(filtered_cvs)} CV trouvés dans cette catégorie")
    
    # 2) Calculer le score de pertinence pour chaque CV
    cv_texts = filtered_cvs['CV_text'].tolist()
    
    # Vectoriser les CV + job description
    all_texts = cv_texts + [job_description]
    all_vectors = vectorizer.transform(all_texts)
    
    # Probabilités de correspondance à la catégorie
    probas = clf.predict_proba(all_vectors[:-1])
    
    # Récupérer l'index de la catégorie cible
    target_idx = le.transform([target_category])[0]
    category_scores = probas[:, target_idx]
    
    # Similarité cosinus avec la job description
    from sklearn.metrics.pairwise import cosine_similarity
    job_vector = all_vectors[-1]
    cv_vectors = all_vectors[:-1]
    similarity_scores = cosine_similarity(cv_vectors, job_vector).flatten()
    
    # Score combiné (moyenne pondérée)
    final_scores = (0.4 * category_scores) + (0.6 * similarity_scores)
    
    # 3) Ajouter les scores au DataFrame
    filtered_cvs['category_score'] = category_scores
    filtered_cvs['similarity_score'] = similarity_scores
    filtered_cvs['final_score'] = final_scores
    
    # 4) Filtrer par score minimum et trier
    qualified = filtered_cvs[filtered_cvs['final_score'] >= min_score].copy()
    qualified = qualified.sort_values('final_score', ascending=False)
    
    # 5) Sélectionner le top N
    selected = qualified.head(nb_postes)
    
    print(f"\n📊 Résultats:")
    print(f"   - Candidats qualifiés (score ≥ {min_score}): {len(qualified)}")
    print(f"   - Candidats sélectionnés pour entretien: {len(selected)}")
    
    return selected[['Category', 'final_score', 'category_score', 'similarity_score', 'CV_text']]


# ---------------------------------------------------------
# 5) Fonction pour traiter plusieurs postes
# ---------------------------------------------------------
def process_multiple_positions(df, job_requests):
    """
    Traite plusieurs demandes de postes en même temps
    
    Args:
        df: DataFrame des CV
        job_requests: Liste de dictionnaires avec:
            - category: catégorie cible
            - description: description du poste
            - nb_postes: nombre de postes
    """
    all_results = {}
    
    for i, job in enumerate(job_requests, 1):
        print(f"\n{'='*60}")
        print(f"POSTE {i}/{len(job_requests)}")
        print(f"{'='*60}")
        
        results = select_best_candidates(
            df,
            target_category=job['category'],
            job_description=job['description'],
            nb_postes=job.get('nb_postes', 3),
            min_score=job.get('min_score', 0.3)
        )
        
        all_results[job['category']] = results
        
        if len(results) > 0:
            print(f"\n🏆 Top candidats:")
            for idx, row in results.iterrows():
                print(f"   Rank {len(results) - len(results[results.index <= idx]) + 1}: "
                      f"Score={row['final_score']:.3f} "
                      f"(Cat: {row['category_score']:.2f}, Sim: {row['similarity_score']:.2f})")
    
    return all_results


# ---------------------------------------------------------
# 6) Exemple d'utilisation
# ---------------------------------------------------------

# Définir les postes à pourvoir
job_requests = [
    
    {
        "category": "HR",
        "description": """Responsable Ressources Humaines:
- Gestion du recrutement...
""",
        "nb_postes": 3
    },
    {
        "category": "Data Science",
        "description": """Data Scientist Expert:
...
""",
        "nb_postes": 3
    },
    {
        "category": "Java Developer",
        "description": """Développeur Java Senior:
...
""",
        "nb_postes": 3
    },
    {
        "category": "Advocate",
        "description": """Avocat spécialisé en droit...
""",
        "nb_postes": 2
    }
]


# Traiter toutes les demandes
print("\n" + "="*60)
print("🚀 DÉBUT DU PROCESSUS DE SÉLECTION")
print("="*60)

results = process_multiple_positions(CVs, job_requests)

# ---------------------------------------------------------
# 7) Afficher le résumé final
# ---------------------------------------------------------
print("\n" + "="*60)
print("📋 RÉSUMÉ FINAL DES SÉLECTIONS")
print("="*60)

for category, candidates in results.items():
    print(f"\n{category}: {len(candidates)} candidat(s) sélectionné(s)")
    if len(candidates) > 0:
        print(f"   Score moyen: {candidates['final_score'].mean():.3f}")
        print(f"   Meilleur score: {candidates['final_score'].max():.3f}")
        

if __name__ == "__main__":
    print("🎯 SYSTÈME DE FILTRAGE DE CV")
    print("="*60)
    
    # Configuration
    COMPETENCES_REQUISES = [
        "Python", "Java", "JavaScript", "React", "Django",
        "Machine Learning", "SQL", "Git", "Docker", "AWS",
        "Data Science", "Flutter", "Node.js", "Angular"
    ]
    
    CRITERES_FILTRAGE = {
        "min_competences": 2,
        "min_experience": 1,
        "email_requis": True,
        "photo_requise": False
    }
    
    