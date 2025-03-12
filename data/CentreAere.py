
from bs4 import BeautifulSoup
import requests
import json
from playwright.sync_api import sync_playwright

from ftfy import fix_text
import chardet



def fetch_centers_by_city(city: str, codes = []):
    proxyUrl = "http://localhost:3000/proxy?url="
    url = f"https://centreaere.fr/recherche?q={city}"
    current_page = 1  # Commencer à la première page
    centers = []
    center_names = []
    while True:
        print(f"Fetching page {current_page}...")
        
        response = requests.get(proxyUrl + url)
        if (str(response) != "<Response [200]>"):
            raise Exception("Too many request, stop")
        
        raw_data = response.content
        encoding_detected = chardet.detect(raw_data)["encoding"]

        print(f"Encodage détecté : {encoding_detected}")

        content = raw_data.decode(encoding_detected).encode("utf-8").decode("utf-8")
        soup = BeautifulSoup(content, "html.parser")

        
        elements = soup.select("#centres .item") + soup.select(".items .item")
        for item in elements:
            name = item.select_one("h3 a").text.strip() if item.select_one("h3 a") else None
            address = item.select_one("p.sub").text.strip() if item.select_one("p.sub") else None

            link = "https://centreaere.fr" + item.select_one("h3 a")["href"] if item.select_one("h3 a") else None

            if name and address and link and validate_adress(address, codes) and name not in center_names:
                centers.append({"name":name, "address" : address, "link" :link})
                center_names.append(name)

        print(f"🔍 {len(centers)} centres trouvés.")
        # Récupération des emails
        for center in centers:
            email = fetch_center_email(center["link"])
            center["email"] = email

        pagination = soup.select_one(".pagination a[rel='next']")
        if pagination:
            # Si une page suivante est présente, passer à la page suivante
            next_page_url = "https://centreaere.fr" + pagination["href"]
            url = next_page_url  # Mettre à jour l'URL avec celle de la page suivante
            current_page += 1  # Incrémenter le numéro de page
        else:
            # Si aucune page suivante, terminer la boucle
            break
    return centers


def fetch_center_email(center_url: str):
    with sync_playwright() as p:
        # Lancement du navigateur en mode headless
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Accès à l'URL et attente du chargement complet du DOM
        page.goto(center_url, wait_until="domcontentloaded")
        
        # Attente explicite pour s'assurer que l'élément est présent
        try:
            page.wait_for_selector("a.malto", timeout=2000)  # Assurez-vous que l'élément 'a.malto' existe
        except Exception as e:
            print("Pas d'email pour "+ center_url)
            return ""

        page.evaluate('''
            document.querySelectorAll('.malto').forEach(function(malto) {
                malto.innerText = malto.innerText.replace(/ⓐ/g, "@");
                malto.href = 'mailto:' + malto.innerText;
            });
        ''')
        # Récupération de l'email
        email = page.evaluate('''() => {
            const emailLink = document.querySelector("a.malto");
            return emailLink ? emailLink.getAttribute("href").replace("mailto:", "").trim() : "";
        }''')

        print(f"Email récupéré: {email}")
        browser.close()

        return email
    
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

def fetch_and_save_centers(communes, centre_aere_file: str):
    """Récupère les centres aérés pour chaque commune et les enregistre dans centre_aere_file"""
    
    try:
        # Charger les données existantes (évite d'écraser les anciennes données)
        with open(centre_aere_file, "r") as file:
            centre_data = json.load(file)
    except FileNotFoundError:
        centre_data = {}

    for commune in communes:
        commune_codesPostaux = commune["codesPostaux"]
        commune_code = commune["code"]
        commune_name = commune["nom"]

        if commune_code in centre_data:
            print(f"Centres déjà enregistrés pour {commune_name}.")
            continue

        print(f"Recherche des centres aérés pour {commune_name} (Code: {commune_code})")
        # Appel de la fonction pour récupérer les centres
        centers = fetch_centers_by_city(commune_name, commune_codesPostaux)
        centre_data[commune_code] = centers

        # Sauvegarde progressive pour éviter de perdre les données en cas d’interruption
        with open(centre_aere_file, "w", encoding="utf-8") as file:
            json.dump(centre_data, file, ensure_ascii=False, indent=4)
            print(f"Fichier {centre_aere_file} mis à jour.")


