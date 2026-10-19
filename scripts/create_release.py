"""
create_release.py - Cree une release GitHub pour le plugin obsidian-CRM
avec ses assets (main.js, manifest.json, styles.css), necessaires a BRAT.

Usage (depuis la racine du plugin) :
    export GH_TOKEN=$(printf "protocol=https\nhost=github.com\n" | git credential fill | grep "^password=" | cut -d= -f2)
    python scripts/create_release.py <X.Y.Z>

Le token GitHub est fourni via la variable d'environnement GH_TOKEN.
La description de la release est extraite automatiquement de la section
## [<X.Y.Z>] du CHANGELOG.md.

Idempotent : si la release existe deja pour ce tag, les assets manquants
sont completes au lieu d'echouer.
"""
import json
import os
import re
import sys
import urllib.error
import urllib.request

REPO = 'lasagne20/obsidian-CRM'
ASSETS = ['main.js', 'manifest.json', 'styles.css']


def api_request(url, token, data=None, content_type='application/json', method='POST'):
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            'Authorization': f'token {token}',
            'Accept': 'application/vnd.github+json',
            'Content-Type': content_type
        },
        method=method
    )
    return urllib.request.urlopen(req)


def get_release_by_tag(token, tag):
    try:
        with api_request(
            f'https://api.github.com/repos/{REPO}/releases/tags/{tag}',
            token, method='GET'
        ) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def create_or_get_release(token, version, body):
    tag = f'v{version}'
    existing = get_release_by_tag(token, tag)
    if existing:
        print(f"Release existante trouvee pour {tag} : {existing['html_url']}")
        return existing

    payload = {
        'tag_name': tag,
        'name': tag,
        'body': body,
        'draft': False,
        'prerelease': False
    }
    with api_request(
        f'https://api.github.com/repos/{REPO}/releases',
        token,
        data=json.dumps(payload).encode()
    ) as r:
        release = json.loads(r.read())
    print(f"Release creee : {release['html_url']}")
    return release


def upload_assets(token, release_id):
    existing_assets = set()
    try:
        with api_request(
            f'https://api.github.com/repos/{REPO}/releases/{release_id}/assets',
            token, method='GET'
        ) as r:
            existing_assets = {a['name'] for a in json.loads(r.read())}
    except urllib.error.HTTPError:
        pass

    for fname in ASSETS:
        if not os.path.isfile(fname):
            sys.exit(f"ERREUR : fichier manquant {fname} (executer depuis la racine du plugin)")
        if fname in existing_assets:
            print(f"Asset deja present, ignore : {fname}")
            continue
        with open(fname, 'rb') as f:
            data = f.read()
        with api_request(
            f'https://uploads.github.com/repos/{REPO}/releases/{release_id}/assets?name={fname}',
            token,
            data=data,
            content_type='application/octet-stream'
        ) as r:
            asset = json.loads(r.read())
        print(f"Asset uploade : {asset['name']} ({asset['size']} bytes)")


def extract_changelog_section(version):
    if not os.path.isfile('CHANGELOG.md'):
        return f'v{version}'
    with open('CHANGELOG.md', encoding='utf-8') as f:
        content = f.read()
    m = re.search(rf'(## \[{re.escape(version)}\].*?)(?=\n## \[)', content, re.DOTALL)
    if not m:
        print(f"AVERTISSEMENT : section ## [{version}] absente du CHANGELOG.md")
        return f'v{version}'
    return m.group(1).strip()


def main():
    if len(sys.argv) < 2:
        sys.exit(f"Usage : python {sys.argv[0]} <X.Y.Z>")
    version = sys.argv[1]

    token = os.environ.get('GH_TOKEN')
    if not token:
        sys.exit("ERREUR : variable d'environnement GH_TOKEN absente")

    body = extract_changelog_section(version)
    release = create_or_get_release(token, version, body)
    upload_assets(token, release['id'])
    print(f"Termine : {release['html_url']}")


if __name__ == '__main__':
    main()
