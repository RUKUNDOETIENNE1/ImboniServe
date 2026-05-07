import React from 'react';
import { useRouter } from 'next/router';
import PublicLayout from '@/components/PublicLayout';
import { useTranslation } from '@/lib/i18n';

export default function PrivacyPolicy() {
  const router = useRouter();
  const isRw = router.locale === 'rw';
  const isFr = router.locale === 'fr';
  const { t } = useTranslation();

  return (
    <PublicLayout title={t('legal.privacy.title_page', 'Privacy Policy — Imboni Serve')}>
    <div className="bg-imboni-light">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-imboni-blue">
                {t('legal.privacy.heading', 'Privacy Policy')}
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
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">1. Information We Collect</h2>
              <p className="text-gray-700 mb-3">
                We collect information to provide better services to our users. The types of information we collect include:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Account Information:</strong> Name, email, phone number, business details</li>
                <li><strong>Transaction Data:</strong> Order history, payment methods, transaction amounts</li>
                <li><strong>Usage Data:</strong> How you interact with our platform, features used, session duration</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
                <li><strong>Location Data:</strong> Business address, delivery locations (with consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">2. How We Use Your Information</h2>
              <p className="text-gray-700 mb-3">We use the collected information for:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Processing orders and payments</li>
                <li>Providing customer support</li>
                <li>Improving our services and developing new features</li>
                <li>Sending transactional notifications (order confirmations, receipts)</li>
                <li>Fraud prevention and security monitoring</li>
                <li>Compliance with legal obligations and tax reporting</li>
                <li>Marketing communications (with your consent)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">3. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-3">
                We do not sell your personal information. We may share your data with:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Service Providers:</strong> Payment processors (IremboPay), cloud hosting (AWS), analytics tools</li>
                <li><strong>Business Partners:</strong> Restaurants and suppliers you transact with</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In case of merger, acquisition, or asset sale</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">4. Data Security</h2>
              <p className="text-gray-700">
                We implement industry-standard security measures to protect your data, including encryption, 
                secure servers, and regular security audits. However, no method of transmission over the internet 
                is 100% secure. We cannot guarantee absolute security but continuously work to improve our protections.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">5. Your Rights</h2>
              <p className="text-gray-700 mb-3">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Correct inaccurate information</li>
                <li>Request deletion of your data (subject to legal retention requirements)</li>
                <li>Opt-out of marketing communications</li>
                <li>Export your data in a portable format</li>
                <li>Withdraw consent for data processing</li>
              </ul>
              <p className="text-gray-700 mt-3">
                To exercise these rights, contact us at <a href="mailto:privacy@imboni.serve" className="text-imboni-blue hover:underline">privacy@imboni.serve</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">6. Data Retention</h2>
              <p className="text-gray-700">
                We retain your data for as long as necessary to provide services and comply with legal obligations. 
                Transaction records are kept for 7 years per Rwanda Revenue Authority requirements. Account data is 
                deleted within 90 days of account closure, unless retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">7. Cookies and Tracking</h2>
              <p className="text-gray-700">
                We use cookies and similar technologies to improve user experience, analyze usage patterns, and 
                personalize content. You can control cookie preferences through your browser settings. See our 
                <a href="/cookies" className="text-imboni-blue hover:underline ml-1">Cookie Policy</a> for details.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">8. Children's Privacy</h2>
              <p className="text-gray-700">
                Our services are not intended for individuals under 18 years of age. We do not knowingly collect 
                personal information from children. If you believe we have collected data from a minor, please 
                contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">9. International Data Transfers</h2>
              <p className="text-gray-700">
                Your data may be transferred to and processed in countries outside Rwanda, including the United States 
                and European Union, where our service providers operate. We ensure appropriate safeguards are in place 
                for such transfers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">10. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy periodically. We will notify you of significant changes via email 
                or platform notification. Continued use of our services after changes constitutes acceptance of the 
                updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">11. Contact Us</h2>
              <p className="text-gray-700">
                For privacy-related questions or concerns, contact us at:
              </p>
              <div className="bg-slate-50 rounded-lg p-4 mt-3">
                <p className="text-gray-700"><strong>Email:</strong> privacy@imboni.serve</p>
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
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">1. Données que nous collectons</h2>
              <p className="text-gray-700 mb-3">
                Nous collectons des données pour fournir de meilleurs services à nos utilisateurs. Les catégories de données comprennent :
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Compte :</strong> Nom, email, numéro de téléphone, détails de l'entreprise</li>
                <li><strong>Transactions :</strong> Historique des commandes, moyens de paiement, montants</li>
                <li><strong>Utilisation :</strong> Interactions avec la plateforme, fonctionnalités utilisées, durée des sessions</li>
                <li><strong>Appareil :</strong> Adresse IP, type de navigateur, système d'exploitation</li>
                <li><strong>Localisation :</strong> Adresse de l'entreprise, lieux de livraison (avec consentement)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">2. Comment nous utilisons vos données</h2>
              <p className="text-gray-700 mb-3">Nous utilisons les données collectées pour :</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Traiter les commandes et paiements</li>
                <li>Fournir l'assistance client</li>
                <li>Améliorer nos services et développer de nouvelles fonctionnalités</li>
                <li>Envoyer des notifications transactionnelles (confirmations, reçus)</li>
                <li>Prévenir la fraude et assurer la sécurité</li>
                <li>Respecter les obligations légales et fiscales</li>
                <li>Communications marketing (avec votre consentement)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">3. Partage et divulgation</h2>
              <p className="text-gray-700 mb-3">Nous ne vendons pas vos données personnelles. Nous pouvons partager vos données avec :</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Fournisseurs de services :</strong> Processeurs de paiement (IremboPay), hébergement cloud (AWS), outils d'analyse</li>
                <li><strong>Partenaires commerciaux :</strong> Restaurants et fournisseurs avec lesquels vous transigez</li>
                <li><strong>Autorités :</strong> Lorsque la loi l'exige ou pour protéger nos droits</li>
                <li><strong>Transferts d'entreprise :</strong> En cas de fusion, acquisition ou cession d'actifs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">4. Sécurité des données</h2>
              <p className="text-gray-700">
                Nous mettons en œuvre des mesures de sécurité conformes aux normes de l'industrie (chiffrement, serveurs sécurisés,
                audits réguliers). Aucune méthode n'étant infaillible, nous ne pouvons garantir une sécurité absolue mais travaillons
                en continu à l'améliorer.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">5. Vos droits</h2>
              <p className="text-gray-700 mb-3">Vous avez le droit de :</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Accéder à vos données personnelles</li>
                <li>Rectifier les informations inexactes</li>
                <li>Demander la suppression (sous réserve d'obligations légales)</li>
                <li>Refuser les communications marketing</li>
                <li>Exporter vos données dans un format portable</li>
                <li>Retirer votre consentement</li>
              </ul>
              <p className="text-gray-700 mt-3">
                Pour exercer ces droits, contactez‑nous à <a href="mailto:privacy@imboni.serve" className="text-imboni-blue hover:underline">privacy@imboni.serve</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">6. Conservation des données</h2>
              <p className="text-gray-700">
                Nous conservons vos données aussi longtemps que nécessaire pour fournir le service et respecter les obligations légales.
                Les enregistrements de transactions sont conservés 7 ans selon la RRA. Les données de compte sont supprimées sous 90 jours
                après clôture, sauf obligation contraire.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">7. Cookies et suivi</h2>
              <p className="text-gray-700">
                Nous utilisons des cookies et technologies similaires pour améliorer l'expérience, analyser l'utilisation et personnaliser le contenu.
                Vous pouvez contrôler les cookies via les paramètres du navigateur. Voir notre <a href="/cookies" className="text-imboni-blue hover:underline ml-1">Politique de cookies</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">8. Confidentialité des enfants</h2>
              <p className="text-gray-700">
                Nos services ne s'adressent pas aux moins de 18 ans. Nous ne collectons pas sciemment leurs données. Si vous pensez
                que nous en avons collecté, contactez‑nous immédiatement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">9. Transferts internationaux</h2>
              <p className="text-gray-700">
                Vos données peuvent être transférées et traitées hors du Rwanda (États‑Unis, Union européenne). Nous mettons en place
                des garanties appropriées pour ces transferts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">10. Modifications de cette politique</h2>
              <p className="text-gray-700">
                Nous pouvons mettre à jour cette Politique de confidentialité. Nous vous informerons des changements importants par email
                ou notification sur la plateforme. L'utilisation continue vaut acceptation de la version mise à jour.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">11. Nous contacter</h2>
              <p className="text-gray-700">Pour toute question liée à la confidentialité, contactez‑nous :</p>
              <div className="bg-slate-50 rounded-lg p-4 mt-3">
                <p className="text-gray-700"><strong>Email :</strong> privacy@imboni.serve</p>
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
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">1. Amakuru Dukusanya</h2>
              <p className="text-gray-700 mb-3">
                Dukusanya amakuru kugirango duhe abakoreshwa serivisi nziza. Ubwoko bw'amakuru dukusanya burimo:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Amakuru y'Konti:</strong> Amazina, imeri, telefoni, amakuru y'ubucuruzi</li>
                <li><strong>Amakuru y'Ibyagurishijwe:</strong> Amateka y'ibicuruzwa, uburyo bwo kwishyura, amafaranga</li>
                <li><strong>Amakuru y'Ikoreshwa:</strong> Uburyo ukoresha urubuga, ibikorwa, igihe</li>
                <li><strong>Amakuru y'Ibikoresho:</strong> IP address, ubwoko bwa browser, sisitemu</li>
                <li><strong>Aho Uherereye:</strong> Aderesi y'ubucuruzi, aho batwarira (ubyemeje)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">2. Uko Dukoresha Amakuru Yawe</h2>
              <p className="text-gray-700 mb-3">Dukoresha amakuru yakusanyijwe kugirango:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Gutunganya ibicuruzwa n'ubwishyu</li>
                <li>Gutanga ubufasha ku bakiriya</li>
                <li>Kunoza serivisi zacu no gutegura ibishya</li>
                <li>Kohereza ubutumwa (kwemeza ibicuruzwa, inyemezabwishyu)</li>
                <li>Kurwanya uburiganya no kurinda umutekano</li>
                <li>Kubahiriza amategeko n'imisoro</li>
                <li>Kwamamaza (ubyemeje)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">3. Gusangira Amakuru</h2>
              <p className="text-gray-700 mb-3">
                Ntidugurisha amakuru yawe bwite. Dushobora gusangira amakuru yawe na:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Abatanga Serivisi:</strong> IremboPay, AWS, analytics</li>
                <li><strong>Abafatanyabikorwa:</strong> Resitora n'abagurisha ucuruza</li>
                <li><strong>Abategetsi:</strong> Iyo amategeko abisaba</li>
                <li><strong>Mu Bucuruzi:</strong> Mu gihe cyo guhuriza ubucuruzi</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">4. Umutekano w'Amakuru</h2>
              <p className="text-gray-700">
                Dukoresha uburyo bwo kurinda amakuru yawe, harimo encryption, seriveri zifite umutekano, 
                n'isuzuma ry'umutekano. Ariko nta buryo bwo kohereza amakuru bufite umutekano wa 100%. 
                Ntidushobora kwemeza umutekano wuzuye ariko tukomeza gukora kugirango turinde amakuru yawe.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">5. Uburenganzira Bwawe</h2>
              <p className="text-gray-700 mb-3">Ufite uburenganzira bwo:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Kubona amakuru yawe bwite</li>
                <li>Gukosora amakuru atari yo</li>
                <li>Gusaba gusiba amakuru yawe</li>
                <li>Kuva mu kwamamaza</li>
                <li>Kuva amakuru yawe mu buryo bushobora kwimurwa</li>
                <li>Gukuraho uburenganzira bwo gukoresha amakuru</li>
              </ul>
              <p className="text-gray-700 mt-3">
                Kugirango ukoreshe ubu burenganzira, twandikire kuri <a href="mailto:privacy@imboni.serve" className="text-imboni-blue hover:underline">privacy@imboni.serve</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">11. Tuvugishe</h2>
              <div className="bg-slate-50 rounded-lg p-4 mt-3">
                <p className="text-gray-700"><strong>Imeri:</strong> privacy@imboni.serve</p>
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
