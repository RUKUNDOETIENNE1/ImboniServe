import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import PublicLayout from '@/components/PublicLayout';
import { useTranslation } from '@/lib/i18n';

export default function TermsAndConditions() {
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
    <PublicLayout title={t('legal.terms.title_page', 'Terms & Conditions — Imboni Serve')}>
    <div className="bg-imboni-light">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-imboni-blue">
                {t('legal.terms.heading', 'Terms & Conditions')}
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
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700">
                By accessing and using the Imboni Serve platform, you accept and agree to be bound by these Terms and Conditions. 
                If you do not agree to these terms, please do not use our services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">2. Digital Payment Convenience Fee</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
                <h3 className="font-semibold text-amber-900 mb-2">Fee Policy</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Rate:</strong> {feePercent}% of the transaction amount (VAT included)</li>
                  <li><strong>Minimum Fee:</strong> RWF 100</li>
                  <li><strong>Maximum Fee:</strong> RWF 3,500</li>
                  <li><strong>Applies To:</strong> Card payments and mobile money transactions</li>
                  <li><strong>Does NOT Apply To:</strong> Cash payments</li>
                  <li><strong>Tips:</strong> Excluded from fee calculation</li>
                </ul>
              </div>
              <p className="text-gray-700">
                The convenience fee covers the cost of secure payment processing, fraud prevention, instant payment confirmation, 
                and reconciliation services. You can avoid this fee by paying with cash.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">3. Marketplace Commission</h2>
              <p className="text-gray-700 mb-3">
                For orders placed through the Imboni Serve marketplace, sellers are charged a commission based on their tier:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Launch Tier (10% + VAT):</strong> New sellers with fewer than 10 orders</li>
                <li><strong>Standard Tier (7% + VAT):</strong> Default rate for most sellers</li>
                <li><strong>High Volume Tier (5% + VAT):</strong> Sellers with monthly GMV exceeding RWF 5,000,000</li>
              </ul>
              <p className="text-gray-700 mt-3">
                Commission is calculated on the gross order amount and is subject to 18% VAT. Withholding tax (WHT) may apply 
                per Rwanda Revenue Authority (RRA) regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">4. Tax Compliance</h2>
              <p className="text-gray-700 mb-3">
                All fees and commissions are subject to Rwanda's tax regulations:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>VAT:</strong> 18% standard rate applies to all fees and commissions</li>
                <li><strong>EBM Receipts:</strong> All transactions generate RRA-compliant electronic receipts</li>
                <li><strong>Withholding Tax:</strong> May be applied to B2B commission payments as per RRA rules</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">5. Payment Terms</h2>
              <p className="text-gray-700">
                Payments are processed through our secure payment gateway (IremboPay). By using digital payment methods, 
                you authorize us to charge the transaction amount plus applicable convenience fees. Refunds are subject 
                to our refund policy and may take 7-14 business days to process.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">6. User Responsibilities</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Provide accurate payment and contact information</li>
                <li>Comply with all applicable laws and regulations</li>
                <li>Maintain the confidentiality of your account credentials</li>
                <li>Report any unauthorized use of your account immediately</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">7. Limitation of Liability</h2>
              <p className="text-gray-700">
                Imboni Serve is not liable for any indirect, incidental, or consequential damages arising from the use 
                of our platform. Our total liability is limited to the amount of fees paid by you in the 30 days 
                preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">8. Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon 
                posting to the platform. Continued use of our services constitutes acceptance of modified terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">9. Privacy & Cookies</h2>
              <p className="text-gray-700 mb-3">
                We respect your choices regarding non-essential cookies. Analytics and marketing cookies are disabled unless you
                provide consent via Cookie Preferences or Accept All. If your browser sends a Do Not Track (DNT) signal and no
                consent has been set, we default to functional-only cookies. You can change your preferences anytime using the
                Cookie Preferences link in the footer or Dashboard Settings → Privacy. See our Cookie Policy for full details.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">10. Contact Information</h2>
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> support@imboni.rw<br />
                  <strong>Phone:</strong> +250 788 917 126<br />
                  <strong>Address:</strong> Kigali, Rwanda
                </p>
              </div>
            </section>
          </div>
        )}

        {/* French Version */}
        {isFr && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">1. Acceptation des Conditions</h2>
              <p className="text-gray-700">
                En accédant et en utilisant la plateforme Imboni Serve, vous acceptez d'être lié par les présentes Conditions générales.
                Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser nos services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">2. Frais de service pour paiements numériques</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
                <h3 className="font-semibold text-amber-900 mb-2">Politique de frais</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Taux:</strong> {feePercent}% du montant de la transaction (TVA incluse)</li>
                  <li><strong>Frais minimum:</strong> RWF 100</li>
                  <li><strong>Frais maximum:</strong> RWF 3,500</li>
                  <li><strong>S'applique à:</strong> Paiements par carte et Mobile Money</li>
                  <li><strong>Ne s'applique pas à:</strong> Paiements en espèces</li>
                  <li><strong>Pourboires:</strong> Exclus du calcul des frais</li>
                </ul>
              </div>
              <p className="text-gray-700">
                Ces frais couvrent le traitement sécurisé des paiements, la prévention de la fraude, la confirmation instantanée
                des paiements et la réconciliation. Vous pouvez éviter ces frais en payant en espèces.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">3. Commission Marketplace</h2>
              <p className="text-gray-700 mb-3">
                Pour les commandes passées via la marketplace Imboni Serve, une commission est appliquée selon le palier du vendeur:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Palier Lancement (10% + TVA):</strong> Vendeurs nouveaux avec moins de 10 commandes</li>
                <li><strong>Palier Standard (7% + TVA):</strong> Taux par défaut pour la plupart des vendeurs</li>
                <li><strong>Gros Volume (5% + TVA):</strong> Vendeurs dont le GMV mensuel dépasse RWF 5,000,000</li>
              </ul>
              <p className="text-gray-700 mt-3">
                La commission est calculée sur le montant brut de la commande et est soumise à 18% de TVA. Une retenue à la source (WHT)
                peut s'appliquer conformément à la réglementation de la Rwanda Revenue Authority (RRA).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">4. Conformité Fiscale</h2>
              <p className="text-gray-700 mb-3">Tous les frais et commissions sont soumis à la réglementation fiscale du Rwanda:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>TVA:</strong> Taux standard de 18% appliqué à tous les frais et commissions</li>
                <li><strong>Reçus EBM:</strong> Toutes les transactions génèrent des reçus électroniques conformes RRA</li>
                <li><strong>Retenue à la source:</strong> Peut s'appliquer aux paiements de commission B2B selon les règles de la RRA</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">5. Modalités de Paiement</h2>
              <p className="text-gray-700">
                Les paiements sont traités via notre passerelle sécurisée (IremboPay). En utilisant un moyen de paiement numérique,
                vous nous autorisez à prélever le montant de la transaction ainsi que les frais applicables. Les remboursements suivent
                notre politique de remboursement et peuvent prendre 7 à 14 jours ouvrables.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">6. Responsabilités de l'Utilisateur</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Fournir des informations exactes de paiement et de contact</li>
                <li>Respecter toutes les lois et réglementations applicables</li>
                <li>Maintenir la confidentialité de vos identifiants de compte</li>
                <li>Signaler immédiatement toute utilisation non autorisée de votre compte</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">7. Limitation de Responsabilité</h2>
              <p className="text-gray-700">
                Imboni Serve ne saurait être tenue responsable des dommages indirects, accessoires ou consécutifs résultant de
                l'utilisation de la plateforme. Notre responsabilité totale est limitée au montant des frais payés par vous au cours
                des 30 jours précédant la réclamation.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">8. Modifications des Conditions</h2>
              <p className="text-gray-700">
                Nous nous réservons le droit de modifier ces conditions à tout moment. Les changements prennent effet dès leur
                publication sur la plateforme. L'utilisation continue de nos services vaut acceptation des conditions modifiées.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">9. Confidentialité & Cookies</h2>
              <p className="text-gray-700 mb-3">
                Nous respectons vos choix concernant les cookies non essentiels. Les cookies d'analyse et de marketing sont désactivés
                sauf si vous donnez votre consentement via « Préférences des cookies » ou « Tout accepter ». Si votre navigateur envoie
                un signal Do Not Track (DNT) et qu'aucun consentement n'est défini, nous n'activons que les cookies fonctionnels.
                Vous pouvez modifier vos préférences à tout moment via le lien « Préférences des cookies » dans le pied de page ou via
                Tableau de bord → Paramètres → Confidentialité. Consultez notre Politique de cookies pour plus de détails.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">10. Coordonnées</h2>
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> support@imboni.rw<br />
                  <strong>Téléphone:</strong> +250 788 917 126<br />
                  <strong>Adresse:</strong> Kigali, Rwanda
                </p>
              </div>
            </section>
          </div>
        )}

        {/* Kinyarwanda Version */}
        {isRw && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">1. Kwemera Amabwiriza</h2>
              <p className="text-gray-700">
                Ukoresha urubuga rwa Imboni Serve, wemera gukurikiza aya mabwiriza n'amategeko. 
                Niba utabyemeye, ntukoreshe serivisi zacu.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">2. Amafaranga ya Serivisi yo Kwishyura</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3">
                <h3 className="font-semibold text-amber-900 mb-2">Politiki y'Amafaranga</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-2">
                  <li><strong>Igipimo:</strong> {feePercent}% cy'amafaranga yose (harimo TVA)</li>
                  <li><strong>Amafaranga Make:</strong> RWF 100</li>
                  <li><strong>Amafaranga Menshi:</strong> RWF 3,500</li>
                  <li><strong>Bikoreshwa:</strong> Ikarita na Mobile Money</li>
                  <li><strong>Ntibikoreshwa:</strong> Amafaranga (cash)</li>
                  <li><strong>Ibishimbo:</strong> Ntibashyirwamo amafaranga ya serivisi</li>
                </ul>
              </div>
              <p className="text-gray-700">
                Amafaranga ya serivisi akoreshwa mu kurinda kwishyura, kurwanya uburiganya, no kwemeza kwishyura ako kanya. 
                Ushobora kwirinda aya mafaranga niwishyuye mu mafaranga (cash).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">3. Komisiyo ku Isoko</h2>
              <p className="text-gray-700 mb-3">
                Ku byatumijwe binyuze kuri Imboni Serve marketplace, abagurisha bishyurwa komisiyo hakurikijwe icyiciro cyabo:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>Icyiciro cya Mbere (10% + TVA):</strong> Abagurisha bashya bafite ibitumizwa biri munsi ya 10</li>
                <li><strong>Icyiciro Gisanzwe (7% + TVA):</strong> Igipimo gisanzwe ku bagurisha benshi</li>
                <li><strong>Icyiciro cy'Ubwinshi (5% + TVA):</strong> Abagurisha bafite GMV irenga RWF 5,000,000 buri kwezi</li>
              </ul>
              <p className="text-gray-700 mt-3">
                Komisiyo ibarwa ku gaciro kose k'itumizwa kandi igengwa na TVA 18%. Imisoro yakuwemo (WHT) ishobora gukoreshwa 
                hakurikijwe amategeko ya RRA.
              </p>
            </section>

            

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">4. Gukurikiza Imisoro</h2>
              <p className="text-gray-700 mb-3">
                Amafaranga yose ya serivisi na komisiyo akurikiza amategeko y'imisoro mu Rwanda:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li><strong>TVA:</strong> Igipimo gisanzwe cya 18% kikoreshwa ku mafaranga yose</li>
                <li><strong>Inyemezabuguzi za EBM:</strong> Ibikorwa byose bitanga inyemezabuguzi zemewe na RRA</li>
                <li><strong>Imisoro Yakuwemo:</strong> Ishobora gukoreshwa ku mishyurano ya komisiyo hakurikijwe RRA</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">5. Amabwiriza yo Kwishyura</h2>
              <p className="text-gray-700">
                Kwishyura bikorwa binyuze mu rubuga rufite umutekano (IremboPay). Ukoresheje uburyo bwo kwishyura kuri sisitemu, 
                uduha uburenganzira bwo gukurikirana amafaranga hamwe n'amafaranga ya serivisi. Gusubiza amafaranga bikurikiza 
                politiki yacu kandi bishobora gufata iminsi 7-14 y'akazi.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">6. Inshingano z'Abakoresha</h2>
              <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
                <li>Gutanga amakuru y'ukuri yo kwishyura no guhamagara</li>
                <li>Kubahiriza amategeko yose akurikizwa</li>
                <li>Kubika ibanga ry'imibare yawe y'umutekano</li>
                <li>Kumenyesha ako kanya iyo umuntu ukoresha konti yawe nta burenganzira</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">7. Aho Inshingano Zigarukira</h2>
              <p className="text-gray-700">
                Imboni Serve ntabwo ifite inshingano ku byangiritse bitaziguye, bidasanzwe, cyangwa biturutse ku gukoresha 
                urubuga rwacu. Inshingano zacu zose zigarukira ku mafaranga wishyuye mu minsi 30 mbere y'ikirego.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">8. Guhindura Amabwiriza</h2>
              <p className="text-gray-700">
                Dufite uburenganzira bwo guhindura aya mabwiriza igihe cyose. Impinduka zizatangira gukurikizwa ako kanya 
                zimaze gushyirwa ku rubuga. Gukomeza gukoresha serivisi zacu bivuze ko wemeye impinduka.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">9. Ibanga & Cookies</h2>
              <p className="text-gray-700 mb-3">
                Twubaha ibyo uhisemo ku byerekeye cookies zitari ngombwa. Isesengura (analytics) na kwamamaza (marketing)
                birahagarikwa keretse wemeye ukoresheje buto ya “Cookie Preferences” cyangwa “Accept all”. Niba mushakabanga wawe
                woherereza ikimenyetso cya Do Not Track (DNT) kandi nta byemezo byawe byarashyizweho, duhitamo gusa cookies z’ingenzi
                (functional). Ushobora guhindura ibyo wahisemo igihe icyo ari cyo cyose ukoresheje “Cookie Preferences” iri mu footer
                cyangwa muri Dashboard → Igenamiterere → Ibanga. Soma Politiki ya Cookies kugira ngo umenye byinshi.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-imboni-blue mb-3">10. Amakuru yo Guhamagara</h2>
              <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
                <p className="text-gray-700">
                  <strong>Email:</strong> support@imboni.resto<br />
                  <strong>Telefoni:</strong> +250 788 917 126<br />
                  <strong>Aderesi:</strong> Kigali, Rwanda
                </p>
              </div>
            </section>
          </div>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-imboni-blue hover:text-imboni-orange transition">
            ← {t('auth.back_to_home', 'Back to home')}
          </Link>
        </div>
      </div>
    </div>
    </PublicLayout>
  );
}
