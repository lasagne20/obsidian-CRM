import requests
import json

NATIONAL = "National"

def update_json_hierarchy(file_path: str):
    # Charger le fichier JSON existant
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print("❌ Le fichier n'a pas été trouvé.")
        data = {}

    data[NATIONAL] = {}

    # Récupérer les communes depuis l'API géographique
    url = "https://geo.api.gouv.fr/communes?fields=nom,code,departement,region,epci,population,siren,codesPostaux"
    response = requests.get(url)

    if response.status_code != 200:
        print("❌ Erreur : impossible de récupérer les données.")
        return

    communes = response.json()

    # Organiser les données dans la hiérarchie : région -> département -> epci -> commune
    for commune in communes:
        region_nom = commune.get("region", {}).get("nom")
        region_code = commune.get("region", {}).get("code")
        departement_nom = commune.get("departement", {}).get("nom")
        departement_code = commune.get("departement", {}).get("code")
        epci_nom = commune.get("epci", {}).get("nom")
        commune_nom = commune.get("nom")
        commune_code = commune.get("code")

        
        # Ajouter la région si elle n'existe pas
        if region_nom not in data[NATIONAL]:
            data[NATIONAL][region_nom] = {
                'code': region_code,
                'departements': {}
            }

        region = data[NATIONAL][region_nom]
        # Ajouter le département si nécessaire
        if departement_nom not in region['departements']:
            region['departements'][departement_nom] = {
                'code': departement_code,
                'communes': [],
                'epci': {}
            }

        departement = region['departements'][departement_nom]

        # Ajouter la commune
        commune_obj = {
            'nom': commune_nom,
            'code': commune_code,
            "codesPostaux" : commune.get("codesPostaux"),
            "population" : commune.get("population"),
            "siren" : commune.get("siren")
        }
        # Ajouter l'EPCI si nécessaire
        if epci_nom:
            if epci_nom not in departement['epci']:
                departement['epci'][epci_nom] = {
                    'communes': []
                }
            departement['epci'][epci_nom]['communes'].append(commune_obj)
        else:
            departement['communes'].append(commune_obj)


    # Sauvegarder les données mises à jour dans le fichier JSON
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print("✅ Le fichier JSON a été mis à jour avec succès.")
    except Exception as e:
        print(f"❌ Erreur lors de l'enregistrement du fichier JSON: {e}")

def get_communes_by_departement(geo_file: str, departement_code: str):
    """Extrait les communes d’un département donné à partir du fichier geo_file"""
    with open(geo_file, "r") as file:
        data = json.load(file)

    communes = []
    for region_data in data["National"].values():
        for departement_name, departement_data in region_data["departements"].items():
            if departement_data["code"] == departement_code:
                for epci_data in departement_data["epci"].values():
                    communes.extend(epci_data["communes"])
    
    return communes



if __name__ == "__main__":
    update_json_hierarchy('geo.json')
