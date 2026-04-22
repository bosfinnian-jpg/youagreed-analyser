'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';

// ============================================================================
// TRACE.AI — Terms of Service
// Dark background, EB Garamond body, Courier metadata.
// Dense and document-like — §19.2 hides in plain sight.
// ============================================================================

const termsContent: Array<{ title: string; content: string }> = [
  {
    title: '1. Definitions and Interpretation',
    content: `1.1 In these Terms of Service ("Terms"), the following definitions shall apply unless the context otherwise requires:

"Agreement" means these Terms of Service together with any schedules, annexes, or documents incorporated by reference herein.

"Authorised User" means any individual who accesses or uses the Service with the express or implied permission of the Account Holder.

"Content" means any text, images, audio, video, data files, conversation logs, metadata, timestamps, behavioural patterns, interaction sequences, or other material uploaded to, transmitted through, processed by, or generated within the Service.

"Data Controller" has the meaning given to it under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.

"Data Processor" has the meaning given to it under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.

"Personal Data" has the meaning given to it under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.

"Platform" means the trace.ai web application, including all associated interfaces, APIs, databases, algorithms, and supporting infrastructure.

"Processing" has the meaning given to it under the UK General Data Protection Regulation (UK GDPR) and includes any operation or set of operations performed on Personal Data or sets of Personal Data, whether or not by automated means.

"Service" means the privacy analysis, data visualisation, pattern recognition, and related functionality provided through the Platform.

"User", "you", or "your" refers to any individual or entity accessing or using the Service.

"We", "us", "our", or "Provider" refers to the operators of the trace.ai Platform.

1.2 In these Terms, words in the singular include the plural and vice versa; a reference to a statute is a reference to it as amended from time to time; references to clauses are to the clauses of these Terms.`,
  },
  {
    title: '2. Acceptance of Terms',
    content: `2.1 By accessing, browsing, or using the Service in any manner, including but not limited to visiting or browsing the Platform, uploading Content, or utilising any of the features, functionalities, or resources available through the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and all applicable laws and regulations.

2.2 If you do not agree with any of these Terms, you are prohibited from using or accessing the Service. Your continued use of the Service following the posting of any changes to these Terms shall constitute your acceptance of such changes.

2.3 These Terms constitute a legally binding agreement between you and the Provider. You represent and warrant that you have the legal capacity to enter into this Agreement in accordance with the laws of England and Wales.

2.4 The Provider reserves the right to modify, amend, or update these Terms at any time without prior notice. Such modifications shall be effective immediately upon posting to the Platform. It is your responsibility to review these Terms periodically for changes.

2.5 Certain features of the Service may be subject to additional terms and conditions, which shall be presented to you at the relevant time. By using such features, you agree to be bound by those additional terms and conditions.`,
  },
  {
    title: '3. Eligibility',
    content: `3.1 The Service is intended for users who are at least eighteen (18) years of age or the age of majority in their jurisdiction, whichever is greater. By using the Service, you represent and warrant that you meet this eligibility requirement.

3.2 The Service is not available to users who have been previously suspended or removed from the Platform, or whose access has been terminated for any reason.

3.3 You agree to provide accurate, current, and complete information during any upload process.

3.4 The Provider reserves the right to refuse service, terminate accounts, remove or edit content, or cancel access at its sole discretion, without notice, for any reason, including but not limited to violation of these Terms.`,
  },
  {
    title: '4. Description of Service',
    content: `4.1 The Service provides users with tools and functionality to analyse conversation data exported from third-party artificial intelligence platforms, including but not limited to ChatGPT, Claude, Gemini, and similar conversational AI services.

4.2 The Service performs the following analytical functions:

(a) Privacy Exposure Analysis: Identification and categorisation of personal information, including but not limited to names, locations, addresses, telephone numbers, email addresses, financial information, health-related data, employment details, relationship information, and other personally identifiable information;

(b) Behavioural Pattern Analysis: Examination of conversation topics, interaction frequencies, temporal patterns, emotional indicators, communication styles, and usage behaviours;

(c) Risk Scoring: Generation of privacy risk assessments based on the sensitivity, volume, and nature of information detected within uploaded Content;

(d) Data Visualisation: Graphical representation of analytical findings in various formats.

4.3 All analysis is performed locally within your web browser using client-side processing technologies. No Content is transmitted to external servers during the analysis phase unless explicitly stated otherwise in these Terms.

4.4 The Provider makes no representations or warranties regarding the accuracy, completeness, reliability, or suitability of the analytical results. The Service is provided for informational and educational purposes only.

4.5 The Provider reserves the right to modify, suspend, or discontinue any aspect of the Service at any time without prior notice or liability.`,
  },
  {
    title: '5. User Content and Uploads',
    content: `5.1 You retain ownership of any Content you upload to the Service. However, by uploading Content, you grant the Provider certain rights as specified in these Terms.

5.2 You represent and warrant that:

(a) you own or have the necessary rights, licences, consents, and permissions to upload and submit the Content;

(b) the Content does not violate any applicable laws, regulations, or third-party rights, including intellectual property rights, privacy rights, or contractual obligations;

(c) the Content does not contain any viruses, malware, or other harmful code;

(d) the Content has been lawfully obtained and does not include data obtained through unauthorised access, hacking, or other illegal means.

5.3 You acknowledge that conversation data exported from third-party AI services may contain personal information belonging to you and potentially to third parties referenced in your conversations. You accept sole responsibility for ensuring that your upload and processing of such data complies with all applicable data protection laws.

5.4 The Provider reserves the right, but has no obligation, to review, screen, or monitor any Content uploaded to the Service and to remove or refuse any Content that violates these Terms or is otherwise objectionable.`,
  },
  {
    title: '6. Local Processing and Browser-Based Analysis',
    content: `6.1 The Service utilises client-side processing technologies to analyse Content locally within your web browser environment. This means that the computational analysis of your uploaded data occurs on your device rather than on external servers.

6.2 Local processing is implemented using industry-standard web technologies including but not limited to JavaScript, WebAssembly, and browser-native APIs.

6.3 While local processing minimises the transmission of Content to external systems, you acknowledge that:

(a) certain metadata, analytics data, or aggregated non-personal information may be collected and transmitted for service improvement purposes;

(b) error logs, performance metrics, and diagnostic information may be transmitted to help maintain and improve the Service;

(c) third-party services integrated into the Platform may have their own data collection practices governed by their respective privacy policies.

6.4 The effectiveness of local processing depends on the capabilities of your device and browser. The Provider makes no guarantees regarding performance, processing speed, or compatibility with all devices or browsers.

6.5 You are responsible for ensuring the security of your own device and browser environment.`,
  },
  {
    title: '7. Data Protection and Privacy',
    content: `7.1 The Provider is committed to protecting your privacy and handling your Personal Data in accordance with the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, and other applicable data protection legislation.

7.2 For the purposes of applicable data protection law:

(a) You are the Data Controller in respect of any Personal Data contained within Content you upload to the Service;

(b) The Provider acts as a Data Processor in respect of any processing of Personal Data that occurs through the Service.

7.3 The Provider shall:

(a) process Personal Data only in accordance with your instructions as documented in these Terms;

(b) implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk;

(c) assist you in responding to requests from data subjects exercising their rights under data protection law.

7.4 You acknowledge that by uploading Content containing Personal Data relating to third parties, you assume responsibility as Data Controller for ensuring that such processing is lawful and that appropriate notices have been provided to and consents obtained from those third parties where required.

7.5 In the event of a Personal Data breach, the Provider shall notify you without undue delay after becoming aware of such breach.`,
  },
  {
    title: '8. Intellectual Property Rights',
    content: `8.1 The Service and its entire contents, features, and functionality are owned by the Provider, its licensors, or other providers of such material and are protected by United Kingdom and international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.

8.2 Subject to your compliance with these Terms, the Provider grants you a limited, non-exclusive, non-transferable, non-sublicensable, revocable licence to access and use the Service for your personal, non-commercial purposes.

8.3 You must not:

(a) reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on the Platform, except as incidental to normal web browsing;

(b) access or use the Service for any commercial purposes without the prior written consent of the Provider;

(c) attempt to reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of any software used in the Service;

(d) use any robot, spider, scraper, or other automated means to access the Service for any purpose;

(e) interfere with or circumvent any security features of the Service.

8.4 Any feedback, comments, or suggestions you provide regarding the Service shall be deemed non-confidential, and the Provider shall be free to use such information on an unrestricted basis without any obligation to you.`,
  },
  {
    title: '9. Prohibited Uses',
    content: `9.1 You agree not to use the Service:

(a) in any way that violates any applicable federal, state, local, or international law or regulation;

(b) to transmit or procure the sending of any advertising or promotional material, including any "junk mail", "chain letter", "spam", or any other similar solicitation;

(c) to impersonate or attempt to impersonate the Provider, a Provider employee, another user, or any other person or entity;

(d) to upload Content obtained through unauthorised access to third-party systems or accounts;

(e) to process data belonging to third parties without their knowledge or consent where such consent is required by law;

(f) to attempt to circumvent, disable, or otherwise interfere with security-related features of the Service;

(g) to introduce any viruses, trojan horses, worms, logic bombs, or other material that is malicious or technologically harmful;

(h) to attempt to gain unauthorised access to any portions of the Service, other accounts, computer systems, or networks connected to the Service.

9.2 The Provider reserves the right to investigate and prosecute violations of any of the above and to cooperate with law enforcement authorities in prosecuting users who violate these Terms.`,
  },
  {
    title: '10. Third-Party Services',
    content: `10.1 The Service may contain links to third-party websites, services, or resources that are not owned or controlled by the Provider. The Provider has no control over and assumes no responsibility for the content, privacy policies, or practices of any third-party websites or services.

10.2 The Service relies on conversation data exported from third-party AI platforms. You acknowledge that:

(a) the format, structure, and content of such exports are determined by those third parties;

(b) the Provider makes no representations regarding the completeness or accuracy of third-party exports;

(c) changes to third-party export formats may affect the functionality of the Service;

(d) your use of third-party AI platforms is governed by their respective terms of service and privacy policies.

10.3 You are encouraged to review the terms and conditions and privacy policies of any third-party websites or services that you visit or use.`,
  },
  {
    title: '11. Disclaimers and Limitation of Liability',
    content: `11.1 THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. THE PROVIDER DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.

11.2 The Provider does not warrant that:

(a) the Service will meet your requirements or expectations;

(b) the Service will be uninterrupted, timely, secure, or error-free;

(c) the results obtained from the use of the Service will be accurate, reliable, or complete;

(d) any errors in the Service will be corrected.

11.3 You acknowledge and agree that:

(a) privacy risk scores and assessments are estimates based on algorithmic analysis and should not be relied upon as definitive evaluations;

(b) the detection of personal information may not be exhaustive, and the Service may fail to identify certain types of sensitive data;

(c) the Service is not a substitute for professional legal, privacy, or security advice.

11.4 IN NO EVENT SHALL THE PROVIDER BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.

11.5 THE TOTAL LIABILITY OF THE PROVIDER FOR ANY CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED ONE HUNDRED POUNDS (£100).`,
  },
  {
    title: '12. Indemnification',
    content: `12.1 You agree to defend, indemnify, and hold harmless the Provider, its affiliates, licensors, and service providers, and its and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable legal fees) arising out of or relating to:

(a) your violation of these Terms;

(b) your violation of any third-party right, including without limitation any intellectual property right, publicity right, confidentiality right, property right, or privacy right;

(c) your violation of any applicable law, rule, or regulation;

(d) any Content you upload, submit, store, or otherwise make available through the Service.

12.2 This indemnification obligation will survive the termination or expiration of these Terms and your use of the Service.`,
  },
  {
    title: '13. Termination',
    content: `13.1 These Terms are effective unless and until terminated by either you or the Provider.

13.2 You may terminate your use of the Service at any time by discontinuing access to the Platform and deleting any locally stored data.

13.3 The Provider may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach any provision of these Terms.

13.4 Upon termination:

(a) your right to use the Service will immediately cease;

(b) you must immediately discontinue all use of the Service;

(c) the Provider shall have no obligation to maintain or provide any Content or data to you.

13.5 All provisions of these Terms which by their nature should survive termination shall survive termination, including without limitation ownership provisions, warranty disclaimers, indemnification, and limitations of liability.`,
  },
  {
    title: '14. Governing Law and Jurisdiction',
    content: `14.1 These Terms and any dispute or claim arising out of or in connection with them or their subject matter or formation (including non-contractual disputes or claims) shall be governed by and construed in accordance with the laws of England and Wales.

14.2 Each party irrevocably agrees that the courts of England and Wales shall have exclusive jurisdiction to settle any dispute or claim arising out of or in connection with these Terms or their subject matter or formation (including non-contractual disputes or claims).

14.3 If you are a consumer, you will benefit from any mandatory provisions of the law of the country in which you are resident. Nothing in these Terms, including this governing law clause, affects your rights as a consumer to rely on such mandatory provisions of local law.`,
  },
  {
    title: '15. Privacy Analysis and Reporting',
    content: `15.1 The Service analyses uploaded Content to generate privacy reports, risk assessments, and related analytical outputs ("Reports").

15.2 Reports are generated using algorithmic analysis and pattern recognition technologies. The accuracy and completeness of Reports depend on various factors including:

(a) the quality and format of uploaded Content;

(b) the comprehensiveness of the analytical algorithms;

(c) the inherent limitations of automated text analysis;

(d) the nature and variety of personal information contained within the Content.

15.3 You acknowledge that Reports:

(a) may not identify all instances of personal information within your Content;

(b) may incorrectly identify certain text as personal information (false positives);

(c) may fail to identify certain personal information (false negatives);

(d) are provided for informational purposes only and should not be relied upon as comprehensive privacy audits.

15.4 Privacy risk scores are calculated based on proprietary algorithms that consider factors including data sensitivity categories, volume of personal information, and potential identifiability. These scores represent estimates and should not be interpreted as definitive privacy risk assessments.

15.5 The Provider makes no representations regarding the suitability of Reports for any particular purpose, including but not limited to regulatory compliance, legal proceedings, or professional advice.`,
  },
  {
    title: '16. Cookies and Tracking Technologies',
    content: `16.1 The Platform uses cookies and similar tracking technologies to enhance your experience and collect certain information about your use of the Service.

16.2 Types of cookies used:

(a) Strictly Necessary Cookies: Essential for the operation of the Platform and cannot be disabled without affecting functionality;

(b) Performance Cookies: Collect information about how visitors use the Platform, enabling us to improve functionality;

(c) Functional Cookies: Remember choices you make to provide enhanced features and personalisation.

16.3 You may control cookie settings through your browser preferences. However, disabling certain cookies may affect the functionality of the Service.

16.4 By continuing to use the Platform, you consent to the use of cookies as described in this policy.

16.5 Third-party services integrated into the Platform may set their own cookies. The Provider has no control over these third-party cookies, and their use is governed by the respective third parties' privacy policies.`,
  },
  {
    title: '17. Children\u2019s Privacy',
    content: `17.1 The Service is not intended for children under the age of thirteen (13) or the applicable age of digital consent in your jurisdiction.

17.2 The Provider does not knowingly collect personal information from children. If you are a parent or guardian and believe that your child has provided personal information to the Service, please contact us immediately.

17.3 If the Provider becomes aware that it has collected personal information from a child without parental consent, it will take steps to delete such information promptly.

17.4 Users who upload Content containing conversations with or about children should exercise particular caution and ensure that such uploads comply with applicable child protection laws.`,
  },
  {
    title: '18. International Use',
    content: `18.1 The Service is operated from the United Kingdom. If you access the Service from outside the United Kingdom, you do so at your own risk and are responsible for compliance with local laws.

18.2 The Provider makes no representation that the Service is appropriate or available for use in locations outside the United Kingdom. Those who choose to access the Service from other locations do so on their own initiative and are responsible for compliance with applicable local laws.

18.3 You may not use the Service or export Content in violation of United Kingdom export laws and regulations.

18.4 If you are located in the European Economic Area, your use of the Service is also governed by the EU General Data Protection Regulation (GDPR) to the extent applicable.`,
  },
  {
    title: '19. Public Exhibition and Display Rights',
    content: `19.1 As part of its educational and artistic mission, the Service incorporates a public exhibition component designed to raise awareness about data privacy and the nature of information shared with AI systems.

19.2 By uploading Content and agreeing to these Terms, you grant the Provider a worldwide, non-exclusive, royalty-free, perpetual, irrevocable licence to:

(a) create anonymised, aggregated, or derivative works from your Content for public display and exhibition purposes;

(b) display excerpts, patterns, statistics, or visualisations derived from your Content in physical gallery spaces, digital exhibitions, educational presentations, and online platforms;

(c) use anonymised representations of your conversation data in promotional materials, academic publications, and public awareness campaigns;

(d) incorporate themes, topics, emotional patterns, and behavioural insights derived from your Content into artistic installations and interactive displays.

19.3 The Provider will employ reasonable technical measures to anonymise Content before public exhibition, including but not limited to:

(a) removal of names and specific identifying information;

(b) generalisation of location data;

(c) aggregation of individual data points with those of other users.

19.4 You acknowledge that despite anonymisation efforts:

(a) certain unique conversation patterns or unusual topics may be potentially re-identifiable;

(b) individuals with knowledge of your AI usage patterns might recognise derived content;

(c) complete anonymisation cannot be guaranteed for all types of content.

19.5 The licence granted under this clause survives termination of these Terms and cannot be revoked once Content has been incorporated into exhibition materials.

19.6 If you do not wish to participate in the public exhibition component, you should not upload Content to the Service. Use of the Service constitutes acceptance of these exhibition and display terms.

19.7 The Provider reserves the right to select, curate, and edit Content for exhibition purposes at its sole discretion.`,
  },
  {
    title: '20. Entire Agreement and Severability',
    content: `20.1 These Terms, together with the Privacy Policy and any other documents incorporated by reference, constitute the entire agreement between you and the Provider regarding your use of the Service.

20.2 These Terms supersede all prior and contemporaneous understandings, agreements, representations, and warranties, both written and oral, regarding the Service.

20.3 If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect.

20.4 No waiver of any term of these Terms shall be deemed a further or continuing waiver of such term or any other term.

20.5 The Provider may assign its rights and obligations under these Terms without restriction. You may not assign or transfer these Terms, by operation of law or otherwise, without the Provider\u2019s prior written consent.`,
  },
  {
    title: '21. Contact',
    content: `21.1 If you have any questions about these Terms, please contact us via the Platform.

21.2 For data protection enquiries or to exercise your rights under applicable data protection law, please contact our Data Protection Contact via the Platform.

21.3 We will endeavour to respond to all enquiries within a reasonable timeframe, typically within thirty (30) days of receipt.

Last Updated: 1 January 2026
Version: 1.0`,
  },
];

