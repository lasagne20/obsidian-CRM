# Changelog

All notable changes to the Obsidian CRM Plugin will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.4] - 2026-10-19

### 🐛 Fixed

#### Multi-File Selection (fuzzy search)
- **Enter now selects directly**: pressing Enter on the active suggestion adds the item and validates immediately (no more Ctrl+Space then Enter required)
- **Root cause fixed**: Obsidian calls `close()` BEFORE `onChooseItem`, so the final selection was built too early (always empty) and `onChooseMulti` was never called — the selection is now built inside the timeout, after Obsidian has registered the chosen item
- **Robust error handling in `selectMultipleFile`**: `getFromFile` failures are now caught and logged instead of leaving the promise unresolved forever (the add button silently did nothing)
- **Notice on load errors**: when a selected file cannot be resolved to a class, the user sees the error and the file is skipped instead of blocking the whole selection
- **Fixed keydown listener leak**: `removeEventListener` never matched the handler because `bind()` created a new function on each call; the handler is now bound once in the constructor
- **Ctrl+Space multi-select kept**: toggle multiple files without closing, then confirm with Enter or Escape

#### Library `markdown-crm` (bundled)
- **Nested ObjectProperty reload fixed**: `ObjectProperty` and `MultiFileProperty` now store their container reference (`containerElement`) for reliable reload in nested structures (e.g. actions → financeurs → contacts)
- **Empty selection logging**: `MultiFileProperty.addProperty` logs a warning and returns early when no file resolves, instead of failing silently

## [1.0.0] - 2026-01-01

### 🎉 First Major Release

Major stable release with enhanced functionality, improved performance, and new features.

### ✨ Added

