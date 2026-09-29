import React, { useEffect, useState } from 'react';
import Head from 'next/head';
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
      question: "Do I need to download an app to scan the QR code?",
      questionRW: "Ese nshobora gukoresha telefone yanjye yo guskaneramo QR code?",
      answer: "No. You don't need a special app. Just open the camera on your iPhone or Android phone, point it at the Imboni Serve QR code, and tap the link that appears on your screen. Open camera → Scan QR → Tap the link → Start ordering. No download. No installation. No hassle.",
      answerRW: "Oya. Nta moko w'app yihariye usabwa. Fungura kamera y'umuteregeli wawe (iPhone cyangwa Android), uyobereze ku kodo QR ya Imboni Serve, hanyuma ukande ahari urubingo rugaragara kuri ekrani. Fungura kamera → Sikana QR → Kanda urubingo → Tangira kwitegura ibyo kurya. Nta kugura, nta gushyira, nta buriganya."
    },
    {
      question: "How do I order using a QR code?",
      questionRW: "Nshobora gute kwitegura ibyo kurya ukoresheje QR code?",
      answer: "It's simple. Scan the QR code at your table with your phone's camera. Your digital menu will open instantly. Choose what you'd like, place your order, and follow the instructions on your screen. You can order without downloading an app.",
      answerRW: "Byoroshye. Sikana QR code iri ku meza yawe ukoresheje kamera ya telefoni. Menyu yawe ya digital izafunguka ako kanya. Hitamo ibyo ushaka, ohereze ibyo wateye, hanyuma ukurikize amabwiriza agaragara kuri ekrani. Ushobora kwitegura ibyo kurya nta makoresha app."
    },
    {
      question: "Do I need an account to order?",
      questionRW: "Ese nkeneye konti kugira ngo ntegere ibyo kurya?",
      answer: "No. You can browse the menu and place an order without downloading an app or creating an account. If the business offers additional features such as loyalty rewards or order history, you may be given the option to create an account.",
      answerRW: "Oya. Ushobora kureba menyu no kwitegura ibyo kurya nta makoresha app cyangwa kurema konti. Niba uruganda rufite izindi serivisi nka puntu zo kwizerwa cyangwa amateka y'ibyo wateye, bishobora ko bahita bahita baguha uruhugo rwo kurema konti."
    },
    {
      question: "Can I order from my own phone?",
      questionRW: "Ese nshobora kwitegura ibyo kurya ku telefoni yanjye?",
      answer: "Yes. Imboni Serve is designed to work directly from your phone's web browser. You don't need to install a separate application. Simply scan the QR code and start ordering.",
      answerRW: "Yego. Imboni Serve yubatswe mu buryo ikora ako kanya ku murongo w'urubuga (browser) wa telefoni. Nta mukoresha app yihariye. Sikana QR code hanyuma utangire kwitegura ibyo kurya."
    },
    {
      question: "What if my phone doesn't scan the QR code?",
      questionRW: "Ni ibihe nakora niba telefoni yanje itabashe gusikana QR code?",
      answer: "Most modern smartphones can scan QR codes directly using the camera. If your camera doesn't recognize the code, you can use your phone's built-in QR scanner or Google Lens on Android. You can also ask a member of staff to help you.",
      answerRW: "Telefoni nyinshi za none zishobora gusikana QR code zikoresha kamera. Niba kamera yanje itabasha kwamenya kodo, ushobora gukoresha scanner ya QR yo muri telefoni cyangwa Google Lens ku Android. Ushobora kandi kubaza umugeni cyangwa umukozi bafasha."
    },
    {
      question: "Can I still ask a staff member to take my order?",
      questionRW: "Ese nshobora kongera kubaza umukozi kwitereka ibyo kurya?",
      answer: "Absolutely. Digital ordering is designed to make ordering easier, not to replace hospitality. Depending on the business, you may be able to order yourself through the QR menu, order through WhatsApp, or simply ask a member of staff for assistance.",
      answerRW: "Yego rwose. Kwitegura ibyo kurya kuri digital byakorewe kugira ngo byorohere kwitegura, ntabwo ari ukuvuga ko bimura ubuhitse. Hakurikijwe uruganda, ushobora kwitegura ubwawe ukoresheje menyu QR, kwitegura ukoresheje WhatsApp, cyangwa kubaza umukozi bafasha."
    },
    {
      question: "Can I order through WhatsApp?",
      questionRW: "Ese nshobora kwitegura ibyo kurya ukoresheje WhatsApp?",
      answer: "If the business has enabled WhatsApp ordering, yes. You can interact with the business through WhatsApp and get assistance with your order without needing to download another app.",
      answerRW: "Niba uruganda rukoze uburyo bwo kwitegura ukoresheje WhatsApp, yego. Ushobora kuvugana n'uruganda ukoresheje WhatsApp kandi ukabonera ubufasha ku byo wateye nta makoresha app y'indi."
    },
    {
      question: "Why is there a convenience fee for digital payments?",
      questionRW: "Kuki hari amafaranga ya serivisi ku kwishyura kuri sisitemu?",
      answer: `The ${feePercent}% convenience fee covers the cost of secure payment processing, fraud prevention, instant payment confirmation, and reconciliation services. These services help ensure your payment is safe, fast, and properly recorded. Cash payments have no convenience fee.`,
      answerRW: `Amafaranga ya serivisi ${feePercent}% akoreshwa mu gutunganya kwishyura kwizewe, kurwanya uburiganya, kwemeza kwishyura ako kanya, no guhuza ibikorwa. Ibi bikorwa bifasha guhingura ko kwishyura kwawe kuri umutekano, byihuta, kandi byanditswe neza. Kwishyura mu mafaranga (cash) nta mafaranga ya serivisi afite.`
    },
    {
      question: "How can I avoid the convenience fee?",
      questionRW: "Nigute nshobora kwirinda amafaranga ya serivisi?",
      answer: "Simply pay with cash. The convenience fee applies only to card and mobile money payments. When you pay with cash, you pay exactly the menu price with no additional convenience fee.",
      answerRW: "Wishyure mu mafaranga (cash). Amafaranga ya serivisi akoreshwa gusa ku kwishyura hakoreshejwe ikarita na mobile money. Iyo wishyuye mu mafaranga, wishyura ibiciro byanditse ku menyu nta mafaranga ya serivisi yongera."
    },
    {
      question: "What is the minimum and maximum convenience fee?",
      questionRW: "Ni ayahe mafaranga make n'ayahe manini ya serivisi?",
      answer: "The minimum convenience fee is RWF 100 for small orders, and the maximum is RWF 3,500. This means you will never pay more than RWF 3,500 in convenience fees, no matter how large your order is.",
      answerRW: "Amafaranga make ya serivisi ni RWF 100 ku byo wateye bito, naho manini ni RWF 3,500. Ibi bivuze ko utazishyura kuruta RWF 3,500 mu mafaranga ya serivisi, uko ibyo wateye byaba binini."
    },
    {
      question: "Are tips included in the fee calculation?",
      questionRW: "Ibishimbo bishyirwa mu kubara amafaranga ya serivisi?",
      answer: "No. Tips are excluded from the convenience fee calculation. The fee is calculated only on your food and drink order total, not on any tips you choose to give.",
      answerRW: "Oya. Ibishimbo ntibashyirwamo mu kubara amafaranga ya serivisi. Amafaranga abarwa gusa ku byo wateye (ibiryo n'ibinyobwa), ntabwo ashyirwamo ibishimbo uhitamo gutanga."
    },
    {
      question: "Is VAT included in the convenience fee?",
      questionRW: "TVA iri mu mafaranga ya serivisi?",
      answer: `Yes. The ${feePercent}% convenience fee shown to you is VAT-inclusive. This means the fee displayed at checkout already includes VAT. There are no additional taxes added to the convenience fee.`,
      answerRW: `Yego. Amafaranga ya serivisi ${feePercent}% agaragara harimo TVA. Ibi bivuze ko amafaranga agaragara igihe wishyura hari ishingiro bimaze kubamo TVA. Nta yandi mafaranga y'umusoro yongerwa ku mafaranga ya serivisi.`
    },
    {
      question: "What payment methods have the convenience fee?",
      questionRW: "Ni ubuhe buryo bwo kwishyura bufite amafaranga ya serivisi?",
      answer: "The convenience fee applies to: Card payments, including Visa and Mastercard; Mobile Money, including MTN Mobile Money and Airtel Money. Cash and bank transfers do not have a convenience fee.",
      answerRW: "Amafaranga ya serivisi akoreshwa kuri: Kwishyura ku karita, harimo Visa na Mastercard; Mobile Money, harimo MTN Mobile Money na Airtel Money. Kwishyura mu mafaranga (cash) no kohereza kuri banki nta mafaranga ya serivisi bifite."
    },
    {
      question: "Can I pay with cash?",
      questionRW: "Ese nshobora kwishyura mu mafaranga (cash)?",
      answer: "Yes. If the business accepts cash, you can choose to pay with cash. Cash payments do not attract the digital-payment convenience fee.",
      answerRW: "Yego. Niba uruganda ruemera amafaranga, ushobora guhitamo kwishyura mu mafaranga. Kwishyura mu mafaranga nta mafaranga ya serivisi yo kwishyura kuri digital byatuma byagaragara."
    },
    {
      question: "Can I get a receipt for my payment?",
      questionRW: "Nshobora kubona inyemezabuguzi y'uko nishyuye?",
      answer: "Yes. Payments generate an official EBM-compliant receipt showing your order details, applicable convenience fee, VAT breakdown, and total amount. Depending on the business and your order, your receipt may be delivered digitally and/or made available through your account.",
      answerRW: "Yego. Kwishyura gutanga inyemezabuguzi yemewe na EBM igaragaza ibisobanuro by'ibyo wateye, amafaranga ya serivisi (niba ahari), ibisobanuro bya TVA, n'amafaranga yose. Hakurikijwe uruganda n'ibyo wateye, inyemezabuguzi yawe ishobora kuhabwa mu buryo digital cyangwa kuboneka kuri konti yawe."
    },
    {
      question: "What if I have a problem with the fee charged?",
      questionRW: "Niba mfite ikibazo ku mafaranga yanjijwe, nakora iki?",
      answer: "If you believe you were charged incorrectly, please contact our support team at support@imboniserve.com or call +250 735 214 496. We'll review your transaction and work to resolve the issue.",
      answerRW: "Niba wibwira ko wanjijwe amafaranga atari yo, nyamuneka twandikire ku kipe yacu ifasha kuri support@imboniserve.com cyangwa uhamagare +250 735 214 496. Tuzasuzuma igikorwa cyawe tukagukorera kugira ngo dukemure ikibazo."
    },
    {
      question: "Will the convenience fee change in the future?",
      questionRW: "Amafaranga ya serivisi azahinduka mu gihe kizaza?",
      answer: "We may adjust fees based on market conditions and operating costs. Any changes will be communicated at least 30 days in advance via email and on our platform. You can always check the current fee policy on our Terms & Conditions page.",
      answerRW: "Dushobora guhindura amafaranga hakurikijwe imiterere y'isoko n'ibiciro byo gukora. Impinduka zose zizamenyeshwa nibura iminsi 30 mbere binyuze kuri email no kuri platform yacu. Ushobora buri gihe kureba politiki y'amafaranga igezweho ku rupapuro rw'Amabwiriza n'Amategeko."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <PublicLayout title={t('faq.title_page', 'FAQ — Imboni Serve')}>
    <Head>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
    </Head>
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
                {t('faq.subtitle', 'QR Ordering, Payments & Support')}
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
                aria-expanded={openIndex === index}
                aria-controls={`faq-panel-${index}`}
                id={`faq-button-${index}`}
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
                <div
                  id={`faq-panel-${index}`}
                  role="region"
                  aria-labelledby={`faq-button-${index}`}
                  className="px-6 py-4 bg-gray-50 border-t border-gray-200"
                >
                  <p className="text-gray-700 whitespace-pre-line">
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
            {t('faq.contact.body', 'Our support team is here to help. Contact us anytime.')}
          </p>
          <div className="space-y-2 text-gray-700">
            <p><strong>{t('faq.contact.email_label', 'Email:')}</strong> <a href="mailto:support@imboniserve.com" className="text-imboni-blue hover:text-imboni-orange transition">support@imboniserve.com</a></p>
            <p><strong>{t('faq.contact.phone_label', 'Phone:')}</strong> +250 735 214 496</p>
            <p><strong>{t('faq.contact.hours_label', 'Hours:')}</strong> {t('faq.contact.hours_value', 'Monday – Sunday, 8:00 AM – 10:00 PM')}</p>
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
