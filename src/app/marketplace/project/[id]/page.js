"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Star, ShoppingCart, Heart, Share2, 
  FileCode, FileText, Download, Check, 
  ShieldCheck, MessageSquare, 
  ChevronRight, Code, File, Clock,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/marketplace/ui/button';
import { Badge } from '@/components/marketplace/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/marketplace/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/marketplace/ui/dialog';
import { projects } from '@/data/marketplace/projects';
import { useUser } from '@/contexts/marketplace/UserContext';
import { useWallet } from '@/contexts/marketplace/WalletContext';
import { formatCurrency, formatFileSize } from '@/lib/utils';
import { toast } from 'sonner';
import { useParams } from 'next/navigation';

// Mock code content for preview
const mockCodeContent = `import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Main Application Component
const App = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await axios.get('/api/data');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Project Dashboard</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <DataTable data={data} />
      )}
    </div>
  );
};

export default App;`;

// Mock PDF pages
const mockPdfPages = [
  {
    page: 1,
    content: `
      <h1>Chapter 1: Introduction</h1>
      <h2>1.1 Background to the Study</h2>
      <p>The rapid proliferation of Internet of Things (IoT) technologies has fundamentally transformed the domestic environment, giving rise to what is broadly termed "smart home automation" — an integrated ecosystem of networked devices, sensors, and intelligent control systems designed to automate, monitor, and optimize household functions.</p>
      <p>From remotely operated lighting and climate control to AI-driven security surveillance and energy management, smart home systems have evolved from niche luxury products into mainstream consumer infrastructure (Li & Lin, 2021).</p>
    `
  },
  {
    page: 2,
    content: `
      <h2>1.2 Problem Statement</h2>
      <p>Despite the growing adoption of smart home technologies, significant challenges remain in ensuring seamless integration, data privacy, and user accessibility. Many existing solutions suffer from:</p>
      <ul>
        <li>Proprietary protocols that limit interoperability</li>
        <li>Security vulnerabilities in connected devices</li>
        <li>Complex setup processes that deter non-technical users</li>
        <li>High costs associated with comprehensive automation</li>
      </ul>
    `
  },
  {
    page: 3,
    content: `
      <h2>1.3 Research Objectives</h2>
      <p>This project aims to address these challenges by developing an open-source smart home automation system with the following objectives:</p>
      <ol>
        <li>Design a modular architecture supporting multiple communication protocols</li>
        <li>Implement end-to-end encryption for all device communications</li>
        <li>Create an intuitive mobile application for system management</li>
        <li>Evaluate system performance in real-world deployment scenarios</li>
      </ol>
    `
  }
];

