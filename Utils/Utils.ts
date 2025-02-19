function addMissingBrackets(input: string): string {
    // Vérifie si la chaîne commence et se termine par [[...]]
    const regex = /^\[\[([^\[\]]+)\]\]$/;
  
    // Si déjà au bon format, retourne tel quel
    if (regex.test(input)) {
      return input;
    }
  
    // Sinon, ajouter les crochets manquants
    return `[[${input}]]`;
  }