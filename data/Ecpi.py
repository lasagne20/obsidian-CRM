import requests
from bs4 import BeautifulSoup
import csv

# URL de la page contenant les informations des EPCI
url = 'https://www.38.fr/administrations/collectivite/epci'

# Effectuer une requête GET pour récupérer le contenu de la page
response = requests.get(url)
response.raise_for_status()  # Vérifier que la requête a réussi

# Analyser le contenu HTML avec BeautifulSoup
soup = BeautifulSoup(response.text, 'html.parser')

# Trouver les sections contenant les informations des EPCI
epci_sections = soup.find_all('div', class_='epci-section')

# Ouvrir un fichier CSV en écriture
with open('epci_isere.csv', mode='w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    # Écrire l'en-tête du CSV
    writer.writerow(['Nom de l\'EPCI', 'Adresse', 'Téléphone', 'E-mail', 'Nom du Président'])

    # Parcourir chaque section d'EPCI pour extraire les informations
    for section in epci_sections:
        # Extraire le nom de l'EPCI
        nom = section.find('h2').get_text(strip=True)

        # Extraire l'adresse
        adresse = section.find('p', class_='adresse').get_text(strip=True)

        # Extraire le téléphone
        telephone = section.find('p', class_='telephone').get_text(strip=True)

        # Extraire l'e-mail
        email = section.find('p', class_='email').get_text(strip=True)

        # Extraire le nom du président
        president = section.find('p', class_='president').get_text(strip=True)

        # Écrire les informations dans le fichier CSV
        writer.writerow([nom, adresse, telephone, email, president])

print('Les informations des EPCI de l\'Isère ont été enregistrées dans epci_isere.csv')
