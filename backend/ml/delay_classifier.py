import os
import sys
import json
import joblib
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, Optional
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, confusion_matrix, classification_report

# Ensure backend directory is in sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from ml.dataset_builder import dataset_builder, FEATURE_COLUMNS

RISK_LABELS = ["ON_TIME", "MINOR_DELAY", "MAJOR_DELAY"]

def to_delay_risk_category(y: pd.Series) -> pd.Series:
    """
    Derives categorical operational risk labels from delay deviation minutes:
    - ON_TIME:      delta <= 10 mins
    - MINOR_DELAY:  10 < delta <= 30 mins
    - MAJOR_DELAY:  delta > 30 mins
    """
    return pd.Series(
        np.where(y <= 10, "ON_TIME", np.where(y <= 30, "MINOR_DELAY", "MAJOR_DELAY")),
        index=y.index,
        name="delay_risk_category"
    )

def train_and_evaluate_delay_classifier(
    X_train: Optional[pd.DataFrame] = None,
    X_test: Optional[pd.DataFrame] = None,
    y_train: Optional[pd.Series] = None,
    y_test: Optional[pd.Series] = None,
    split_info: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Trains and evaluates the Delay-Risk Classifier using RandomForestClassifier(150 trees, max_depth=10).
    Reuses provided train/test split to avoid redundant dataset building when called from train_model.py.
    """
    print("\n=======================================================")
    print("    RAILVUE AI - TRAINING DELAY-RISK CLASSIFIER")
    print("=======================================================")

    # 1. Reuse existing split or obtain new if called standalone
    if X_train is None or X_test is None or y_train is None or y_test is None:
        X_train, X_test, y_train, y_test, split_info = dataset_builder.get_journey_aware_train_test_split()

    # 2. Derive categorical labels
    y_train_cat = to_delay_risk_category(y_train)
    y_test_cat = to_delay_risk_category(y_test)

    print(f"Training distribution across categories:\n{y_train_cat.value_counts().to_dict()}")
    print(f"Testing distribution across categories:\n{y_test_cat.value_counts().to_dict()}")

    # 3. Train Classifier
    clf = RandomForestClassifier(n_estimators=150, max_depth=10, random_state=42)
    clf.fit(X_train[FEATURE_COLUMNS], y_train_cat)

    # 4. Evaluate
    y_pred = clf.predict(X_test[FEATURE_COLUMNS])
    acc = float(accuracy_score(y_test_cat, y_pred))
    macro_f1 = float(f1_score(y_test_cat, y_pred, average="macro"))
    cm = confusion_matrix(y_test_cat, y_pred, labels=RISK_LABELS).tolist()

    print("\n-------------------------------------------------------")
    print(f"Delay-Risk Classifier Accuracy: {acc * 100:.2f}%")
    print(f"Macro F1 Score:                {macro_f1:.4f}")
    print(f"Class Label Order:             {RISK_LABELS}")
    print(f"Confusion Matrix (Rows=True, Cols=Pred):\n{np.array(cm)}")
    print("-------------------------------------------------------\n")

    # 5. Persist Model Artifact
    models_dir = os.path.join(backend_dir, "models")
    os.makedirs(models_dir, exist_ok=True)
    clf_path = os.path.join(models_dir, "delay_risk_classifier.pkl")
    joblib.dump(clf, clf_path)
    print(f"[OK] Saved Delay-Risk Classifier to: {clf_path}")

    # 6. Append to model_metadata.json (preserving all existing keys)
    meta_path = os.path.join(models_dir, "model_metadata.json")
    if os.path.exists(meta_path):
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                meta = json.load(f)
        except Exception:
            meta = {}
    else:
        meta = {}

    meta["delay_risk_classifier"] = {
        "model_type": "RandomForestClassifier",
        "saved_model": "delay_risk_classifier.pkl",
        "accuracy": round(acc, 4),
        "macro_f1": round(macro_f1, 4),
        "class_labels": RISK_LABELS,
        "thresholds": {
            "ON_TIME": "<= 10 minutes deviation",
            "MINOR_DELAY": "10-30 minutes deviation",
            "MAJOR_DELAY": "> 30 minutes deviation"
        },
        "confusion_matrix": {
            "labels": RISK_LABELS,
            "matrix": cm
        }
    }

    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)
    print(f"[OK] Appended delay_risk_classifier metadata to: {meta_path}")

    return {
        "accuracy": acc,
        "macro_f1": macro_f1,
        "class_labels": RISK_LABELS,
        "confusion_matrix": cm,
        "saved_path": clf_path,
        "classifier": clf
    }

def predict_delay_risk(feature_dict: Dict[str, Any], model_path: Optional[str] = None) -> str:
    """
    Standalone inference helper to predict categorical delay risk ('ON_TIME', 'MINOR_DELAY', 'MAJOR_DELAY').
    """
    if model_path is None:
        model_path = os.path.join(backend_dir, "models", "delay_risk_classifier.pkl")
    
    if not os.path.exists(model_path):
        delta = float(feature_dict.get("current_delay_minutes", 0.0)) * 0.7
        if delta <= 10:
            return "ON_TIME"
        elif delta <= 30:
            return "MINOR_DELAY"
        return "MAJOR_DELAY"
        
    clf = joblib.load(model_path)
    row = [float(feature_dict.get(col, 0.0)) for col in FEATURE_COLUMNS]
    X_df = pd.DataFrame([row], columns=FEATURE_COLUMNS)
    return str(clf.predict(X_df)[0])

if __name__ == "__main__":
    train_and_evaluate_delay_classifier()
