# UI Design Standards - POS System

## Text Contrast Guidelines

To ensure accessibility and readability, follow these text color standards throughout the application:

### Primary Text Colors
- **Main content**: `text-gray-900` - Dark text for maximum contrast
- **Headings**: `text-gray-900` - Bold, high contrast headings
- **Labels**: `text-gray-900` - Form labels and important descriptive text

### Secondary Text Colors
- **Supporting text**: `text-gray-800` - Slightly lighter but still high contrast
- **Metadata/Info**: `text-gray-700` - For less critical information but still readable
- **Muted text**: `text-gray-600` - Use sparingly, only for truly secondary information

### Avoid These Colors (Poor Contrast)
- ❌ `text-gray-500` - Too light for main content
- ❌ `text-gray-400` - Too light for main content
- ❌ `text-gray-300` - Too light for main content

### Form Elements
- **Form labels**: `text-gray-900` with `font-medium`
- **Input text**: `text-gray-900 bg-white`
- **Input focus**: `focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500`
- **Placeholder text**: Native placeholder styling is acceptable
- **Helper text**: `text-gray-700` (not gray-500)

### Table Headers
- **Table headers**: `text-gray-800` instead of `text-gray-500`
- **Table data**: `text-gray-900` for primary data

### Buttons
- **Primary buttons**: `bg-blue-600 text-white hover:bg-blue-700`
- **Secondary buttons**: `bg-gray-300 text-gray-900 hover:bg-gray-400`
- **Text should always be readable against background**

### Status Colors (These are OK to use)
- **Success**: `text-green-600`, `text-green-700`, `text-green-800`
- **Warning**: `text-yellow-600`, `text-yellow-700`, `text-yellow-800`
- **Error**: `text-red-600`, `text-red-700`, `text-red-800`
- **Info**: `text-blue-600`, `text-blue-700`, `text-blue-800`

## Implementation Checklist

When creating or updating components:

1. ✅ Use `text-gray-900` for primary text content
2. ✅ Use `text-gray-800` for secondary but important text
3. ✅ Use `text-gray-700` for supporting text
4. ✅ Ensure all interactive elements have proper focus states
5. ✅ Test readability on different screen sizes
6. ✅ Use semantic HTML elements when possible

## Examples

### Good Contrast
```tsx
<h1 className="text-2xl font-bold text-gray-900">Page Title</h1>
<p className="text-gray-800">Important description text</p>
<label className="block text-sm font-medium text-gray-900">Form Label</label>
<input className="text-gray-900 bg-white border border-gray-300" />
```

### Poor Contrast (Avoid)
```tsx
<h1 className="text-2xl font-bold text-gray-500">Page Title</h1>
<p className="text-gray-400">Important description text</p>
<label className="block text-sm font-medium text-gray-500">Form Label</label>
```

## Accessibility Notes

- Always maintain at least 4.5:1 contrast ratio for normal text
- Use 3:1 contrast ratio minimum for large text (18pt+ or 14pt+ bold)
- Test with accessibility tools and screen readers
- Consider users with visual impairments

---

**Last Updated**: July 26, 2025
**Applies to**: All POS system components and pages
