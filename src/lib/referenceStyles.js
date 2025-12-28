// /src/lib/referenceStyles.js
// Reference citation styles configuration

export const REFERENCE_STYLES = {
  apa: {
    id: 'apa',
    name: 'APA Style',
    fullName: 'American Psychological Association',
    icon: '📘',
    bestFor: 'Social Sciences, Education, Psychology, Business',
    description: 'Most common in social sciences and education',
    inTextFormat: '(Author, Year)',
    referenceFormat: 'Author, A. A. (Year). Title of work. Publisher.',
    examples: {
      book: 'Adeyemi, T. A. (2021). Modern Electronic Systems Design. Lagos: Tech Publishers.',
      journal: 'Okafor, C. N. & Bello, S. M. (2022). Microcontroller Applications in Embedded Systems. Journal of Nigerian Engineering, 15(3), 45-62.',
      inText: 'According to Adeyemi (2021), the system performs... or Studies show that... (Okonkwo, 2022).'
    }
  },

  ieee: {
    id: 'ieee',
    name: 'IEEE Style',
    fullName: 'Institute of Electrical and Electronics Engineers',
    icon: '⚡',
    bestFor: 'Engineering, Computer Science, IT, Technology',
    description: 'Standard for engineering and technical fields',
    inTextFormat: '[1], [2], [3]',
    referenceFormat: '[1] A. A. Author, "Title of work," Journal, vol. X, no. Y, pp. Z-Z, Year.',
    examples: {
      book: '[1] T. A. Adeyemi, Modern Electronic Systems Design. Lagos: Tech Publishers, 2021.',
      journal: '[2] C. N. Okafor and S. M. Bello, "Microcontroller applications in embedded systems," Journal of Nigerian Engineering, vol. 15, no. 3, pp. 45-62, 2022.',
      inText: 'The system architecture [1] demonstrates... Multiple studies [2], [3], [4] have shown...'
    }
  },

  harvard: {
    id: 'harvard',
    name: 'Harvard Style',
    fullName: 'Harvard Referencing System',
    icon: '🎓',
    bestFor: 'Sciences, Humanities, UK Universities',
    description: 'Popular in UK universities and sciences',
    inTextFormat: '(Author Year)',
    referenceFormat: 'Author, A.A. (Year) Title of work. City: Publisher.',
    examples: {
      book: 'Adeyemi, T.A. (2021) Modern Electronic Systems Design. Lagos: Tech Publishers.',
      journal: 'Okafor, C.N. and Bello, S.M. (2022) Microcontroller applications in embedded systems. Journal of Nigerian Engineering, 15(3), pp. 45-62.',
      inText: 'According to Adeyemi (2021)... or Studies show (Okonkwo 2022) that...'
    }
  },

  none: {
    id: 'none',
    name: 'No References',
    fullName: 'No Citation Style',
    icon: '✏️',
    bestFor: 'Manual editing, Custom requirements',
    description: 'Generate report without references - add your own later',
    inTextFormat: 'N/A',
    referenceFormat: 'No references will be generated',
    examples: {
      book: 'No references will be included in the generated content.',
      journal: 'You can add your own references manually during editing.',
      inText: 'Content will be generated without in-text citations.'
    }
  }
};

// Get style by ID
export function getReferenceStyle(styleId) {
  return REFERENCE_STYLES[styleId] || REFERENCE_STYLES.apa;
}

// Get all styles as array
export function getAllReferenceStyles() {
  return Object.values(REFERENCE_STYLES);
}

// Get style options for dropdown
export function getReferenceStyleOptions() {
  return [
    { value: 'apa', label: 'APA Style (Social Sciences, Education)', icon: '📘' },
    { value: 'ieee', label: 'IEEE Style (Engineering, IT)', icon: '⚡' },
    { value: 'harvard', label: 'Harvard Style (Sciences, Humanities)', icon: '🎓' },
    { value: 'none', label: 'No References (Add manually)', icon: '✏️' }
  ];
}