#### Core Features
- **Enhanced File/Folder Management**: Complete support for folder operations including move, delete, and rename
- **Folder Notes System**: Automatic folder note creation and management with configurable positioning (inside/outside)
- **Smart Folder-File Synchronization**: Automatic folder renaming when associated folder notes are renamed
- **Advanced URL Fragment Handling**: Support for opening files with URL fragments (#animations[0])
- **Comprehensive Property Configuration**: Full tooltip and title support for all property types

#### Interface Improvements
- **Enhanced CSS Styling**: Improved property alignment with icon positioning on same line as content
- **Refresh Functionality**: Settings panel refresh button for vault synchronization
- **Better Visual Feedback**: Enhanced folder styles with underline indicators for folder notes
- **Improved Error Handling**: Better error messages and logging throughout the system

#### Data Management
- **Geographic Data Integration**: Complete French geographic data with proper encoding (regions, departments, communes)
- **Region Code Standardization**: Official region abbreviations (AURA, HDF, PACA, etc.) with proper encoding
- **UTF-8 Encoding Fixes**: Resolved all character encoding issues in geographic data

#### Developer Experience
- **Enhanced TypeScript Support**: Improved type definitions and better IDE support
- **Separated Concerns**: Split file and folder operations into dedicated methods (getFile/getFolder)
- **Better Debugging**: Enhanced logging and error tracking for troubleshooting

### 🔄 Changed
- **Improved Move Operations**: Enhanced folder moving with better validation and logging
- **Optimized Performance**: Better handling of large folder structures and file operations
- **Refined UI Components**: More consistent and accessible user interface elements

### 🐛 Fixed
- **Encoding Issues**: Resolved UTF-8 character display problems in French geographic data
- **Folder Operations**: Fixed folder moving and renaming with non-empty directories
- **Link Updates**: Preserved Obsidian's automatic link correction during file operations
- **Memory Leaks**: Better cleanup of event listeners and observers

### 📚 Documentation
- **Updated Configuration Examples**: Better examples for property configurations
- **Enhanced README**: More comprehensive setup and usage instructions

## [0.1.0] - 2025-11-16

### 🎉 Initial Beta Release

First public beta release of Obsidian CRM with core functionality.

### ✨ Added

#### Core Features
- **Dynamic Class System**: YAML-based class configuration with full customization
- **Rich Property Types**: Support for 15+ property types (Email, Phone, File, MultiFile, Select, Rating, Date, etc.)
- **External Data Integration**: Load and create files automatically from JSON data sources
- **Intelligent Search Modal**: `FileSearchModal` with smart search across multiple fields
- **Recursive Creation**: Automatic creation of parent hierarchy and folder structure
- **Folder Management**: `FileFolderManager` with 321 folder notes support
  - Underline folders containing files
  - Hide folder notes
  - Click-to-open functionality

#### Data Management
- **Geographic Data Support**: 36,360 French administrative divisions (regions, departments, communes)
- **Dynamic Data Reloading**: Automatic refresh when data files change
- **Parent Resolution**: Intelligent parent linking and hierarchy creation
- **Multi-field Search**: Search by name, title, postal code, and name parts

#### UI/UX
- **Custom Display Containers**: Line, column, tabs, and fold layouts
- **Modal System**: Improved modals for file search and creation
- **Visual Feedback**: Icons, colors, and hover states
- **Rating Property**: Star rating system with proper SVG styling

#### Developer Experience
- **395 Automated Tests**: 100% passing test suite
- **Code Coverage**: >95% code coverage
- **TypeScript**: Full TypeScript implementation
- **Modular Architecture**: Clean separation of concerns
- **Comprehensive Documentation**: README, Wiki, and inline comments

### 🏗️ Architecture

#### New Components
- `FileSearchModal`: Smart file search with data integration
- `ClassFileModals`: Helper class for class file operations (220 lines)
- `FileFolderManager`: Centralized folder note management
- `ConfigLoader`: YAML configuration loading with data support
- `ClassConfigManager`: Dynamic class creation and management
- `DynamicClassFactory`: Instance creation from data with parent resolution

#### Refactoring
- **main.ts**: Reduced from 740 to 551 lines (-26%)
- Moved folder note logic to `FileFolderManager`
- Moved class file modals to `ClassFileModals`
- Improved code organization and maintainability

### 🐛 Fixed
- Star rating icons now display correctly (fill + stroke CSS)
- Metadata update timing issues resolved
- File creation from geo.json data working properly
- Search now finds items by title, postal code, and name parts
- Folder creation before file creation prevents ENOENT errors

### 🔧 Technical Details

#### Configuration
- **configPath**: `Outils/Obsidian/Config`
- **dataPath**: `Outils/Obsidian/Data`
- **Automatic path resolution**: Config/Data folder structure

#### Data Format
```json
{
  "nom": "59000 - Lille",
  "title": "Lille",
  "type": "Commune",
  "parent": "Métropole Européenne de Lille",
  "code_postal": "59000",
  "code_insee": "59350"
}
```

#### Search Logic
- Search in `title` field (e.g., "Lille")
- Search in `code_postal` field (e.g., "59000")
- Search in `nom` field (e.g., "59000 - Lille")
- Search in name parts after " - " (e.g., "Lille" from "59000 - Lille")

### 📦 Dependencies
- `obsidian`: ^1.7.2
- `markdown-crm`: ^1.0.0 (commit 5b82607)
- `js-yaml`: ^4.1.0
- Full TypeScript support

### 🧪 Testing
- **Test Suites**: 395 tests passing
- **Coverage**: >95% code coverage
- **Test Types**:
  - Unit tests for all components
  - Integration tests for workflows
  - Configuration validation tests
  - DOM/UI interaction tests
  - Regression tests

### 📝 Documentation
- Comprehensive README with examples
- Wiki documentation structure
- Inline code comments
- Type definitions for all APIs
- Migration guides

### ⚠️ Known Issues
- None reported in this release

### 🔮 Coming Next (v0.2)
- Improved error handling
- UI configuration interface
- Additional property types
- Performance optimizations
- More data source formats

---

**Full Changelog**: https://github.com/lasagne20/obsidian-CRM/commits/v0.1.0