export default function TermsPage() {
  const [agreed, setAgreed] = useState(false);
  const [readProgress, setReadProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      setReadProgress(Math.min(100, Math.round((scrolled / total) * 100)));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;1,400&family=Courier+Prime:wght@400;700&display=swap');
        html, body {
          background: #eeece5;
          margin: 0;
          padding: 0;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        ::selection { background: rgba(190,40,30,0.20); }
        ::-webkit-scrollbar { width: 3px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(26,24,20,0.18); }
      `}</style>

      <div
        ref={contentRef}
        style={{
          minHeight: '100vh',
          background: '#eeece5',
          color: '#1a1816',
          fontFamily: "'EB Garamond', Georgia, serif",
          fontSize: '16px',
          lineHeight: 1.7,
        }}
      >
        {/* Header — unified site header */}
        <header
          style={{
            borderBottom: '1px solid rgba(26,24,20,0.10)',
            background: 'rgba(238,236,229,0.97)',
            position: 'sticky', top: 0, zIndex: 10,
            backdropFilter: 'blur(12px)',
            height: '52px',
            padding: '0 clamp(1.5rem, 4vw, 3rem)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: "'EB Garamond', Georgia, serif", fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#1a1816' }}>
              trace<span style={{ color: 'rgba(190,40,30,0.90)' }}>.ai</span>
            </span>
          </Link>
            <span style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: '10px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(26,24,20,0.22)',
            }}>
              Terms of Service
            </span>
          </div>
          {/* Reading progress bar */}
          <div style={{ height: '1px', background: 'rgba(26,24,20,0.12)', position: 'relative' }}>
            <div style={{
              position: 'absolute', left: 0, top: 0, height: '100%',
              width: `${readProgress}%`,
              background: readProgress === 100 ? 'rgba(190,40,30,0.7)' : 'rgba(26,24,20,0.25)',
              transition: 'width 0.1s linear, background 0.3s',
            }} />
          </div>
        </header>

        {/* Title block */}
        <div
          style={{
            maxWidth: '760px',
            margin: '0 auto',
            padding: '56px 32px 40px',
            borderBottom: '1px solid rgba(26,24,20,0.10)',
            position: 'relative',
          }}
        >
          {/* Document stamp — top right */}
          <div style={{
            position: 'absolute', top: '40px', right: '32px',
            fontFamily: "'Courier Prime', monospace",
            fontSize: '9px', letterSpacing: '0.2em',
            color: 'rgba(26,24,20,0.22)', textTransform: 'uppercase',
            textAlign: 'right', lineHeight: 1.6,
          }}>
            <div>REF: TOS-2026-01</div>
            <div>TRACE.AI PLATFORM</div>
            <div>BINDING AGREEMENT</div>
          </div>
          {/* Vertical rule — left margin, document feel */}
          <div style={{
            position: 'absolute', left: '16px', top: '56px', bottom: '40px',
            width: '1px', background: 'rgba(26,24,20,0.12)',
          }} />
          <p style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: '12px',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: 'rgba(26,24,20,0.22)',
            marginBottom: '0.8rem',
          }}>
            trace.ai / Legal
          </p>
          <h1
            style={{
              fontFamily: "'EB Garamond', Georgia, serif",
              fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              margin: '0 0 1rem 0',
              color: 'rgba(26,24,20,0.92)',
              lineHeight: 1.15,
            }}
          >
            Terms of Service
          </h1>
          <p style={{
            fontFamily: "'Courier Prime', monospace",
            fontSize: '10px',
            letterSpacing: '0.12em',
            color: 'rgba(26,24,20,0.28)',
            margin: '0 0 4px 0',
          }}>
            Effective: 1 January 2026
          </p>
          <p style={{
            fontFamily: "'EB Garamond', Georgia, serif",
            fontSize: '16px',
            fontStyle: 'italic',
            color: 'rgba(26,24,20,0.40)',
            margin: 0,
          }}>
            Please read these terms carefully before using the Service.
          </p>
        </div>

        {/* Content */}
        <main
          style={{
            maxWidth: '760px',
            margin: '0 auto',
            padding: '0 32px 64px',
          }}
        >
          {termsContent.map((section, index) => (
            <section
              key={index}
              style={{
                marginBottom: '0',
                borderBottom: '1px solid rgba(26,24,20,0.10)',
                padding: '2rem 0',
              }}
            >
              <h2
                style={{
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: '10px',
                  fontWeight: 400,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: 'rgba(26,24,20,0.30)',
                  margin: '0 0 1rem 0',
                }}
              >
                {section.title}
              </h2>
              <div
                style={{
                  fontFamily: "'EB Garamond', Georgia, serif",
                  color: 'rgba(26,24,20,0.65)',
                  fontSize: '16px',
                  lineHeight: 1.75,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {section.content}
              </div>
            </section>
          ))}

          {/* Consent block */}
          <div
            style={{
              paddingTop: '3rem',
              marginTop: '1rem',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                fontFamily: "'EB Garamond', Georgia, serif",
                fontSize: '16px',
                color: 'rgba(26,24,20,0.65)',
                cursor: 'pointer',
                lineHeight: 1.6,
              }}
            >
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                style={{
                  marginTop: '4px',
                  cursor: 'pointer',
                  accentColor: 'rgba(190,40,30,0.85)',
                  flexShrink: 0,
                }}
              />
              <span>
                I have read and agree to the Terms of Service and Privacy Policy.
              </span>
            </label>

            <div
              style={{
                marginTop: '2rem',
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
              }}
            >
              <Link
                href="/"
                style={{
                  padding: '0.6rem 1.4rem',
                  fontFamily: "'Courier Prime', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'rgba(26,24,20,0.40)',
                  background: 'none',
                  border: '1px solid rgba(26,24,20,0.10)',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(26,24,20,0.25)';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(26,24,20,0.70)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(26,24,20,0.10)';
                  (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(26,24,20,0.40)';
                }}
              >
                Decline
              </Link>

              {agreed ? (
                <Link
                  href="/upload"
                  style={{
                    padding: '0.6rem 1.4rem',
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'rgba(26,24,20,0.92)',
                    background: 'none',
                    border: '1px solid rgba(26,24,20,0.30)',
                    cursor: 'pointer',
                    textDecoration: 'none',
                    display: 'inline-block',
                    transition: 'border-color 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(26,24,20,0.60)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(26,24,20,0.30)'; }}
                >
                  I Agree
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  style={{
                    padding: '0.6rem 1.4rem',
                    fontFamily: "'Courier Prime', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: 'rgba(26,24,20,0.18)',
                    background: 'none',
                    border: '1px solid rgba(26,24,20,0.06)',
                    cursor: 'not-allowed',
                  }}
                >
                  I Agree
                </button>
              )}
            </div>

            <p
              style={{
                marginTop: '1.2rem',
                fontFamily: "'Courier Prime', monospace",
                fontSize: '12px',
                letterSpacing: '0.12em',
                color: 'rgba(26,24,20,0.20)',
              }}
            >
              By clicking "I Agree", you acknowledge that you have read and understood the terms above.
            </p>
          </div>
        </main>

        {/* Footer */}
        <footer
          style={{
            borderTop: '1px solid rgba(26,24,20,0.06)',
            padding: '24px 32px',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '760px', margin: '0 auto' }}>
            <span style={{
              fontFamily: "'Courier Prime', monospace",
              fontSize: '10px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: 'rgba(26,24,20,0.18)',
            }}>
              trace.ai / 2026
            </span>
          </div>
        </footer>
      </div>
    </>
  );
}
