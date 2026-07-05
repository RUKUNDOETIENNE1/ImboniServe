  Gift,
  Tag,
  Sparkles,
  Rss,
  Globe,
const advancedFeatures = [
  {
    icon: <Sparkles className="w-5 h-5" />,
    titleKey: 'homepage.advanced.ai_menu',
    title: 'AI Menu Builder',
    descKey: 'homepage.advanced.ai_menu_desc',
    desc: 'Turn menus into digital experiences in minutes. Upload a photo or document and let AI create a professional digital menu ready for ordering.',
  },
  {
    icon: <Globe className="w-5 h-5" />,
    titleKey: 'homepage.advanced.marketplace',
    title: 'Business Discovery',
    descKey: 'homepage.advanced.marketplace_desc',
    desc: 'Help more customers discover your business through the Imboni ecosystem with searchable business profiles, promotions, and digital visibility.',
  },
  {
    icon: <Package className="w-5 h-5" />,
    titleKey: 'homepage.advanced.procurement',
    title: 'Procurement & Inventory',
    descKey: 'homepage.advanced.procurement_desc',
    desc: 'Manage purchasing, suppliers, stock levels, and food costs with complete operational visibility from delivery to consumption.',
  },
  {
    icon: <Users className="w-5 h-5" />,
    titleKey: 'homepage.advanced.staff',
    title: 'Staff & Roles',
    descKey: 'homepage.advanced.staff_desc',
    desc: 'Control who can access what with flexible roles and permissions for every member of your team.',
  },
  {
    icon: <Building2 className="w-5 h-5" />,
    titleKey: 'homepage.advanced.multi_branch',
    title: 'Multi-Branch Operations',
    descKey: 'homepage.advanced.multi_branch_desc',
    desc: 'Run multiple branches from one platform with centralized reporting, inventory visibility, and operational consistency.',
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    titleKey: 'homepage.advanced.business_intelligence',
    title: 'Business Intelligence',
    descKey: 'homepage.advanced.business_intelligence_desc',
    desc: 'Monitor sales, customer trends, inventory, and financial performance with real-time insights that support better business decisions.',
  },
]
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-imboni-blue mb-3" suppressHydrationWarning>
              {t('homepage.advanced.title', 'Built for Growth')}
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto" suppressHydrationWarning>
              {t('homepage.advanced.subtitle', 'Everything you need to grow from a single location to a modern hospitality business—all from one intelligent platform.')}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {advancedFeatures.map((feature) => (
              <div key={feature.titleKey} className="flex items-start gap-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition">
                <div className="w-10 h-10 rounded-xl bg-imboni-blue/10 text-imboni-blue flex items-center justify-center flex-shrink-0">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1" suppressHydrationWarning>
                    {t(feature.titleKey, feature.title)}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed" suppressHydrationWarning>
                    {t(feature.descKey, feature.desc)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>