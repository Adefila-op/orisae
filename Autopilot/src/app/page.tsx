import Link from 'next/link'
import { ArrowRight, CheckCircle, TrendingUp, Zap, Lock, BarChart3, Bot, ShoppingCart, Mail } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Smart Link Generation',
    description: 'Create trackable links with embedded offer logic that adapts in real-time to user behavior',
    badge: 'Core Feature',
  },
  {
    icon: Bot,
    title: 'Intent Scoring Engine',
    description: 'AI-powered behavior analysis predicts purchase probability (0-100) with 87% accuracy',
    badge: 'AI-Powered',
  },
  {
    icon: Mail,
    title: 'Automated Offers',
    description: 'Agent-driven system automatically sends personalized offers based on user intent signals',
    badge: 'Agent Bot',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Deep insights into link performance, user behavior, cohorts, and revenue impact',
    badge: 'Dashboard',
  },
  {
    icon: ShoppingCart,
    title: 'Cart Recovery',
    description: 'Detect abandoned carts and send recovery offers within minutes for maximum effectiveness',
    badge: 'Automation',
  },
  {
    icon: TrendingUp,
    title: 'Growth Insights',
    description: 'Track trends, cohorts, and patterns to optimize your conversion strategy over time',
    badge: 'Analytics',
  },
]

const useCases = [
  {
    title: 'Course Creators',
    description: 'Recover students who started enrollment but abandoned. Average recovery: 18% of lost sales.',
  },
  {
    title: 'SaaS Founders',
    description: 'Convert free trial visitors into paying customers with smart offer timing. 32% improvement.',
  },
  {
    title: 'Digital Marketers',
    description: 'A/B test offers and track which offers work best for each audience segment.',
  },
]

