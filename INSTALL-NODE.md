# Installer Node.js 20 (sans nvm)

Next.js 16 demande **Node.js >= 20.9.0**. Si `nvm` n’est pas installé, utilisez une des méthodes suivantes.

## Option 1 : NodeSource (recommandé sur Ubuntu/Debian)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # doit afficher v20.x.x
```

Puis dans le projet :

```bash
cd /home/thierry/Documents/wolopisite
npm run dev
```

## Option 2 : Installer nvm, puis Node 20

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# Redémarrer le terminal, puis :
nvm install 20
nvm use 20
cd /home/thierry/Documents/wolopisite
npm run dev
```

## Option 3 : Binaire officiel depuis nodejs.org

Télécharger Node 20 LTS pour Linux sur https://nodejs.org/, extraire et ajouter le dossier `bin` au `PATH`.

---

**Important :** utilisez toujours **`npm run dev`** (sans caractère en plus, notamment sans `~` à la fin).
