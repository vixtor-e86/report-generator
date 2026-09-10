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

  mla: {
    id: 'mla',
    name: 'MLA Style',
    fullName: 'Modern Language Association',
    icon: '📚',
    bestFor: 'Humanities, Literature, Art, Cultural Studies',
    description: 'Most common in humanities and liberal arts',
    inTextFormat: '(Author Page)',
    referenceFormat: "Author's Last Name, First Name. \"Title of Work.\" Publisher/Journal, Year, Pages.",
    examples: {
      book: 'Adeyemi, Temitope A. Modern Electronic Systems Design. Tech Publishers, 2021.',
      journal: 'Okafor, Chukwuma N., and Sani M. Bello. "Microcontroller Applications in Embedded Systems." Journal of Nigerian Engineering, vol. 15, no. 3, 2022, pp. 45-62.',
      inText: 'According to Adeyemi, modern electronic design... (45) or Studies show microcontroller efficiency (Okafor and Bello 52).'
    }
  },

  oscola: {
    id: 'oscola',
    name: 'OSCOLA Style',
    fullName: 'Oxford Standard for the Citation of Legal Authorities',
    icon: '⚖️',
    bestFor: 'Law, Legal Studies, Jurisprudence, Human Rights, Criminology',
    description: 'Oxford standard for legal citations with numbered footnotes at bottom of page',
    inTextFormat: 'Footnote [^1], [^2]',
    referenceFormat: "Author, Title (Publisher Year) / Case Name [Year] Report Page / Act Name Year, s X",
    examples: {
      book: 'Timothy Adebayo, Nigerian Constitutional Law (2nd edn, Spectrum Books 2021) 45.',
      journal: "Chukwuma Okafor, 'Corporate Governance in Nigerian Banking' (2022) 14(2) Nigerian Law Journal 89.",
      case: 'Fawehinmi v Abacha [1996] 9 NWLR (Pt 475) 710.',
      statute: 'Companies and Allied Matters Act 2020, s 18.',
      inText: 'The legal precedent established statutory enforcement.[^1] Subsequent reforms strengthened compliance.[^2]'
    }
  },

  chicago: {
    id: 'chicago',
    name: 'Chicago Style (Footnotes)',
    fullName: 'Chicago Manual of Style (Notes & Bibliography)',
    icon: '🏛️',
    bestFor: 'History, Humanities, Arts, Theology, Social Sciences',
    description: 'Numbered footnotes at page bottom with comprehensive bibliography',
    inTextFormat: 'Footnote [^1], [^2]',
    referenceFormat: "Author, Title (City: Publisher, Year), Page.",
    examples: {
      book: 'Temitope A. Adeyemi, Modern African Governance (Lagos: Tech Publishers, 2021), 58.',
      journal: "Chukwuma N. Okafor, \"Trade Policies in Sub-Saharan Africa,\" Journal of Economic Studies 15, no. 3 (2022): 45-62.",
      inText: 'Historical records confirm these institutional shifts.[^1] Cultural analyses corroborate this pattern.[^2]'
    }
  },

  vancouver: {
    id: 'vancouver',
    name: 'Vancouver Style',
    fullName: 'Vancouver System (International Committee of Medical Journal Editors)',
    icon: '🩺',
    bestFor: 'Medicine, Nursing, Pharmacy, Biomedical Sciences, Public Health',
    description: 'Numeric citation system where references are numbered consecutively in order of appearance in the text',
    inTextFormat: '[1], [2] or (1), (2)',
    referenceFormat: '[1] Author AA, Author BB. Title of article. Abbreviated Journal Title. Year;Volume(Issue):Pages.',
    examples: {
      book: '[1] Adeyemi TA. Clinical Biochemistry and Diagnostic Medicine. 2nd ed. Lagos: Medical Science Publishers; 2021.',
      journal: '[2] Okafor CN, Bello SM. Epidemiological analysis of infectious disease transmission models. Niger Med J. 2022;63(4):112-125.',
      inText: 'Recent clinical trials confirmed the efficacy of the therapeutic protocol [1]. Similar pharmacological responses were recorded across cohorts [2], [3].'
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
    { value: 'apa', label: 'APA Style (Social Sciences, Education, Psychology)', icon: '📘' },
    { value: 'harvard', label: 'Harvard Style (Sciences, Business, Management)', icon: '📗' },
    { value: 'chicago', label: 'Chicago Style (History, Humanities - Footnotes)', icon: '📓' },
    { value: 'oscola', label: 'OSCOLA Style (Law & Legal Studies - Footnotes)', icon: '⚖️' },
    { value: 'vancouver', label: 'Vancouver Style (Medicine, Health & Life Sciences)', icon: '💊' },
    { value: 'ieee', label: 'IEEE Style (Engineering, Computer Science, IT)', icon: '⚙️' },
    { value: 'mla', label: 'MLA Style (Humanities, Literature, Languages)', icon: '📙' },
    { value: 'none', label: 'No References (Add manually)', icon: '🚫' }
  ];
}
