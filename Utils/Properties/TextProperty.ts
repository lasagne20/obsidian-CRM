import { LinkProperty } from "./LinkProperty";
import { Property } from "./Property";
import axios from 'axios';
import AppShim, { TFile, Notice } from '../App';

export class TextProperty extends Property {
  public type: string = "text";

  constructor(name: string, args = {}) {
    super(name, args);
  }

  createFieldInput(value: string) {
    const textarea = document.createElement("textarea");
    textarea.value = value || "";
    textarea.classList.add("field-textarea");
    textarea.rows = 4; // Default number of rows
    textarea.style.resize = "vertical"; // Allow vertical resizing

    // Add autocomplete functionality
    textarea.setAttribute("data-keydown-listener", "false")
    textarea.addEventListener("input", () => this.handleAutocomplete(textarea));

    return textarea;
  }

  createFieldContainer() {
    const field = document.createElement("div");
    field.classList.add("metadata-textfield");
    return field;
  }

  createFieldLink(value: string) {
    const link = document.createElement("div");
    link.innerHTML = value
      ? value.replace(/\[\[(.*?)(?:\|(.*?))?\]\]/g, (_, path, alias) => {
        const display = alias || path;
        return `<strong><a href="#">${display}</a></strong>`;
      })
      : "";
    link.classList.add("field-textlink");
    link.style.cursor = this.static ? "default" : "text";
    if (!this.static) {
      link.addEventListener("click", (event) => this.modifyField(event));
    }

    // Add click event for links
    link.querySelectorAll("a").forEach(anchor => {
      anchor.addEventListener("click", async (event) => {
        event.preventDefault();
        const target = (event.target as HTMLElement).textContent;
        if (target) {
          const classe = this.vault.getFromLink(target);
          if (classe) {
              const leaf = this.vault.app.workspace.getLeaf();
              await leaf.openFile(classe.file);
          } else {
            new Notice(`Le fichier ${target}.md n'existe pas`)
          }
        }
      });
    });

    return link;
  }

  modifyField(event: Event) {
    const link = (event.target as HTMLElement).closest('.metadata-textfield')?.querySelector('.field-textlink') as HTMLElement;
    const input = (event.target as HTMLElement).closest('.metadata-textfield')?.querySelector('.field-textarea') as HTMLInputElement;
    if (link && input) {
      link.style.display = "none";
      input.style.display = "block";
      input.focus();
    }
  }

  handleFieldInput(update: (value: string) => Promise<void>, input: HTMLInputElement | HTMLTextAreaElement, link: HTMLElement) {
    input.addEventListener("blur", async () => {
      if (!input.parentElement?.querySelector(".autocomplete-dropdown")) {
        await this.updateField(update, input, link);
        return;
      }
    });

    input.addEventListener("keydown", async (event) => {
        if ((event as KeyboardEvent).key === "Escape") {
                event.preventDefault();
                await this.updateField(update, input, link);
        }
    });
}


