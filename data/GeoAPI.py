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
    url = "https://geo.api.gouv.fr/communes?fields=nom,code,departement,region,epci,population,siren,codesPostaux,centre"
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
        centre = commune.get("centre", {})
        latitude = centre.get("coordinates", [None, None])[0] if "coordinates" in centre else None
        longitude = centre.get("coordinates", [None, None])[1] if "coordinates" in centre else None

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
            "codesPostaux": commune.get("codesPostaux"),
            "population": commune.get("population"),
            "siren": commune.get("siren"),
            "latitude": latitude,
            "longitude": longitude
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

    # Ajouter les contours des départements
    for region_data in data[NATIONAL].values():
        for departement_name, departement_data in region_data['departements'].items():
            departement_code = departement_data['code']
            contour = getContourDepartement(departement_code)
            print(contour)
            if contour:
                departement_data['geodata'] = contour
    # Sauvegarder les données mises à jour dans le fichier JSON
    try:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=4)
        print("✅ Le fichier JSON a été mis à jour avec succès.")
    except Exception as e:
        print(f"❌ Erreur lors de l'enregistrement du fichier JSON: {e}")

def getContourDepartement(departement_code: str):
    """
    Récupère le contour géographique d'un département depuis le fichier GeoJSON de france-geojson.gregoiredavid.fr.

    Args:
        departement_code (str): Le code du département.

    Returns:
        dict or None: Les données GeoJSON du contour si succès, sinon None.
    """
    url = "https://france-geojson.gregoiredavid.fr/repo/departements.geojson"
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        geojson = response.json()
        for feature in geojson.get("features", []):
            if feature.get("properties", {}).get("code") == departement_code:
                # TODO pk les data sont inverser dans la carte ? 
                # Inverser les coordonnées (longitude, latitude) -> (latitude, longitude)
                geometry = feature.get("geometry", {})
                if geometry.get("type") == "Polygon":
                    geometry["coordinates"] = [
                        [[lat, lon] for lon, lat in ring] for ring in geometry["coordinates"]
                    ]
                elif geometry.get("type") == "MultiPolygon":
                    geometry["coordinates"] = [
                        [
                            [[lat, lon] for lon, lat in ring]
                            for ring in polygon
                        ]
                        for polygon in geometry["coordinates"]
                    ]
                feature["geometry"] = geometry
                return feature
        print(f"❌ Contour non trouvé pour le département {departement_code}")
        return None
    except requests.RequestException as e:
        print(f"❌ Impossible de récupérer le contour pour le département {departement_code} : {e}")
        return None


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
