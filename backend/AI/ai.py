import chardet
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import classification_report, accuracy_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import LabelEncoder

# ---------------------------------------------------------
# 1) Charger le dataset
# ---------------------------------------------------------


# Read with detected encoding
CVs = pd.read_csv("utils/Resume.csv")

print("\n✅ Dataset chargé avec succès")
print(f"Nombre de CVs : {len(CVs)}")
print(f"\nColonnes disponibles : {CVs.columns.tolist()}")
print("\n📊 Aperçu du dataset :")
print(CVs.head())
print(CVs.iloc[[1600, 1700, 1800, 1900, 2000, 2200, 2300, 2355]])
print(CVs.tail())
print(CVs.info())

# ---------------------------------------------------------
# 2) Préparer les données
# ---------------------------------------------------------
print("\n🔧 Préparation du texte des CVs...")
CVs['CV_text'] = CVs['Resume_str'].fillna('') + ' ' + CVs['Resume_html'].fillna('')
X = CVs['CV_text']
y= CVs['Category']
le = LabelEncoder()
y = le.fit_transform(y)
print(CVs.columns)
# Split dataset Train/Test
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

# ---------------------------------------------------------
# 3) Construire le pipeline IA
# TF-IDF + Modèle de classification
# ---------------------------------------------------------
model = Pipeline([
    ("tfidf", TfidfVectorizer(stop_words="english")),
    ("clf", LogisticRegression(max_iter=300))
])

# ---------------------------------------------------------
# 4) Entraîner le modèle
# ---------------------------------------------------------
print("\n🔄 Entraînement du modèle...")
model.fit(X_train, y_train)
print("✔ Entraînement terminé.")

# ---------------------------------------------------------
# 5) Évaluer sur le test
# ---------------------------------------------------------
pred = model.predict(X_test)

print("\n📊 Accuracy :", accuracy_score(y_test, pred))
print("\n📌 Rapport de classification :")
print(classification_report(y_test, pred))

# ---------------------------------------------------------
# 6) Fonction pour sélectionner les meilleurs CV selon un poste
# ---------------------------------------------------------
def rank_best_cvs(list_cv_texts, job_description, top_k=3):
    """
    Prend une liste de CV + une description de poste,
    et renvoie les top_k CV classés selon leur pertinence.
    """
    # Ajouter job description comme référence
    all_texts = list_cv_texts + [job_description]

    # Obtenir les scores du modèle
    scores = model.predict_proba(all_texts)

    # Seulement les scores des CV (pas la job description)
    cv_scores = scores[:-1, 1]  # probabilité d'être bon

    # Trier et sélectionner les meilleurs
    best_idx = cv_scores.argsort()[::-1][:top_k]

    return best_idx, cv_scores[best_idx]

# ---------------------------------------------------------
# 7) Exemple d'utilisation
# ---------------------------------------------------------
job_description = """
Nous cherchons un ingénieur IA ayant des compétences en machine learning,
Python, NLP, et data engineering.,"""

cv_list = [
    "Ingénieur logiciel, expérience Java et réseaux. Un peu de Python.",
    "Data Scientist: Python, TensorFlow, NLP, ML, expérience 3 ans.",
    "Technicien réseaux Cisco, virtualisation, pas d'IA."
]

best_ids, best_scores = rank_best_cvs(cv_list, job_description, top_k=2)

print("\n🎯 Meilleurs CV pour le poste :")
for idx, score in zip(best_ids, best_scores):
    print(f"CV {idx} — score {score:.2f}")