  handleAutocomplete(textarea: HTMLTextAreaElement) {
    let dropdown = textarea.parentElement?.querySelector(".autocomplete-dropdown") as HTMLElement;

    // Remove existing dropdown if present
    if (dropdown) {
      dropdown.remove();
    }

    dropdown = document.createElement("div");
    dropdown.classList.add("autocomplete-dropdown");

    const cursorPosition = textarea.selectionStart || 0;
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    const lastWordMatch = textBeforeCursor.match(/(\S+)$/);
    const query = lastWordMatch ? lastWordMatch[0].toLowerCase() : "";

    if (!query) {
      return; // No query, don't show the dropdown
    }

    const files = this.vault.app.vault.getFiles();
    const suggestions = files.filter((file: TFile) =>
      file.basename?.toLowerCase().includes(query) && this.vault.app.metadataCache.getFileCache(file)?.frontmatter?.Classe 
    );

    if (suggestions.length === 0) {
      return; // No suggestions, don't show the dropdown
    }

    // Calculate the position of the word being edited
    const textBeforeWord = textBeforeCursor.substring(0, lastWordMatch?.index || 0);
    const tempSpan = document.createElement("span");
    tempSpan.style.visibility = "hidden";
    tempSpan.style.whiteSpace = "pre-wrap";
    tempSpan.style.position = "absolute";
    tempSpan.style.font = window.getComputedStyle(textarea).font;
    tempSpan.textContent = textBeforeWord;

    document.body.appendChild(tempSpan);
    const rect = tempSpan.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();
    dropdown.style.top = `${textareaRect.top + rect.height + window.scrollY}px`;
    dropdown.style.left = `${textareaRect.left + rect.width + window.scrollX}px`;
    dropdown.style.width = `${textareaRect.width}px`;
    document.body.removeChild(tempSpan);

    suggestions.forEach((file: TFile, index: number) => {
      const item = document.createElement("div");
      item.classList.add("autocomplete-item");
      item.textContent = file.basename || file.name;
      item.tabIndex = 0; // Make it focusable
      item.dataset.index = index.toString();

      item.addEventListener("click", () => {
        this.insertSuggestion(textarea, `[[${file.path}|${file.basename}]]`, lastWordMatch?.index || 0, query.length);
        dropdown.remove();
      });

      dropdown.appendChild(item);
    });

    textarea.parentElement?.appendChild(dropdown);
    // Adjust the parent's style to position the dropdown correctly
    const parent = textarea.parentElement as HTMLElement;
    parent.style.position = "flex";
    parent.style.flexDirection = "column";

    let selectedIndex = -1;

    const updateSelection = (newIndex: number) => {
      const items = dropdown.querySelectorAll(".autocomplete-item");
      if (selectedIndex >= 0) {
        items[selectedIndex].classList.remove("selected");
      }
      selectedIndex = newIndex;
      if (selectedIndex >= 0 && selectedIndex < items.length) {
        items[selectedIndex].classList.add("selected");
        items[selectedIndex].scrollIntoView({ block: "nearest" });
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const items = dropdown.querySelectorAll(".autocomplete-item");
      if (event.key === "ArrowDown") {
        event.preventDefault();
        updateSelection((selectedIndex + 1) % items.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        updateSelection((selectedIndex - 1 + items.length) % items.length);
      } else if (event.key === "Escape") {
        dropdown.remove();
        textarea.removeEventListener("keydown", handleKeyDown); // Clean up event listener
        textarea.removeEventListener("keydown", handleEnter)
      }
    };
    let isEnterHandled = false;
    const handleEnter = (event: KeyboardEvent) => {
      const items = dropdown.querySelectorAll(".autocomplete-item");
      if (event.key === "Enter") {
        if (isEnterHandled) return; // Empêche l'exécution multiple
        isEnterHandled = true;
        textarea.removeEventListener("keydown", handleKeyDown)
        textarea.removeEventListener("keydown", handleEnter)
        dropdown.remove();
        event.preventDefault();
        const items = dropdown.querySelectorAll(".autocomplete-item");
        if (selectedIndex >= 0 && selectedIndex < items.length) {
          const selectedItem = items[selectedIndex];
          const suggestion = selectedItem.textContent || "";
          this.insertSuggestion(textarea, `[[${suggestion}]]`, lastWordMatch?.index || 0, query.length);
        }
        
      }
    }
    
    if (!textarea.hasAttribute("data-keydown-listener")) {
      textarea.addEventListener("keydown", handleKeyDown);
      textarea.addEventListener("keydown", handleEnter);
      textarea.setAttribute("data-keydown-listener", "true");
    }

    const removeDropdown = () => {
      dropdown.remove();
      textarea.removeEventListener("keydown", handleKeyDown);
    };

    document.addEventListener("click", (event) => {
      if (!dropdown.contains(event.target as Node) && event.target !== textarea) {
        removeDropdown();
      }
    }, { once: true });
  }

  insertSuggestion(textarea: HTMLTextAreaElement, suggestion: string, startIndex: number, queryLength: number) {
    console.log(textarea, suggestion, startIndex, queryLength);
    const before = textarea.value.substring(0, startIndex);
    const after = textarea.value.substring(startIndex + queryLength);
    textarea.value = `${before}${suggestion}${after}`;
    textarea.setSelectionRange(before.length + suggestion.length, before.length + suggestion.length);
    textarea.focus();
  }
}
