import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import PublicLayout from '@/components/PublicLayout';
import { useTranslation } from '@/lib/i18n';

export default function ServiceTerms() {
  const router = useRouter();
  const isRw = router.locale === 'rw';
  const isFr = router.locale === 'fr';
  const { t } = useTranslation();
  const [feePercent, setFeePercent] = useState<number>(5);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch('/api/fees/DIGITAL_PAYMENT_FEE');
        const data = await res.json();
        if (res.ok && data.success && typeof data.data?.percent === 'number') {
          if (mounted) setFeePercent(data.data.percent);
        }
      } catch {}
    })();
    return () => { mounted = false };
  }, []);

  return (
    <PublicLayout title={t('legal.service_terms.title_page', 'Service Terms — Imboni Serve')}>
    <div className="bg-imboni-light">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-imboni-blue">
                {t('legal.service_terms.heading', 'Service-Specific Terms')}
              </h1>
              <p className="text-gray-600 mt-2">
                {t('legal.common.platform', 'Imboni Serve Platform')}
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {t('legal.common.last_updated', 'Last Updated:')} May 5, 2026
          </p>
        </div>

        {/* English Version */}
        {!isRw && !isFr && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">1. QR Code Ordering Service</h2>
              <p className="text-gray-700 mb-3">
                Our QR code ordering service allows customers to browse menus and place orders directly from their phones.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Availability:</strong> Service is available during your business operating hours</li>
                <li><strong>Menu Updates:</strong> You are responsible for keeping menu items and prices current</li>
                <li><strong>Order Accuracy:</strong> Customers can modify orders before confirmation; changes after confirmation require staff approval</li>
                <li><strong>Payment:</strong> Digital payments incur a {feePercent}% convenience fee (min RWF 100, max RWF 3,500)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">2. Point of Sale (POS) System</h2>
              <p className="text-gray-700 mb-3">
                Our POS system processes in-person transactions and integrates with your inventory.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Offline Mode:</strong> POS works offline and syncs when connection is restored</li>
                <li><strong>Receipt Generation:</strong> All transactions generate RRA-compliant electronic receipts</li>
                <li><strong>Cash Handling:</strong> Cash transactions do not incur convenience fees</li>
                <li><strong>Refunds:</strong> Refunds must be processed within 24 hours of the original transaction</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">3. Inventory Management</h2>
              <p className="text-gray-700 mb-3">
                Track stock levels, receive low-stock alerts, and manage suppliers.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Stock Updates:</strong> You are responsible for accurate stock counts</li>
                <li><strong>Alerts:</strong> Low-stock alerts are sent via WhatsApp and email</li>
                <li><strong>Supplier Integration:</strong> Connect with verified suppliers on our marketplace</li>
                <li><strong>Waste Tracking:</strong> Record and analyze food waste to reduce costs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">4. AI Insights & Analytics</h2>
              <p className="text-gray-700 mb-3">
                Get actionable insights powered by AI to optimize your business.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Data Privacy:</strong> Your business data is never shared with competitors</li>
                <li><strong>Recommendations:</strong> AI suggestions are based on your historical data and industry benchmarks</li>
                <li><strong>Accuracy:</strong> While we strive for accuracy, AI insights are advisory only</li>
                <li><strong>Plan Requirement:</strong> Advanced AI features require Growth plan or higher</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">5. Site Builder</h2>
              <p className="text-gray-700 mb-3">
                Create a professional website for your business with our drag-and-drop builder.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Custom Domain:</strong> Connect your own domain or use a free imboni.site subdomain</li>
                <li><strong>Templates:</strong> Choose from restaurant, hotel, bar, and café templates</li>
                <li><strong>SEO:</strong> Built-in SEO optimization for better search visibility</li>
                <li><strong>Ownership:</strong> You retain full ownership of your content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">6. Discovery Marketplace</h2>
              <p className="text-gray-700 mb-3">
                List your business on our discovery platform to attract new customers.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Listing Fee:</strong> Free for all Imboni Serve customers</li>
                <li><strong>Commission:</strong> 7% commission on orders placed through the marketplace (subject to VAT)</li>
                <li><strong>Reviews:</strong> Customers can leave reviews; you can respond but not delete them</li>
                <li><strong>Verification:</strong> Verified badge requires 20+ completed orders and 4.0+ rating</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">7. Referral & Rewards Program</h2>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">7.1 Customer Referral Program (Tier 2)</h3>
                <p className="text-gray-700 mb-3">
                  Customers can earn rewards by referring friends to order from restaurants using Imboni Serve.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li><strong>Reward Amount:</strong> 1,000 RWF per qualified referral (one-time, not recurring)</li>
                  <li><strong>Qualification:</strong> Referred friend must complete their first order with a minimum value of 5,000 RWF</li>
                  <li><strong>Validation Period:</strong> 7-day lock period after order confirmation to prevent fraud</li>
                  <li><strong>Reward Distribution:</strong> Both referrer and referred friend receive 1,000 RWF each</li>
                  <li><strong>Withdrawal:</strong> Minimum 10,000 RWF balance required to cash out via Mobile Money</li>
                  <li><strong>Usage:</strong> Credits can be used at any restaurant on Imboni Serve or withdrawn to MoMo/Airtel Money</li>
                  <li><strong>Fraud Prevention:</strong> Self-referrals, duplicate accounts, and suspicious activity will result in reward forfeiture</li>
                  <li><strong>No Expiration:</strong> Customer referral credits do not expire</li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">7.2 B2B Affiliate Program (Tier 1)</h3>
                <p className="text-gray-700 mb-3">
                  Professional marketers can earn recurring commissions by bringing restaurants to Imboni Serve.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li><strong>Eligibility:</strong> Application required; for professional marketers and influencers only</li>
                  <li><strong>Commission:</strong> 15% of restaurant's subscription payments for 12 months</li>
                  <li><strong>Qualification:</strong> Referred restaurant must generate 30 Smart Dining Slips within 14 days</li>
                  <li><strong>Lock Period:</strong> 7-day hold on each commission payment for chargeback protection</li>
                  <li><strong>Payout:</strong> Monthly payouts via bank transfer or Mobile Money</li>
                  <li><strong>Duration:</strong> Commission ends after 12 subscription payments or if restaurant cancels</li>
                  <li><strong>Separate Terms:</strong> Full affiliate terms provided upon application approval</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  <strong>Important:</strong> Customer referrals (Tier 2) and B2B affiliate commissions (Tier 1) are separate programs with different reward structures. 
                  Attempting to game the system by creating fake accounts or fraudulent referrals will result in permanent ban and forfeiture of all rewards.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">8. WhatsApp Integration</h2>
              <p className="text-gray-700 mb-3">
                Send automated reports and customer receipts via WhatsApp.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Owner Reports:</strong> Daily and weekly summaries sent automatically</li>
                <li><strong>Customer Receipts:</strong> Requires explicit customer consent (opt-in only)</li>
                <li><strong>Cost:</strong> ~RWF 50 per message; daily cap prevents runaway costs</li>
                <li><strong>Compliance:</strong> All messages comply with WhatsApp Business API policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">9. Multi-Branch Management</h2>
              <p className="text-gray-700 mb-3">
                Manage multiple locations from a single dashboard (Business plan and above).
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Consolidated Reporting:</strong> View performance across all branches</li>
                <li><strong>Per-Branch Analytics:</strong> Drill down into individual location metrics</li>
                <li><strong>Staff Permissions:</strong> Assign staff to specific branches with role-based access</li>
                <li><strong>Inventory Transfer:</strong> Move stock between branches with full audit trail</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">10. Service Level Agreement (SLA)</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                <h3 className="font-semibold text-blue-900 mb-2">Uptime Guarantee</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm ml-2">
                  <li><strong>Starter Plan:</strong> 99.0% uptime (no SLA credit)</li>
                  <li><strong>Growth Plan:</strong> 99.5% uptime (pro-rated credit for downtime)</li>
                  <li><strong>Business/Enterprise:</strong> 99.9% uptime (SLA credit + priority support)</li>
                </ul>
              </div>
              <p className="text-gray-700">
                Planned maintenance windows are excluded from uptime calculations. We provide 48-hour notice for scheduled maintenance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">11. Support & Training</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Email Support:</strong> Available on all plans (24-48 hour response time)</li>
                <li><strong>WhatsApp Support:</strong> Growth plan and above (4-hour response time during business hours)</li>
                <li><strong>Priority Support:</strong> Business/Enterprise plans (1-hour response time, dedicated account manager)</li>
                <li><strong>Training:</strong> Free onboarding session for all new customers; additional training available for Enterprise</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">12. Termination & Data Export</h2>
              <p className="text-gray-700 mb-3">
                You may cancel your subscription at any time.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Data Export:</strong> Export all your data in CSV/JSON format before cancellation</li>
                <li><strong>Grace Period:</strong> 30-day grace period to reactivate after cancellation</li>
                <li><strong>Data Deletion:</strong> All data permanently deleted 90 days after cancellation (except legally required records)</li>
                <li><strong>Refunds:</strong> Pro-rated refunds for annual plans if canceled within 30 days</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">Contact Us</h2>
              <p className="text-gray-700 mb-3">
                For service-specific questions or support, contact us at:
              </p>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-gray-700"><strong>Email:</strong> support@imboni.serve</p>
                <p className="text-gray-700"><strong>WhatsApp:</strong> +250 788 917 126</p>
                <p className="text-gray-700"><strong>Address:</strong> Kigali, Rwanda</p>
              </div>
            </section>
          </div>
        )}

        {/* French Version */}
        {isFr && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">1. Service de commande par QR Code</h2>
              <p className="text-gray-700 mb-3">
                Notre service de commande par QR code permet aux clients de parcourir le menu et de passer des commandes
                directement depuis leur téléphone.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Disponibilité :</strong> Service disponible pendant vos heures d'ouverture</li>
                <li><strong>Mises à jour du menu :</strong> Vous êtes responsable de la mise à jour des articles et des prix</li>
                <li><strong>Exactitude des commandes :</strong> Les clients peuvent modifier leurs commandes avant confirmation ;
                  après confirmation, tout changement requiert l'approbation du personnel</li>
                <li><strong>Paiement :</strong> Les paiements numériques entraînent des frais de {feePercent}% (min RWF 100, max RWF 3,500)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">2. Système de Point de Vente (POS)</h2>
              <p className="text-gray-700 mb-3">
                Notre POS traite les transactions en personne et s'intègre à votre inventaire.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Mode hors ligne :</strong> Fonctionne hors ligne et se synchronise au rétablissement de la connexion</li>
                <li><strong>Génération des reçus :</strong> Reçus électroniques conformes RRA pour toutes les transactions</li>
                <li><strong>Gestion des espèces :</strong> Les paiements en espèces n'entraînent pas de frais</li>
                <li><strong>Remboursements :</strong> À traiter dans les 24 heures suivant la transaction initiale</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">3. Gestion de l'inventaire</h2>
              <p className="text-gray-700 mb-3">
                Suivez les niveaux de stock, recevez des alertes de faible stock et gérez vos fournisseurs.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Mises à jour du stock :</strong> Vous êtes responsable de l'exactitude des quantités</li>
                <li><strong>Alertes :</strong> Alertes envoyées par WhatsApp et email</li>
                <li><strong>Intégration fournisseurs :</strong> Connectez-vous à des fournisseurs vérifiés sur notre marketplace</li>
                <li><strong>Suivi du gaspillage :</strong> Enregistrez et analysez les pertes alimentaires</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">4. Analyses et insights IA</h2>
              <p className="text-gray-700 mb-3">
                Obtenez des insights exploitables propulsés par l'IA pour optimiser votre activité.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Confidentialité des données :</strong> Vos données ne sont jamais partagées avec des concurrents</li>
                <li><strong>Recommandations :</strong> Basées sur votre historique et des références du secteur</li>
                <li><strong>Précision :</strong> Les insights IA sont fournis à titre indicatif</li>
                <li><strong>Exigence d'abonnement :</strong> Les fonctionnalités IA avancées nécessitent le plan Growth ou supérieur</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">5. Créateur de site</h2>
              <p className="text-gray-700 mb-3">
                Créez un site professionnel pour votre entreprise grâce à notre éditeur glisser-déposer.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Domaine personnalisé :</strong> Connectez votre domaine ou utilisez un sous-domaine imboni.site gratuit</li>
                <li><strong>Modèles :</strong> Restaurants, hôtels, bars et cafés</li>
                <li><strong>SEO :</strong> Optimisation intégrée pour les moteurs de recherche</li>
                <li><strong>Propriété :</strong> Vous conservez la pleine propriété de votre contenu</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">6. Marketplace Découverte</h2>
              <p className="text-gray-700 mb-3">
                Référencez votre entreprise sur notre plateforme pour attirer de nouveaux clients.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Frais d'inscription :</strong> Gratuit pour tous les clients Imboni Serve</li>
                <li><strong>Commission :</strong> 7% sur les commandes passées via la marketplace (soumis à TVA)</li>
                <li><strong>Avis :</strong> Les clients peuvent laisser des avis ; vous pouvez répondre mais pas les supprimer</li>
                <li><strong>Vérification :</strong> Badge vérifié requis : 20+ commandes complétées et note ≥ 4,0</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">7. Programme de Parrainage & Récompenses</h2>
              
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">7.1 Programme de parrainage clients (Niveau 2)</h3>
                <p className="text-gray-700 mb-3">
                  Les clients peuvent gagner des récompenses en parrainant des amis pour commander auprès de restaurants utilisant Imboni Serve.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li><strong>Montant de la récompense :</strong> 1,000 RWF par parrainage éligible (unique, non récurrent)</li>
                  <li><strong>Conditions :</strong> L'ami parrainé doit terminer une première commande d'au moins 5,000 RWF</li>
                  <li><strong>Période de validation :</strong> 7 jours après confirmation pour prévenir la fraude</li>
                  <li><strong>Distribution :</strong> 1,000 RWF chacun (parrain et ami parrainé)</li>
                  <li><strong>Retrait :</strong> Solde minimum de 10,000 RWF pour retrait Mobile Money</li>
                  <li><strong>Utilisation :</strong> Crédits utilisables dans tout restaurant sur Imboni Serve ou retrait MoMo/Airtel</li>
                  <li><strong>Prévention de la fraude :</strong> Auto-parrainage, comptes dupliqués, activités suspectes ⇒ perte des récompenses</li>
                  <li><strong>Pas d'expiration :</strong> Les crédits des clients n'expirent pas</li>
                </ul>
              </div>

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">7.2 Programme d'affiliation B2B (Niveau 1)</h3>
                <p className="text-gray-700 mb-3">
                  Les marketeurs professionnels peuvent gagner des commissions récurrentes en amenant des restaurants sur Imboni Serve.
                </p>
                <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                  <li><strong>Éligibilité :</strong> Candidature requise ; réservé aux marketeurs et influenceurs professionnels</li>
                  <li><strong>Commission :</strong> 15% des paiements d'abonnement du restaurant pendant 12 mois</li>
                  <li><strong>Qualification :</strong> Le restaurant référé doit générer 30 Smart Dining Slips en 14 jours</li>
                  <li><strong>Période de blocage :</strong> 7 jours de délai sur chaque paiement (protection contre rétrofacturation)</li>
                  <li><strong>Paiement :</strong> Mensuel par virement bancaire ou Mobile Money</li>
                  <li><strong>Durée :</strong> Se termine après 12 paiements d'abonnement ou annulation du restaurant</li>
                  <li><strong>Conditions séparées :</strong> Communiquées après approbation de la candidature</li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-sm text-amber-900">
                  <strong>Important :</strong> Les parrainages clients (Niveau 2) et les commissions d'affiliation B2B (Niveau 1)
                  sont des programmes distincts avec des structures de récompenses différentes. Toute tentative de fraude (comptes
                  fictifs, parrainages frauduleux) entraînera un bannissement définitif et la perte de toutes les récompenses.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">8. Intégration WhatsApp</h2>
              <p className="text-gray-700 mb-3">
                Envoi automatique de rapports et reçus clients via WhatsApp.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Rapports propriétaire :</strong> Récapitulatif quotidien et hebdomadaire automatique</li>
                <li><strong>Reçus clients :</strong> Nécessitent le consentement explicite du client (opt-in)</li>
                <li><strong>Coût :</strong> ~RWF 50 par message ; plafond quotidien pour maîtriser les coûts</li>
                <li><strong>Conformité :</strong> Conforme à la politique WhatsApp Business API</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">9. Gestion Multi‑Agences</h2>
              <p className="text-gray-700 mb-3">
                Gérez plusieurs sites depuis un tableau de bord unique (plan Business et au‑dessus).
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Rapports consolidés :</strong> Vue des performances sur l'ensemble des agences</li>
                <li><strong>Analyses par agence :</strong> Détails par site</li>
                <li><strong>Permissions du personnel :</strong> Affectation par agence avec rôles</li>
                <li><strong>Transfert d'inventaire :</strong> Mouvement de stock avec piste d'audit</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">10. Accord de Niveau de Service (SLA)</h2>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                <h3 className="font-semibold text-blue-900 mb-2">Garantie de disponibilité</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 text-sm ml-2">
                  <li><strong>Starter :</strong> 99,0% (pas de crédit SLA)</li>
                  <li><strong>Growth :</strong> 99,5% (crédit au prorata en cas d'indisponibilité)</li>
                  <li><strong>Business/Enterprise :</strong> 99,9% (crédit SLA + support prioritaire)</li>
                </ul>
              </div>
              <p className="text-gray-700">
                Les maintenances planifiées sont exclues du calcul de disponibilité. Un préavis de 48 heures est fourni.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">11. Support & Formation</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Support email :</strong> Inclus dans tous les plans (réponse 24–48h)</li>
                <li><strong>Support WhatsApp :</strong> Plans Growth et supérieurs (réponse en 4h ouvrées)</li>
                <li><strong>Support prioritaire :</strong> Plans Business/Enterprise (réponse 1h, chargé de compte dédié)</li>
                <li><strong>Formation :</strong> Onboarding gratuit pour tous ; formations supplémentaires pour Enterprise</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">12. Résiliation & Export de données</h2>
              <p className="text-gray-700 mb-3">
                Vous pouvez résilier votre abonnement à tout moment.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Export des données :</strong> Exportez vos données (CSV/JSON) avant résiliation</li>
                <li><strong>Période de grâce :</strong> 30 jours pour réactiver après résiliation</li>
                <li><strong>Suppression des données :</strong> Suppression définitive 90 jours après résiliation (hors obligations légales)</li>
                <li><strong>Remboursements :</strong> Au prorata pour les plans annuels si résiliés sous 30 jours</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">Nous contacter</h2>
              <p className="text-gray-700 mb-3">
                Pour toute question spécifique au service ou demande d'assistance :
              </p>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-gray-700"><strong>Email :</strong> support@imboni.serve</p>
                <p className="text-gray-700"><strong>WhatsApp :</strong> +250 788 917 126</p>
                <p className="text-gray-700"><strong>Adresse :</strong> Kigali, Rwanda</p>
              </div>
            </section>
          </div>
        )}

        {/* Kinyarwanda Version */}
        {isRw && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">1. Serivisi ya QR Code</h2>
              <p className="text-gray-700 mb-3">
                Serivisi yacu ya QR code yemerera abakiriya kureba menu no gutumiza ibicuruzwa bakoresheje telefoni zabo.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Kuboneka:</strong> Serivisi iraboneka mu masaha ubucuruzi bwawe bukora</li>
                <li><strong>Kuvugurura Menu:</strong> Ushinzwe kugenzura ko ibicuruzwa n'ibiciro biri kuri menu</li>
                <li><strong>Ukuri k'Ibicuruzwa:</strong> Abakiriya bashobora guhindura ibicuruzwa mbere yo kwemeza</li>
                <li><strong>Kwishyura:</strong> Kwishyura kuri sisitemu bifite amafaranga ya serivisi {feePercent}%</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">2. Sisitemu ya POS</h2>
              <p className="text-gray-700 mb-3">
                Sisitemu yacu ya POS ikora ibyagurishijwe kandi ihujwe n'ibikoresho.
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Offline Mode:</strong> POS ikora nta murandasi kandi ihuza iyo murandasi wasubiye</li>
                <li><strong>Inyemezabwishyu:</strong> Ibyagurishijwe byose bitanga inyemezabwishyu zemewe na RRA</li>
                <li><strong>Amafaranga y'Agaciro:</strong> Kwishyura mu mafaranga y'agaciro ntabwo bifite amafaranga ya serivisi</li>
                <li><strong>Gusubiza Amafaranga:</strong> Gusubiza amafaranga bigomba gukorwa mu masaha 24 nyuma y'ibyagurishijwe</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">Tuvugishe</h2>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-gray-700"><strong>Imeri:</strong> support@imboni.serve</p>
                <p className="text-gray-700"><strong>WhatsApp:</strong> +250 788 917 126</p>
                <p className="text-gray-700"><strong>Aderesi:</strong> Kigali, Rwanda</p>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
    </PublicLayout>
  );
}
