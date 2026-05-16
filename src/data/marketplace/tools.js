export const academicTools = [
  {
    id: 'project-finder',
    name: 'Project Finder',
    description: 'Find unique and trending academic project topics. Powered by AI with web search to ensure relevance and novelty.',
    icon: 'Search',
    pricePerUse: 0,
    category: 'research',
    isAvailable: true,
    usageCount: 1240,
  },
  {
    id: 'code-explainer',
    name: 'Code Explainer',
    description: 'Paste up to 500 lines of code for a detailed, line-by-line breakdown. Perfect for understanding complex algorithms and documentation.',
    icon: 'Code2',
    pricePerUse: 300,
    category: 'analysis',
    isAvailable: true,
    usageCount: 720,
  },
  {
    id: 'data-analysis',
    name: 'Data Analysis',
    description: 'Upload your dataset (CSV, XLSX) and get automated statistical analysis with charts, summaries, and interpretation.',
    icon: 'BarChart3',
    pricePerUse: 1200,
    category: 'analysis',
    isAvailable: true,
    usageCount: 430,
  },
  {
    id: 'plagiarism-checker',
    name: 'Plagiarism Checker',
    description: 'Enterprise-grade integrity scan. Supports direct document uploads (PDF, DOCX) and text paste. ₦2,000 per 10,000 words.',
    icon: 'ShieldCheck',
    pricePerUse: 2000,
    category: 'writing',
    isAvailable: false,
    usageCount: 1250,
  },
  {
    id: 'ai-humanizer',
    name: 'AI Humanizer',
    description: 'Transform AI-generated text into natural, human-like writing. ₦1,000 per 1,000 words. Remaining balance is saved for later.',
    icon: 'UserCheck',
    pricePerUse: 1000,
    category: 'writing',
    isAvailable: true,
    usageCount: 890,
  },
  {
    id: 'slide-generator',
    name: 'Slide Generator',
    description: 'Convert your research paper or document into a professional PowerPoint presentation with one click.',
    icon: 'Presentation',
    pricePerUse: 500,
    category: 'generation',
    isAvailable: true,
    usageCount: 650,
  },
  {
    id: 'reference-finder',
    name: 'Reference Finder',
    description: 'Find relevant academic papers and generate properly formatted citations. Basic search is FREE; only Deep Search requires credits.',
    icon: 'BookOpen',
    pricePerUse: 0,
    category: 'research',
    isAvailable: true,
    usageCount: 2100,
  },
  {
    id: 'questionnaire-generator',
    name: 'Questionnaire Generator',
    description: 'Generate professional research questionnaires, surveys, and interview protocols tailored to your project topic and methodology. Export to DOCX.',
    icon: 'ClipboardList',
    pricePerUse: 1000,
    category: 'generation',
    isAvailable: true,
    usageCount: 0,
  },
  {
    id: 'language-converter',
    name: 'Language Converter',
    description: 'Convert and refine text across 20+ languages. ₦1,000 per 2,000 words. Remaining balance is saved for later.',
    icon: 'SpellCheck',
    pricePerUse: 1000,
    category: 'writing',
    isAvailable: true,
    usageCount: 1560,
  },
  {
    id: 'diagram-studio',
    name: 'Diagram & Image Studio',
    description: 'Create professional diagrams, flowcharts, and concept illustrations from text descriptions.',
    icon: 'Image',
    pricePerUse: 100,
    category: 'generation',
    isAvailable: true,
    usageCount: 380,
  },
];

export const toolCategories = [
  { id: 'all', name: 'All Tools' },
  { id: 'writing', name: 'Writing Tools' },
  { id: 'research', name: 'Research Tools' },
  { id: 'analysis', name: 'Analysis Tools' },
  { id: 'generation', name: 'Generation Tools' },
];

export const getToolById = (id) => {
  return academicTools.find(tool => tool.id === id);
};

export const getToolsByCategory = (category) => {
  if (category === 'all') return academicTools;
  return academicTools.filter(tool => tool.category === category);
};
