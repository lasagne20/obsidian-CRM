
import json
import pandas as pd

def get_departement_data(data, departement_code: str):
    data = data["National"]
    for region_data in data.values():
        for departement_data in region_data["departements"].values():
            if departement_data["code"] == departement_code:
                return departement_data
            


def process(geo_file: str, te38_file, export_file: str):
    """Extrait les communes d’un département donné à partir du fichier geo_file"""
    with open(geo_file, "r", encoding="utf-8") as file:
        data = json.load(file)

    te38_content = pd.read_csv(te38_file, encoding="utf-8")
    isere = get_departement_data(data, "38")
    communes_dict = {}
    for epci_data in isere["epci"].values():
        for commune in epci_data["communes"]:
            te38_infos = te38_content[te38_content["Insee (ou Siren) "].apply(str) == commune["code"]]
            if te38_infos.shape[0] > 0:
                commune_info = {
                    "Partenariats": ["[[Partenariat TE38]]"],
                    "Adresse": te38_infos["Adresse complète"].values[0].lower(),
                    "Telephone": str(te38_infos["Téléphone"].values[0]),
                    "Email": te38_infos["Mail"].values[0]
                }
            else:
                commune_info = {
                }
            communes_dict[f"{commune['codesPostaux'][0]} - {commune['nom']}"] = commune_info
    with open(export_file, 'w', encoding='utf-8') as f:
        json.dump(communes_dict, f, ensure_ascii=False, indent=4)

geo_file = "geo.json"
export_file = "te38.json"
te38_file = "Archives/MEMBRES_20250226_TE38.csv"

process(geo_file, te38_file, export_file)



