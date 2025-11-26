# Kontent.ai PDF Editor Custom Element

A custom element for Kontent.ai that allows content editors to view, markup, edit, and save PDFs directly within the Kontent.ai interface.

## Features

- **PDF Viewing**: View PDFs using Mozilla's PDF.js library
- **Annotations**: Add text annotations, highlights, and drawings to PDFs
- **Page Navigation**: Navigate through multi-page PDFs
- **Zoom Controls**: Zoom in and out for better viewing
- **Save Functionality**: Automatically saves PDF URL/data and annotations to Kontent.ai
- **Asset Integration**: Select PDFs from Kontent.ai asset library

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Kontent.ai project

### Installation

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

3. Run the development server:

```bash
npm run dev
```

4. Build for production:

```bash
npm run build
```

The built files will be in the `dist` folder, which you can deploy to any static hosting service.

## Configuration

When adding this custom element to a content type in Kontent.ai, you can configure the following options:

```json
{
  "allowAnnotations": true,
  "allowTextEditing": true,
  "maxFileSize": 10,
  "allowedFileTypes": ["application/pdf"]
}
```

- `allowAnnotations` (boolean, default: true): Enable/disable annotation features
- `allowTextEditing` (boolean, default: true): Enable/disable text editing features
- `maxFileSize` (number, optional): Maximum file size in MB
- `allowedFileTypes` (array, optional): Allowed file types

## Usage

1. **Select a PDF**: Click "Select PDF Asset" to choose a PDF from your Kontent.ai asset library
2. **View PDF**: The PDF will be displayed with navigation controls
3. **Add Annotations**:
   - Click "Text" to add text annotations
   - Click "Highlight" to add highlight annotations
   - Click "Draw" to draw on the PDF
4. **Navigate**: Use Previous/Next buttons or scroll to navigate pages
5. **Zoom**: Use +/- buttons to zoom in and out
6. **Save**: All changes are automatically saved to Kontent.ai

## Data Structure

The custom element stores data in the following format:

```json
{
  "pdfUrl": "https://...",
  "pdfData": "data:application/pdf;base64,...",
  "annotations": [
    {
      "id": "annotation-...",
      "type": "text|highlight|drawing",
      "page": 1,
      "x": 100,
      "y": 200,
      "width": 100,
      "height": 20,
      "content": "Annotation text",
      "color": "#000000",
      "paths": [{"x": 10, "y": 20}],
      "timestamp": 1234567890
    }
  ],
  "version": 1
}
```

## Technologies Used

- **React**: UI framework
- **TypeScript**: Type safety
- **Vite**: Build tool
- **PDF.js**: PDF rendering library by Mozilla
- **Kontent.ai Custom Element API**: Integration with Kontent.ai

## Development

### Project Structure

```
├── src/
│   ├── components/
│   │   └── PDFViewer.tsx       # Main PDF viewer component
│   ├── customElement/
│   │   ├── CustomElementContext.tsx  # React context for Custom Element API
│   │   ├── hooks.ts            # Custom hooks for element functionality
│   │   ├── selectors.ts        # API selector functions
│   │   ├── config.ts           # Configuration types and validation
│   │   ├── value.ts            # Value types and serialization
│   │   └── types/
│   │       └── customElement.d.ts  # TypeScript definitions
│   ├── IntegrationApp.tsx     # Main application component
│   ├── main.tsx               # Application entry point
│   └── index.css              # Application styles
├── public/
│   └── styles.css             # Kontent.ai compatible styles
├── index.html                 # HTML template
└── package.json               # Dependencies and scripts
```

### Available Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

## Deployment

1. Build the project: `npm run build`
2. Deploy the `dist` folder to a static hosting service (Netlify, Vercel, GitHub Pages, etc.)
3. In Kontent.ai, add a Custom Element to your content type
4. Provide the URL to your deployed custom element

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Resources

- [Kontent.ai Custom Elements Documentation](https://kontent.ai/learn/tutorials/develop-apps/integrate/content-editing-extensions)
- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [Kontent.ai Custom Element Starter](https://github.com/kontent-ai/custom-element-starter-react)
- [Kontent.ai Stylesheet Generator](https://github.com/kontent-ai/stylesheet-generator)

