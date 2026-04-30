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
    id: 'plagiarism-checker',
    name: 'Plagiarism Checker',
    description: 'Check your work against millions of academic papers and web sources. Get detailed similarity reports with source links.',
    icon: 'ShieldCheck',
    pricePerUse: 500,
    category: 'writing',
    isAvailable: true,
    usageCount: 1250,
  },
  {
    id: 'ai-humanizer',
    name: 'AI Humanizer',
    description: 'Transform AI-generated text into natural, human-like writing while preserving your original meaning and academic tone.',
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
    description: 'Find relevant academic papers and generate properly formatted citations in APA, MLA, Chicago, or Harvard style.',
    icon: 'BookOpen',
    pricePerUse: 200,
    category: 'research',
    isAvailable: true,
    usageCount: 2100,
  },
  {
    id: 'data-analysis',
    name: 'Data Analysis',
    description: 'Upload your dataset and get automated statistical analysis with charts, summaries, and interpretation.',
    icon: 'BarChart3',
    pricePerUse: 1200,
    category: 'analysis',
    isAvailable: true,
    usageCount: 430,
  },
  {
    id: 'grammar-fix',
    name: 'Grammar Fix Pro',
    description: 'Advanced grammar and style checking tailored for academic writing with suggestions for improvement.',
    icon: 'SpellCheck',
    pricePerUse: 350,
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
  {
    id: 'code-explainer',
    name: 'Code Explainer',
    description: 'Get detailed explanations of code snippets with line-by-line breakdown and documentation generation.',
    icon: 'Code2',
    pricePerUse: 450,
    category: 'analysis',
    isAvailable: true,
    usageCount: 720,
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