export default function ProjectDetailPage() {
  const params = useParams();
  const id = params.id;
  const { isAuthenticated } = useUser();
  const { wallet, deductFunds } = useWallet();
  
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [codeLanguage, setCodeLanguage] = useState('javascript');

  useEffect(() => {
    const found = projects.find((p) => p.id === id);
    if (found) {
      setProject(found);
    }
    setIsLoading(false);
  }, [id]);

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to purchase');
      return;
    }

    if (!project) return;

    if (wallet.balance < project.price) {
      toast.error('Insufficient balance. Please add funds to your wallet.');
      return;
    }

    setIsPurchasing(true);
    
    setTimeout(async () => {
      const success = await deductFunds(project.price, `Purchase: ${project.title}`);
      if (success) {
        toast.success('Purchase successful! You can now download the project files.');
        setShowPurchaseDialog(false);
      }
      setIsPurchasing(false);
    }, 1500);
  };

  const handleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    toast.success(isWishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#111827] mb-2 tracking-tight">Project not found</h2>
          <Link href="/marketplace/projects">
            <Button className="bg-black hover:bg-zinc-800 mt-4 rounded-full px-8">
              Browse Market
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fc]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Link href="/marketplace/projects" className="text-[#6b7280] hover:text-black transition-colors uppercase tracking-wider">
              Market
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#9ca3af]" />
            <Link href={`/marketplace/projects?faculty=${project.faculty}`} className="text-[#6b7280] hover:text-black transition-colors uppercase tracking-wider">
              {project.faculty}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-[#9ca3af]" />
            <span className="text-black uppercase tracking-wider">{project.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-blue-50 text-blue-600 border-none rounded-full px-3 text-[10px] font-black uppercase">
                  {project.faculty}
                </Badge>
                <Badge className="bg-zinc-100 text-zinc-600 border-none rounded-full px-3 text-[10px] font-black uppercase">
                  {project.level}L Project
                </Badge>
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#111827] leading-tight tracking-tight mb-4">
                {project.title}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-[#6b7280]">
                <div className="flex items-center gap-2">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${project.seller.displayName}`}
                    alt={project.seller.displayName}
                    className="w-6 h-6 rounded-full border border-zinc-100"
                  />
                  <span className="text-sm font-bold text-black">{project.seller.displayName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-black text-black">{project.rating}</span>
                  <span className="text-xs font-bold text-[#9ca3af]">({project.reviewCount} Reviews)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-bold uppercase tracking-wider">
                    Posted {new Date(project.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-12">
              <div className="relative aspect-video rounded-[32px] overflow-hidden bg-white border border-[#e5e7eb] shadow-sm p-2">
                <img
                  src={project.images[selectedImage] || project.thumbnail}
                  alt={project.title}
                  className="w-full h-full object-cover rounded-[24px]"
                />
              </div>
              {project.images.length > 1 && (
                <div className="flex gap-4 mt-6">
                  {project.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-24 h-20 rounded-2xl overflow-hidden border-2 transition-all p-1 bg-white ${
                        selectedImage === i ? 'border-black' : 'border-[#e5e7eb] opacity-60 grayscale hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover rounded-xl" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-zinc-100/50 border border-[#e5e7eb] p-1 mb-8 rounded-full shadow-inner inline-flex">
                <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-full text-[#6b7280] px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all">Overview</TabsTrigger>
                <TabsTrigger value="code" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-full text-[#6b7280] px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all"><Code className="w-3.5 h-3.5 mr-2" />Preview</TabsTrigger>
                <TabsTrigger value="docs" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-full text-[#6b7280] px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all"><FileText className="w-3.5 h-3.5 mr-2" />Docs</TabsTrigger>
                <TabsTrigger value="reviews" className="data-[state=active]:bg-white data-[state=active]:text-black rounded-full text-[#6b7280] px-8 py-2.5 text-xs font-black uppercase tracking-widest transition-all">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <div className="bg-white border border-[#e5e7eb] rounded-[32px] p-10 shadow-sm">
                  <h2 className="text-2xl font-bold text-[#111827] mb-6 tracking-tight">Project Summary</h2>
                  <p className="text-[#6b7280] text-base leading-relaxed font-medium mb-10">{project.description}</p>
                  <div className="grid md:grid-cols-2 gap-10">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#111827] mb-6">Package Contents</h3>
                      <ul className="space-y-4">
                        {project.files.map((file) => (
                          <li key={file.id} className="flex items-center gap-4 text-[#6b7280]">
                            <div className="w-10 h-10 bg-[#f8f9fc] border border-zinc-100 rounded-xl flex items-center justify-center">
                              {file.type === 'code' ? <FileCode className="w-5 h-5 text-blue-600" /> : <FileText className="w-5 h-5 text-red-500" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[#111827] text-sm font-bold truncate">{file.name}</p>
                              <p className="text-[#9ca3af] text-[10px] font-black uppercase tracking-wider">{formatFileSize(file.size)} • {file.type}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-[0.2em] text-[#111827] mb-6">Technologies Used</h3>
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag) => (
                          <Badge key={tag} className="bg-zinc-100 text-zinc-900 border-none px-4 py-1.5 rounded-full text-xs font-bold">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="code">
                <div className="bg-white border border-[#e5e7eb] rounded-[32px] overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 bg-[#f8f9fc] border-b border-[#e5e7eb]">
                    <div className="flex items-center gap-3">
                      <FileCode className="w-4 h-4 text-blue-600" />
                      <span className="text-[#111827] text-sm font-black">PREVIEW_ENTRY.JSX</span>
                    </div>
                  </div>
                  <div className="p-8 overflow-x-auto bg-[#fafafa]">
                    <pre className="text-sm font-mono leading-relaxed">
                      <code className="text-[#6b7280]">
                        {mockCodeContent.split('\n').map((line, i) => (
                          <div key={i} className="flex">
                            <span className="text-[#9ca3af] w-10 text-right mr-6 select-none font-sans font-bold">{i + 1}</span>
                            <span dangerouslySetInnerHTML={{ __html: highlightCode(line) }} />
                          </div>
                        ))}
                      </code>
                    </pre>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="docs">
                <div className="bg-white border border-[#e5e7eb] rounded-[32px] overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 bg-[#f8f9fc] border-b border-[#e5e7eb]">
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-red-500" />
                      <span className="text-[#111827] text-sm font-black uppercase tracking-wider">PROJECT_REPORT.PDF</span>
                    </div>
                  </div>
                  <div className="p-12 bg-white max-h-[600px] overflow-y-auto">
                    <div className="max-w-2xl mx-auto border border-zinc-100 shadow-2xl p-12 rounded-lg bg-white">
                      {mockPdfPages.map((page) => (
                        <div key={page.page} className="mb-12 pb-12 border-b border-gray-100 last:border-0 prose prose-zinc prose-sm" dangerouslySetInnerHTML={{ __html: page.content }} />
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="reviews">
                <div className="bg-white border border-[#e5e7eb] rounded-[32px] p-10 shadow-sm text-center py-20">
                  <h3 className="text-xl font-bold text-[#111827] mb-2 tracking-tight">Customer Reviews</h3>
                  <p className="text-[#6b7280] font-medium">Coming Soon</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-[100px] space-y-8">
              <div className="bg-zinc-900 rounded-[32px] p-8 shadow-2xl relative overflow-hidden group">
                <div className="flex items-baseline gap-3 mb-8">
                  <span className="text-4xl font-black text-white tracking-tight">{formatCurrency(project.price)}</span>
                  {project.originalPrice && <span className="text-zinc-500 line-through font-bold text-lg">{formatCurrency(project.originalPrice)}</span>}
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-7 rounded-2xl font-black text-lg shadow-xl shadow-blue-900/20" onClick={() => setShowPurchaseDialog(true)}>
                  <ShoppingCart className="w-5 h-5 mr-3" />Purchase Now
                </Button>
                <div className="flex gap-4 mt-4">
                  <Button variant="outline" className="flex-1 rounded-2xl py-6 border-zinc-700 bg-transparent hover:bg-zinc-800 transition-all font-bold text-white" onClick={handleWishlist}>
                    <Heart className={`w-4 h-4 mr-2 ${isWishlisted ? 'fill-current' : ''}`} />{isWishlisted ? 'Saved' : 'Save'}
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-2xl py-6 border-zinc-700 bg-transparent text-white hover:bg-zinc-800 transition-all font-bold" onClick={handleShare}>
                    <Share2 className="w-4 h-4 mr-2" />Share
                  </Button>
                </div>
              </div>

              <div className="bg-white border border-[#e5e7eb] rounded-[32px] p-8 shadow-sm">
                <h3 className="text-[#111827] text-xs font-black uppercase tracking-[0.2em] mb-6">About Seller</h3>
                <div className="flex items-center gap-4 mb-8">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${project.seller.displayName}`} alt={project.seller.displayName} className="w-16 h-16 rounded-[20px] bg-[#f8f9fc] border border-zinc-100 shadow-sm" />
                  <div>
                    <p className="text-[#111827] font-black text-lg leading-none mb-1">{project.seller.displayName}</p>
                    <p className="text-[#6b7280] text-[11px] font-bold uppercase tracking-wider">{project.seller.department}</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full border-[#e5e7eb] text-[#111827] rounded-2xl py-6 font-bold hover:bg-zinc-50">Contact Seller</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="bg-white border-none text-[#111827] max-w-md rounded-[32px] p-8 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Secure Checkout</DialogTitle>
            <DialogDescription className="text-[#6b7280] font-medium">Review your order</DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="flex items-center gap-4 p-4 bg-[#f8f9fc] rounded-2xl mb-6 border border-zinc-50">
              <img src={project.thumbnail} alt={project.title} className="w-16 h-16 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-[#111827] font-bold line-clamp-1 text-sm">{project.title}</p>
                <p className="text-blue-600 font-black text-lg">{formatCurrency(project.price)}</p>
              </div>
            </div>
            <div className="p-5 bg-zinc-900 rounded-[24px] text-white">
              <div className="flex justify-between items-center mb-1">
                <span className="text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em]">Wallet Balance</span>
                <span className="font-black">{formatCurrency(wallet.balance)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" className="flex-1 text-[#6b7280] font-bold rounded-full" onClick={() => setShowPurchaseDialog(false)}>Cancel</Button>
            <Button className="flex-[2] bg-black hover:bg-zinc-800 text-white rounded-full py-7 font-black shadow-xl" onClick={handlePurchase} disabled={isPurchasing || wallet.balance < project.price * 1.05}>Pay Securely</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function highlightCode(line) {
  let highlighted = line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  highlighted = highlighted.replace(/\b(import|from|const|let|var|function|return|if|else|try|catch|async|await|export|default)\b/g, '<span class="text-blue-600 font-bold">$1</span>');
  highlighted = highlighted.replace(/('.*?'|".*?"|`.*?`)/g, '<span class="text-green-600 font-medium">$1</span>');
  highlighted = highlighted.replace(/(\/\/.*$)/g, '<span class="text-zinc-400 italic">$1</span>');
  return highlighted;
}