def count_centers(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    total_centers = sum(len(centers) for centers in data.values())
    
    print(f"Nombre total de centres de loisirs : {total_centers}")
    return total_centers

#fetch_centers_by_city("38000")
# Exemple d'utilisation

geo_file = "geo.json"
centre_aere_file = "centre_aere2.json"

communes = get_communes_by_departement(geo_file, "38")
# Exemple d'utilisation
#fetch_and_save_centers(communes, centre_aere_file)
#count_centers(centre_aere_file)

import json

def fix_encoding(text):
    """Corrige les problèmes d'encodage."""
    if isinstance(text, str):
        return text.encode("latin1", errors='ignore').decode("utf-8", errors='ignore')
    return text

def correct_json_encoding(file_path):
    """Corrige l'encodage des noms et adresses des centres de loisirs et compte leur nombre."""
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    total_centers = 0

    for postal_code, centers in data.items():
        for center in centers:
            center["name"] = fix_encoding(center["name"])
            center["address"] = fix_encoding(center["address"])
            total_centers += 1

    with open(file_path, "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=4)

    print(f"Nombre total de centres de loisirs : {total_centers}")
    return total_centers

def validate_adress(address, codes):
    for code in codes:
        if code in address:
            return True
    return False

def remove_duplicate_centers(file_path, geo_file, output_file):
    """Supprime les centres en double si le nom de la ville n'est pas présent dans l'adresse et valide les adresses."""
    with open(file_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    with open(geo_file, "r", encoding="utf-8") as file:
        geo_data = json.load(file)

    def get_commune_by_code(postal_code):
        for region_data in geo_data["National"].values():
            for departement_data in region_data["departements"].values():
                for epci_data in departement_data["epci"].values():
                    for commune in epci_data["communes"]:
                        if postal_code == commune["code"]:
                            return commune["nom"]
        return None

    unique_centers = {}
    for code, centers in data.items():
        seen = set()
        unique_centers[code] = []
        for center in centers:
            commune_name = get_commune_by_code(code)
            if commune_name:
                identifier = (center["address"], center["name"])
                if identifier not in seen:
                    if commune_name in center["address"]:
                        center["name"] = fix_encoding(center["name"])
                        center["address"] = fix_encoding(center["address"])
                        unique_centers[code].append(center)
                        seen.add(identifier)

    with open(output_file, "w", encoding="utf-8") as file:
        json.dump(unique_centers, file, ensure_ascii=False, indent=4)

    print(f"Les centres en double ont été supprimés et les adresses validées. Résultats enregistrés dans {output_file}.")
    return unique_centers

#remove_duplicate_centers(centre_aere_file, geo_file, "unique_centres.json")

#correct_json_encoding(centre_aere_file)



def replace_commune_codes_with_names(geo_file_path, centre_aere_file_path):
    """Remplace les codes de communes dans centre_aere_file par le nom de la commune avec son premier code postal."""
    with open(geo_file_path, "r", encoding="utf-8") as geo_file:
        geo_data = json.load(geo_file)

    with open(centre_aere_file_path, "r", encoding="utf-8") as centre_aere_file:
        centre_data = json.load(centre_aere_file)

    def get_commune_name_and_postal_code(commune_code):
        for region_data in geo_data["National"].values():
            for departement_data in region_data["departements"].values():
                for epci_data in departement_data["epci"].values():
                    for commune in epci_data["communes"]:
                        if commune["code"] == commune_code:
                            return commune["codesPostaux"][0] + " - " + commune["nom"]
        return None

    updated_centre_data = {}
    for commune_code, centers in centre_data.items():
        commune_name_and_postal_code = get_commune_name_and_postal_code(commune_code)
        if commune_name_and_postal_code:
            updated_centre_data[commune_name_and_postal_code] = centers

    with open(centre_aere_file_path, "w", encoding="utf-8") as centre_aere_file:
        json.dump(updated_centre_data, centre_aere_file, ensure_ascii=False, indent=4)

    print(f"Les codes de communes ont été remplacés par les noms de communes avec leur premier code postal dans {centre_aere_file_path}.")
    return updated_centre_data

# Exemple d'utilisation
replace_commune_codes_with_names("geo.json", "unique_centres.json")