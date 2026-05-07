import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import PublicLayout from '@/components/PublicLayout';
import { useTranslation } from '@/lib/i18n';

interface FAQItem {
  question: string;
  questionRW: string;
  answer: string;
  answerRW: string;
}

export default function FAQ() {
  const { t } = useTranslation();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
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

  const faqs: FAQItem[] = [
    {
      question: "Why is there a convenience fee for digital payments?",
      questionRW: "Kuki hari amafaranga ya serivisi ku kwishyura kuri sisitemu?",
      answer: `The ${feePercent}% convenience fee covers the cost of secure payment processing, fraud prevention, instant payment confirmation, and reconciliation services. These services ensure your payment is safe, fast, and properly recorded. Cash payments have no fee.`,
      answerRW: `Amafaranga ya serivisi ${feePercent}% akoreshwa mu kurinda kwishyura, kurwanya uburiganya, kwemeza kwishyura ako kanya, no guhuza ibikorwa. Ibi bikorwa birinda ko kwishyura kwawe kuri umutekano, byihuta, kandi byanditswe neza. Kwishyura mu mafaranga (cash) nta kiguzi.`
    },
    {
      question: "How can I avoid the convenience fee?",
      questionRW: "Nigute nshobora kwirinda amafaranga ya serivisi?",
      answer: "Simply pay with cash! The convenience fee only applies to card and mobile money payments. When you pay cash, you pay exactly the menu price with no additional fees.",
      answerRW: "Wishyure mu mafaranga (cash) gusa! Amafaranga ya serivisi akoreshwa gusa ku kwishyura ukoresheje ikarita na mobile money. Niwishyuye mu mafaranga, wishyura ibiciro byanditse gusa nta kiguzi cyiyongera."
    },
    {
      question: "What is the minimum and maximum fee?",
      questionRW: "Ni ayahe mafaranga make n'ayahe manini?",
      answer: "The minimum fee is RWF 100 (for small orders) and the maximum is RWF 3,500 (to keep fees fair on large orders). This means you'll never pay more than RWF 3,500 in convenience fees, no matter how large your order.",
      answerRW: "Amafaranga make ni RWF 100 (ku byatumijwe bito) kandi amafaranga menshi ni RWF 3,500 (kugira ngo amafaranga agume ku rugero rwo kubahiriza ubutabera ku byatumijwe binini). Ibi bivuze ko utazishyura kuruta RWF 3,500 mu mafaranga ya serivisi, uko itumizwa ryaba rinini."
    },
    {
      question: "Are tips included in the fee calculation?",
      questionRW: "Ibishimbo bishyirwa mu kubara amafaranga ya serivisi?",
      answer: "No. Tips are excluded from the convenience fee calculation. The fee is only calculated on your food and drink order total, not on any tips you choose to give.",
      answerRW: "Oya. Ibishimbo ntibashyirwamo kubara amafaranga ya serivisi. Amafaranga abarwa gusa ku itumizwa ry'ibiryo n'ibinyobwa, ntabwo ashyirwamo ibishimbo uhitamo gutanga."
    },
    {
      question: "Is VAT included in the convenience fee?",
      questionRW: "TVA iri mu mafaranga ya serivisi?",
      answer: `Yes. The ${feePercent}% convenience fee shown to you is VAT-inclusive. This means the price you see is the final price you pay - there are no hidden taxes added at checkout.`,
      answerRW: `Yego. Amafaranga ya serivisi ${feePercent}% agaragara harimo TVA. Ibi bivuze ko ibiciro ubona ari ibiciro nyayo uzishyura - nta misoro ihishe yongerwa igihe wishyura.`
    },
    {
      question: "What payment methods have the convenience fee?",
      questionRW: "Ni ubuhe buryo bwo kwishyura bufite amafaranga ya serivisi?",
      answer: "The convenience fee applies to: Card payments (Visa, Mastercard) and Mobile Money (MTN, Airtel). Cash and bank transfers do not have a convenience fee.",
      answerRW: "Amafaranga ya serivisi akoreshwa kuri: Ikarita (Visa, Mastercard) na Mobile Money (MTN, Airtel). Amafaranga (cash) no kohereza kuri banki nta kiguzi."
    },
    {
      question: "How is the marketplace commission calculated?",
      questionRW: "Komisiyo ku isoko ibarwa gute?",
      answer: "For marketplace orders, sellers pay a commission: 10% + VAT for new sellers (launch tier), 7% + VAT for standard sellers, and 5% + VAT for high-volume sellers (over RWF 5M/month). This commission covers platform services, marketing, and payment processing.",
      answerRW: "Ku byatumijwe binyuze kuri marketplace, abagurisha bishyurwa komisiyo: 10% + TVA ku bagurisha bashya, 7% + TVA ku bagurisha bisanzwe, na 5% + TVA ku bagurisha b'ubwinshi (barenga RWF 5M/ukwezi). Iyi komisiyo ikubiyemo serivisi z'urubuga, kwamamaza, no gutunganya kwishyura."
    },
    {
      question: "Can I get a receipt for my payment?",
      questionRW: "Nshobora kubona inyemezabuguzi y'uko nishyuye?",
      answer: "Yes! All payments generate an official EBM-compliant receipt that shows your order details, the convenience fee (if applicable), VAT breakdown, and total amount. You'll receive this receipt via email and can also view it in your account.",
      answerRW: "Yego! Kwishyura kwose gutanga inyemezabuguzi yemewe na EBM igaragaza ibisobanuro by'itumizwa ryawe, amafaranga ya serivisi (niba bikoreshwa), ibisobanuro bya TVA, n'amafaranga yose. Uzakira iyi nyemezabuguzi kuri email kandi ushobora kuyireba kuri konti yawe."
    },
    {
      question: "What if I have a problem with the fee charged?",
      questionRW: "Niba mfite ikibazo ku mafaranga yanjijwe?",
      answer: "If you believe you were charged incorrectly, please contact our support team at support@imboni.resto or call +250 788 917 126. We'll review your transaction and resolve any issues within 24-48 hours.",
      answerRW: "Niba wibwira ko wanjijwe amafaranga atari yo, nyamuneka hamagara ikipe yacu ifasha kuri support@imboni.resto cyangwa uhamagare kuri +250 788 917 126. Tuzasuzuma ibikorwa byawe kandi tukemure ibibazo byose mu masaha 24-48."
    },
    {
      question: "Will the fee change in the future?",
      questionRW: "Amafaranga azahinduka mu gihe kizaza?",
      answer: "We may adjust fees based on market conditions and operating costs. Any changes will be communicated at least 30 days in advance via email and on our platform. You can always check the current fee policy on our Terms & Conditions page.",
      answerRW: "Dushobora guhindura amafaranga hakurikijwe isoko n'ibiciro byo gukora. Impinduka zose zizamenyeshwa byibuze iminsi 30 mbere binyuze kuri email no ku rubuga rwacu. Ushobora buri gihe kureba politiki y'amafaranga igezweho ku rupapuro rw'Amabwiriza n'Amategeko."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <PublicLayout title={t('faq.title_page', 'FAQ — Imboni Serve')}>
    <div className="bg-imboni-light">
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-imboni-blue">
                {t('faq.heading', 'Frequently Asked Questions')}
              </h1>
              <p className="text-gray-600 mt-2">
                {t('faq.subtitle', 'Payment Fees & Platform Policies')}
              </p>
            </div>
            
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
              >
                <span className="font-semibold text-imboni-blue pr-4">
                  {t(`faq.items.${index}.q`)}
                </span>
                <svg
                  className={`w-5 h-5 text-imboni-blue transform transition-transform flex-shrink-0 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {openIndex === index && (
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700">
                    {t(`faq.items.${index}.a`)}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="bg-primary-50 border border-primary-100 rounded-2xl p-6 mt-6">
          <h2 className="text-xl font-semibold text-imboni-blue mb-3">
            {t('faq.contact.heading', 'Still Have Questions?')}
          </h2>
          <p className="text-gray-700 mb-4">
            {t('faq.contact.body', 'Our support team is here to help! Contact us anytime.')}
          </p>
          <div className="space-y-2 text-gray-700">
            <p><strong>{t('faq.contact.email_label', 'Email:')}</strong> support@imboni.resto</p>
            <p><strong>{t('faq.contact.phone_label', 'Phone:')}</strong> +250 788 917 126</p>
            <p><strong>{t('faq.contact.hours_label', 'Hours:')}</strong> {t('faq.contact.hours_value', 'Monday - Sunday, 8:00 AM - 10:00 PM')}</p>
          </div>
        </div>

        {/* Links */}
        <div className="mt-6 flex justify-center gap-6 text-sm">
          <Link href="/terms" className="text-imboni-blue hover:text-imboni-orange transition">
            {t('public.footer.terms', 'Terms & Conditions')}
          </Link>
          <Link href="/" className="text-imboni-blue hover:text-imboni-orange transition">
            {t('auth.back_to_home', 'Back to home')}
          </Link>
        </div>
      </div>
    </div>
    </PublicLayout>
  );
}
