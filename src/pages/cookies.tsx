import React from 'react';
import { useRouter } from 'next/router';
import PublicLayout from '@/components/PublicLayout';
import { useTranslation } from '@/lib/i18n';

export default function CookiePolicy() {
  const router = useRouter();
  const isRw = router.locale === 'rw';
  const isFr = router.locale === 'fr';
  const { t } = useTranslation();

  return (
    <PublicLayout title={t('legal.cookies.title_page', 'Cookie Policy — Imboni Serve')}>
    <div className="bg-imboni-light">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-imboni-blue">
                {t('legal.cookies.heading', 'Cookie Policy')}
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
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">What Are Cookies?</h2>
              <p className="text-gray-700">
                Cookies are small text files stored on your device when you visit our website. They help us provide 
                a better user experience by remembering your preferences, keeping you logged in, and analyzing how 
                you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">Types of Cookies We Use</h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">1. Essential Cookies (Required)</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    These cookies are necessary for the platform to function. They cannot be disabled.
                  </p>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-2">
                    <li>Session management (keeping you logged in)</li>
                    <li>Security and fraud prevention</li>
                    <li>Load balancing and performance</li>
                    <li>Shopping cart functionality</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">2. Functional Cookies (Optional)</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    These cookies enhance functionality and personalization.
                  </p>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-2">
                    <li>Language preferences</li>
                    <li>Theme settings (dark mode)</li>
                    <li>Recently viewed items</li>
                    <li>Location preferences</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">3. Analytics Cookies (Optional)</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    These cookies help us understand how users interact with our platform.
                  </p>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-2">
                    <li>Google Analytics (anonymized)</li>
                    <li>Page views and session duration</li>
                    <li>Feature usage statistics</li>
                    <li>Error tracking and debugging</li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-900 mb-2">4. Marketing Cookies (Optional)</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    These cookies track your activity to show relevant ads.
                  </p>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-2">
                    <li>Facebook Pixel</li>
                    <li>Google Ads conversion tracking</li>
                    <li>Retargeting campaigns</li>
                    <li>Affiliate tracking</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">How Long Do Cookies Last?</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Session Cookies:</strong> Deleted when you close your browser</li>
                <li><strong>Persistent Cookies:</strong> Remain for a set period (typically 30-365 days)</li>
                <li><strong>Third-Party Cookies:</strong> Set by external services (Google, Facebook) with their own retention policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">Managing Your Cookie Preferences</h2>
              <p className="text-gray-700 mb-3">
                You can control cookies through:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Browser Settings:</strong> Most browsers allow you to block or delete cookies</li>
                <li><strong>Opt-Out Tools:</strong> Use tools like Google Analytics Opt-out Browser Add-on</li>
                <li><strong>Do Not Track:</strong> Enable "Do Not Track" in your browser (we honor this signal)</li>
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-3">
                <p className="text-sm text-amber-900">
                  <strong>⚠️ Note:</strong> Blocking essential cookies may prevent you from using certain features 
                  of our platform, such as staying logged in or completing transactions.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">Third-Party Cookies</h2>
              <p className="text-gray-700 mb-3">
                We use services from trusted third parties that may set their own cookies:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Google Analytics:</strong> Website analytics and performance monitoring</li>
                <li><strong>IremboPay:</strong> Payment processing and fraud detection</li>
                <li><strong>Facebook:</strong> Social media integration and advertising</li>
                <li><strong>AWS CloudFront:</strong> Content delivery and caching</li>
              </ul>
              <p className="text-gray-700 mt-3">
                These third parties have their own privacy policies. We recommend reviewing them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">Updates to This Policy</h2>
              <p className="text-gray-700">
                We may update this Cookie Policy to reflect changes in technology or regulations. We will notify 
                you of significant changes via email or platform notification.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">Contact Us</h2>
              <p className="text-gray-700 mb-3">
                For questions about our use of cookies, contact us at:
              </p>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-gray-700"><strong>Email:</strong> privacy@imboni.serve</p>
                <p className="text-gray-700"><strong>WhatsApp:</strong> +250 788 917 126</p>
              </div>
            </section>
          </div>
        )}

        {/* French Version */}
        {isFr && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">Que sont les cookies ?</h2>
              <p className="text-gray-700">
                Les cookies sont de petits fichiers texte enregistrés sur votre appareil lorsque vous visitez notre site.
                Ils nous aident à offrir une meilleure expérience en mémorisant vos préférences, en maintenant votre
                session et en analysant l'utilisation de notre plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">Types de cookies que nous utilisons</h2>
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">1. Cookies essentiels (Obligatoires)</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    Nécessaires au bon fonctionnement de la plateforme. Ils ne peuvent pas être désactivés.
                  </p>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-2">
                    <li>Gestion de session (vous maintenir connecté)</li>
                    <li>Sécurité et prévention de la fraude</li>
                    <li>Répartition de charge et performance</li>
                    <li>Fonctionnalités du panier</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">2. Cookies fonctionnels (Optionnels)</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    Améliorent la personnalisation et les fonctionnalités.
                  </p>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-2">
                    <li>Préférence de langue</li>
                    <li>Thème (mode sombre)</li>
                    <li>Articles récemment consultés</li>
                    <li>Préférences de localisation</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">3. Cookies d’analyse (Optionnels)</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    Nous aident à comprendre comment les utilisateurs interagissent avec la plateforme.
                  </p>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-2">
                    <li>Google Analytics (anonymisé)</li>
                    <li>Vues de pages et durée des sessions</li>
                    <li>Statistiques d’utilisation des fonctionnalités</li>
                    <li>Suivi des erreurs et débogage</li>
                  </ul>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h3 className="font-semibold text-orange-900 mb-2">4. Cookies marketing (Optionnels)</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    Suivent votre activité pour afficher des publicités pertinentes.
                  </p>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-2">
                    <li>Pixel Facebook</li>
                    <li>Suivi de conversion Google Ads</li>
                    <li>Campagnes de reciblage</li>
                    <li>Suivi d’affiliation</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">Durée de vie des cookies</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Cookies de session :</strong> Supprimés à la fermeture du navigateur</li>
                <li><strong>Cookies persistants :</strong> Conservés pour une durée définie (généralement 30–365 jours)</li>
                <li><strong>Cookies tiers :</strong> Définis par des services externes (Google, Facebook) avec leurs propres politiques</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">Gérer vos préférences de cookies</h2>
              <p className="text-gray-700 mb-3">Vous pouvez contrôler les cookies via :</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Paramètres du navigateur :</strong> La plupart des navigateurs permettent de bloquer ou supprimer les cookies</li>
                <li><strong>Outils d’opt‑out :</strong> Par ex. l’extension de désactivation Google Analytics</li>
                <li><strong>Do Not Track :</strong> Activez « Do Not Track » dans votre navigateur (nous respectons ce signal)</li>
              </ul>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-3">
                <p className="text-sm text-amber-900">
                  <strong>⚠️ Remarque :</strong> Le blocage des cookies essentiels peut empêcher l’utilisation de certaines fonctionnalités
                  comme rester connecté ou finaliser des transactions.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">Cookies tiers</h2>
              <p className="text-gray-700 mb-3">
                Nous utilisons des services de tiers de confiance susceptibles de définir leurs propres cookies :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Google Analytics :</strong> Analyses d’audience et performance</li>
                <li><strong>IremboPay :</strong> Traitement des paiements et détection de fraude</li>
                <li><strong>Facebook :</strong> Intégration sociale et publicité</li>
                <li><strong>AWS CloudFront :</strong> Diffusion de contenu et cache</li>
              </ul>
              <p className="text-gray-700 mt-3">
                Ces tiers disposent de leurs propres politiques de confidentialité ; nous vous recommandons de les consulter.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">Mises à jour de cette politique</h2>
              <p className="text-gray-700">
                Nous pouvons mettre à jour cette politique des cookies en fonction des évolutions technologiques ou réglementaires.
                Nous vous informerons des changements importants par email ou notification sur la plateforme.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">Nous contacter</h2>
              <p className="text-gray-700 mb-3">Pour toute question relative aux cookies, contactez‑nous :</p>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-gray-700"><strong>Email :</strong> privacy@imboni.serve</p>
                <p className="text-gray-700"><strong>WhatsApp :</strong> +250 788 917 126</p>
              </div>
            </section>
          </div>
        )}

        {/* Kinyarwanda Version */}
        {isRw && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">Cookies ni iki?</h2>
              <p className="text-gray-700">
                Cookies ni amadosiye mato yandikwa kuri mudasobwa yawe iyo usura urubuga rwacu. Adufasha 
                gutanga serivisi nziza mu kwibuka ibyo uhitamo, kugumana uri muri konti, no gusesengura 
                uburyo ukoresha urubuga.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">Ubwoko bwa Cookies Dukoresha</h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">1. Cookies Zikenewe (Ntishobora Kuzimya)</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    Izi cookies zikenewe kugirango urubuga rukore neza. Ntishobora kuzimwa.
                  </p>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-2">
                    <li>Gucunga session (kugumana uri muri konti)</li>
                    <li>Umutekano no kurwanya uburiganya</li>
                    <li>Imikorere myiza</li>
                    <li>Agasanduku k'ibicuruzwa</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">2. Cookies z'Imikorere (Wishobora Guhitamo)</h3>
                  <p className="text-gray-700 text-sm mb-2">
                    Izi cookies zongerera imikorere n'ibihujwe nawe.
                  </p>
                  <ul className="list-disc list-inside text-gray-700 text-sm space-y-1 ml-2">
                    <li>Ururimi uhitamo</li>
                    <li>Imiterere (dark mode)</li>
                    <li>Ibintu byarebwe vuba</li>
                    <li>Aho uherereye</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">Tuvugishe</h2>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-gray-700"><strong>Imeri:</strong> privacy@imboni.serve</p>
                <p className="text-gray-700"><strong>WhatsApp:</strong> +250 788 917 126</p>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
    </PublicLayout>
  );
}