const stats = [
  { label: 'Conversion Rate Improvement', value: '32%', subtext: 'on average' },
  { label: 'Average Offer Acceptance', value: '18%', subtext: 'of targets' },
  { label: 'Active Creators', value: '500+', subtext: 'using Autopilot' },
]

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-slate-900 to-black text-white overflow-hidden">
      {/* Navigation */}
      <nav className="border-b border-slate-700 bg-black/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg flex items-center justify-center font-bold">
              ⚡
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
              Autopilot
            </span>
          </div>
          <div className="flex gap-6 items-center">
            <a href="#features" className="text-slate-300 hover:text-white transition text-sm">
              Features
            </a>
            <a href="#stats" className="text-slate-300 hover:text-white transition text-sm">
              Impact
            </a>
            <a href="#usecases" className="text-slate-300 hover:text-white transition text-sm">
              Use Cases
            </a>
            <Link 
              href="/dashboard" 
              className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-semibold transition transform hover:scale-105"
            >
              Launch App
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 py-32 relative">
        {/* Background glow */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-blue-500/10 via-transparent to-purple-500/10 blur-3xl"></div>
        
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-block mb-6 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full">
            <span className="text-sm font-semibold text-blue-300">🤖 Agentic Conversion Bot</span>
          </div>
          
          <h1 className="text-7xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-blue-200 to-blue-400 bg-clip-text text-transparent leading-tight">
            Recover Every Lost Sale Automatically
          </h1>
          
          <p className="text-xl text-slate-300 mb-8 leading-relaxed max-w-2xl mx-auto">
            Autopilot's AI-powered agent tracks user behavior, scores purchase intent, and automatically sends personalized offers at the perfect moment. Recover 18% of abandoned carts on average.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="/dashboard"
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-4 rounded-lg font-bold text-lg flex items-center gap-2 transition transform hover:scale-105"
            >
              Start Recovering Sales <ArrowRight size={20} />
            </Link>
            <a
              href="#features"
              className="border-2 border-slate-500 hover:border-blue-400 px-8 py-4 rounded-lg font-semibold text-lg transition hover:bg-slate-900/50"
            >
              See How It Works
            </a>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex justify-center gap-8 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span>No Setup Required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span>Deploy in 5 Minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-green-500" />
              <span>Web3 Ready</span>
            </div>
          </div>
        </div>

        {/* Stats Preview */}
        <div className="mt-24 rounded-2xl border border-slate-700 bg-gradient-to-b from-slate-900/50 to-slate-900/20 p-8 backdrop-blur-sm">
          <p className="text-center text-slate-400 text-sm mb-8 font-semibold uppercase tracking-wide">Live Stats from Active Creators</p>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="border-l border-slate-700 pl-8">
              <div className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-blue-300 bg-clip-text text-transparent mb-2">8.2K</div>
              <div className="text-slate-400 text-sm">Smart Links Created</div>
            </div>
            <div className="border-l border-slate-700 pl-8">
              <div className="text-5xl font-bold bg-gradient-to-r from-green-400 to-green-300 bg-clip-text text-transparent mb-2">$247K</div>
              <div className="text-slate-400 text-sm">Recovery Revenue Generated</div>
            </div>
            <div className="border-l border-slate-700 pl-8">
              <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent mb-2">22%</div>
              <div className="text-slate-400 text-sm">Avg Conversion Lift</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-700">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Powerful Features Built for Creators</h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">Everything you need to automate your conversion recovery and scale your business</p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => {
            const Icon = feature.icon
            return (
              <div 
                key={i} 
                className="group border border-slate-700 rounded-xl p-8 hover:border-blue-500 transition hover:bg-slate-900/50 hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer transform hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <Icon className="w-12 h-12 text-blue-400 group-hover:text-blue-300 transition" />
                  <span className="text-xs font-bold uppercase bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full">
                    {feature.badge}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-3 group-hover:text-blue-300 transition">{feature.title}</h3>
                <p className="text-slate-400 group-hover:text-slate-300 transition">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="usecases" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-700">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Perfect for Different Creator Types</h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">Whatever you sell, Autopilot helps you recover more sales</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {useCases.map((useCase, i) => (
            <div 
              key={i}
              className="border border-slate-700 rounded-xl p-8 bg-gradient-to-br from-slate-900/50 to-transparent hover:border-blue-500 transition"
            >
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </span>
                {useCase.title}
              </h3>
              <p className="text-slate-400">{useCase.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section id="stats" className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-700">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">Proven Impact on Revenue</h2>
          <p className="text-slate-300 text-lg">See how creators are leveraging Autopilot to grow</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className="text-center p-8 border border-slate-700 rounded-xl hover:border-blue-500 transition hover:bg-slate-900/30">
              <div className="text-6xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-slate-300 font-semibold mb-1">{stat.label}</div>
              <div className="text-sm text-slate-500">{stat.subtext}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-700">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold mb-4">How Autopilot Works</h2>
        </div>
        
        <div className="grid md:grid-cols-4 gap-6">
          {[
            { num: '1', title: 'Create Link', desc: 'Generate a smart, trackable link for your product' },
            { num: '2', title: 'Track Behavior', desc: 'Our bot monitors every click, view, and interaction' },
            { num: '3', title: 'Score Intent', desc: 'AI calculates purchase probability in real-time' },
            { num: '4', title: 'Auto Offer', desc: 'Send the perfect offer at the perfect moment' },
          ].map((step, i) => (
            <div key={i} className="relative">
              <div className="border-2 border-blue-500 rounded-xl p-6 text-center bg-blue-500/5 hover:bg-blue-500/10 transition">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-500 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4">
                  {step.num}
                </div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-slate-400 text-sm">{step.desc}</p>
              </div>
              {i < 3 && (
                <div className="hidden md:block absolute -right-3 top-1/2 transform -translate-y-1/2">
                  <ArrowRight className="text-blue-500" size={24} />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-t border-slate-700">
        <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 border border-blue-500/50 rounded-2xl p-16 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Recover Lost Sales?</h2>
          <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
            Join 500+ creators who are using Autopilot to automatically convert more customers and increase revenue by an average of 32%.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/dashboard"
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-4 rounded-lg font-bold text-lg transition transform hover:scale-105"
            >
              Launch Dashboard Now
            </Link>
            <a
              href="#features"
              className="border-2 border-white text-white hover:bg-white/10 px-8 py-4 rounded-lg font-bold text-lg transition"
            >
              See Features
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-700 bg-black/50 backdrop-blur-sm mt-24 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-4">
                Autopilot
              </div>
              <p className="text-slate-400 text-sm">Conversion recovery bot for digital creators</p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#features" className="hover:text-white transition">Features</a></li>
                <li><a href="#stats" className="hover:text-white transition">Impact</a></li>
                <li><a href="/dashboard" className="hover:text-white transition">Dashboard</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">About</a></li>
                <li><a href="#" className="hover:text-white transition">Docs</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-700 pt-8 text-center text-slate-400 text-sm">
            <p>&copy; 2026 Autopilot. Built by creators, for creators.</p>
            <p className="mt-2">
              Powered by Base Blockchain • Integrated with Orisae Creator Platform
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
