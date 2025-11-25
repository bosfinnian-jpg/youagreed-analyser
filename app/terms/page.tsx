'use client';
import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

/**
 * You Agreed — Terms of Service
 * 
 * Design Philosophy:
 * Dense, authoritative, yet maintaining the premium aesthetic.
 * The goal: create a document so familiar and tedious that
 * users scroll past Section 19 without reading.
 */

// ═══════════════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════════════

const COLORS = {
  blue: '#2479df',
  skyBlue: '#3b9bff',
  softPink: '#ffccee',
  purple: '#b0c3fd',
  white: '#ffffff',
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

const GradientOrb = ({ 
  className, 
  colors, 
  delay = 0 
}: { 
  className: string; 
  colors: string[]; 
  delay?: number;
}) => (
  <motion.div
    className={`absolute rounded-full pointer-events-none ${className}`}
    animate={{
      scale: [1, 1.1, 1],
      opacity: [0.2, 0.3, 0.2],
    }}
    transition={{
      duration: 15,
      repeat: Infinity,
      ease: "easeInOut",
      delay,
    }}
    style={{
      background: `radial-gradient(circle at 30% 30%, ${colors[0]}, ${colors[1]}, transparent 70%)`,
      filter: 'blur(100px)',
    }}
  />
);

// ═══════════════════════════════════════════════════════════════════════════
// TERMS CONTENT
// ═══════════════════════════════════════════════════════════════════════════

const termsContent = [
  {
    title: "1. Definitions and Interpretation",
    content: `1.1 In these Terms of Service ("Terms"), the following definitions shall apply unless the context otherwise requires:

"Agreement" means these Terms of Service together with any schedules, annexes, or documents incorporated by reference herein.

"Authorised User" means any individual who accesses or uses the Service with the express or implied permission of the Account Holder.

"Content" means any text, images, audio, video, data files, conversation logs, metadata, timestamps, behavioural patterns, interaction sequences, or other material uploaded to, transmitted through, processed by, or generated within the Service.

"Data Controller" has the meaning given to it under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.

"Data Processor" has the meaning given to it under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.

"Intellectual Property Rights" means all patents, rights to inventions, utility models, copyright and related rights, trade marks, service marks, trade, business and domain names, rights in trade dress or get-up, rights in goodwill or to sue for passing off, unfair competition rights, rights in designs, rights in computer software, database rights, topography rights, moral rights, rights in confidential information (including know-how and trade secrets) and any other intellectual property rights, in each case whether registered or unregistered and including all applications for and renewals or extensions of such rights, and all similar or equivalent rights or forms of protection in any part of the world.

"Personal Data" has the meaning given to it under the UK General Data Protection Regulation (UK GDPR) and the Data Protection Act 2018.

"Platform" means the You Agreed web application, including all associated interfaces, APIs, databases, algorithms, and supporting infrastructure.

"Processing" has the meaning given to it under the UK General Data Protection Regulation (UK GDPR) and includes any operation or set of operations performed on Personal Data or sets of Personal Data, whether or not by automated means.

"Service" means the privacy analysis, data visualisation, pattern recognition, and related functionality provided through the Platform.

"Special Category Data" has the meaning given to it under Article 9 of the UK GDPR and includes Personal Data revealing racial or ethnic origin, political opinions, religious or philosophical beliefs, trade union membership, genetic data, biometric data, data concerning health, or data concerning a natural person's sex life or sexual orientation.

"User", "you", or "your" refers to any individual or entity accessing or using the Service.

"We", "us", "our", or "Provider" refers to the operators of the You Agreed Platform.

1.2 In these Terms, unless the context otherwise requires:

(a) words in the singular include the plural and vice versa;

(b) a reference to a statute or statutory provision is a reference to it as amended, extended, or re-enacted from time to time;

(c) a reference to writing or written includes email but not fax;

(d) any obligation on a party not to do something includes an obligation not to allow that thing to be done;

(e) a reference to these Terms or any other agreement or document referred to in these Terms is a reference to these Terms or such other agreement or document as varied or novated from time to time;

(f) references to clauses and schedules are to the clauses and schedules of these Terms;

(g) any words following the terms "including", "include", "in particular", "for example", or any similar expression shall be construed as illustrative and shall not limit the sense of the words, description, definition, phrase, or term preceding those terms;

(h) a reference to "party" means a party to these Terms.`
  },
  {
    title: "2. Acceptance of Terms",
    content: `2.1 By accessing, browsing, or using the Service in any manner, including but not limited to visiting or browsing the Platform, uploading Content, or utilising any of the features, functionalities, or resources available through the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and all applicable laws and regulations.

2.2 If you do not agree with any of these Terms, you are prohibited from using or accessing the Service. Your continued use of the Service following the posting of any changes to these Terms shall constitute your acceptance of such changes.

2.3 These Terms constitute a legally binding agreement between you and the Provider. You represent and warrant that you have the legal capacity to enter into this Agreement in accordance with the laws of England and Wales. If you are entering into this Agreement on behalf of a company, organisation, or other legal entity, you represent and warrant that you have the authority to bind such entity to these Terms.

2.4 The Provider reserves the right to modify, amend, or update these Terms at any time without prior notice. Such modifications shall be effective immediately upon posting to the Platform. It is your responsibility to review these Terms periodically for changes. Your continued use of the Service following the posting of revised Terms means that you accept and agree to the changes.

2.5 Certain features of the Service may be subject to additional terms and conditions, which shall be presented to you at the relevant time. By using such features, you agree to be bound by those additional terms and conditions.

2.6 Nothing in these Terms shall be construed to create any agency, partnership, joint venture, employee-employer, or franchisor-franchisee relationship between you and the Provider.`
  },
  {
    title: "3. Eligibility and Registration",
    content: `3.1 The Service is intended for users who are at least eighteen (18) years of age or the age of majority in their jurisdiction, whichever is greater. By using the Service, you represent and warrant that you meet this eligibility requirement.

3.2 If you are accessing the Service on behalf of a minor (with appropriate parental or guardian consent where legally permitted), you accept full responsibility for ensuring that the minor understands and complies with these Terms.

3.3 The Service is not available to users who have been previously suspended or removed from the Platform, or whose access has been terminated for any reason.

3.4 You agree to provide accurate, current, and complete information during any registration or upload process and to update such information to keep it accurate, current, and complete.

3.5 You are responsible for safeguarding any credentials, access tokens, or identification mechanisms associated with your use of the Service and for any activities or actions conducted using such credentials.

3.6 You agree to immediately notify the Provider of any unauthorised use of your access credentials or any other breach of security. The Provider will not be liable for any loss or damage arising from your failure to comply with this security obligation.

3.7 The Provider reserves the right to refuse service, terminate accounts, remove or edit content, or cancel access at its sole discretion, without notice, for any reason, including but not limited to violation of these Terms.`
  },
  {
    title: "4. Description of Service",
    content: `4.1 The Service provides users with tools and functionality to analyse conversation data exported from third-party artificial intelligence platforms, including but not limited to ChatGPT, Claude, Gemini, and similar conversational AI services.

4.2 The Service performs the following analytical functions:

(a) Privacy Exposure Analysis: Identification and categorisation of personal information, including but not limited to names, locations, addresses, telephone numbers, email addresses, financial information, health-related data, employment details, relationship information, and other personally identifiable information;

(b) Behavioural Pattern Analysis: Examination of conversation topics, interaction frequencies, temporal patterns, emotional indicators, communication styles, and usage behaviours;

(c) Environmental Impact Assessment: Calculation of estimated carbon footprint and environmental costs associated with AI interactions based on published research and industry-standard estimation methodologies;

(d) Risk Scoring: Generation of privacy risk assessments based on the sensitivity, volume, and nature of information detected within uploaded Content;

(e) Data Visualisation: Graphical representation of analytical findings in various formats including charts, graphs, timelines, and interactive displays.

4.3 All analysis is performed locally within your web browser using client-side processing technologies. No Content is transmitted to external servers during the analysis phase unless explicitly stated otherwise in these Terms.

4.4 The Provider makes no representations or warranties regarding the accuracy, completeness, reliability, or suitability of the analytical results. The Service is provided for informational and educational purposes only and should not be relied upon as legal, financial, medical, or professional advice.

4.5 The Provider reserves the right to modify, suspend, or discontinue any aspect of the Service at any time without prior notice or liability.`
  },
  {
    title: "5. User Content and Uploads",
    content: `5.1 You retain ownership of any Content you upload to the Service. However, by uploading Content, you grant the Provider certain rights as specified in these Terms.

5.2 You represent and warrant that:

(a) you own or have the necessary rights, licences, consents, and permissions to upload and submit the Content;

(b) the Content does not violate any applicable laws, regulations, or third-party rights, including intellectual property rights, privacy rights, or contractual obligations;

(c) the Content does not contain any viruses, malware, or other harmful code;

(d) the Content has been lawfully obtained and does not include data obtained through unauthorised access, hacking, or other illegal means;

(e) you have obtained all necessary consents from any third parties whose personal data may be contained within the Content.

5.3 You acknowledge that conversation data exported from third-party AI services may contain personal information belonging to you and potentially to third parties referenced in your conversations. You accept sole responsibility for ensuring that your upload and processing of such data complies with all applicable data protection laws.

5.4 The Provider reserves the right, but has no obligation, to review, screen, or monitor any Content uploaded to the Service and to remove or refuse any Content that violates these Terms or is otherwise objectionable.

5.5 You acknowledge that the Provider has no control over and assumes no responsibility for Content uploaded by users. Under no circumstances will the Provider be liable in any way for any Content, including but not limited to any errors or omissions in any Content, or any loss or damage of any kind incurred as a result of the use of any Content.`
  },
  {
    title: "6. Local Processing and Browser-Based Analysis",
    content: `6.1 The Service utilises client-side processing technologies to analyse Content locally within your web browser environment. This means that the computational analysis of your uploaded data occurs on your device rather than on external servers.

6.2 Local processing is implemented using industry-standard web technologies including but not limited to JavaScript, WebAssembly, and browser-native APIs. The specific technologies employed may change over time as the Service is updated.

6.3 While local processing minimises the transmission of Content to external systems, you acknowledge that:

(a) certain metadata, analytics data, or aggregated non-personal information may be collected and transmitted for service improvement purposes;

(b) error logs, performance metrics, and diagnostic information may be transmitted to help maintain and improve the Service;

(c) third-party services integrated into the Platform may have their own data collection practices governed by their respective privacy policies;

(d) browser extensions, plugins, or other software on your device may have access to data processed within your browser environment.

6.4 The effectiveness of local processing depends on the capabilities of your device and browser. The Provider makes no guarantees regarding performance, processing speed, or compatibility with all devices or browsers.

6.5 You are responsible for ensuring the security of your own device and browser environment. The Provider is not responsible for any unauthorised access to or interception of data that occurs due to vulnerabilities in your local computing environment.`
  },
  {
    title: "7. Data Protection and Privacy",
    content: `7.1 The Provider is committed to protecting your privacy and handling your Personal Data in accordance with the UK General Data Protection Regulation (UK GDPR), the Data Protection Act 2018, and other applicable data protection legislation.

7.2 For the purposes of applicable data protection law:

(a) You are the Data Controller in respect of any Personal Data contained within Content you upload to the Service;

(b) The Provider acts as a Data Processor in respect of any processing of Personal Data that occurs through the Service.

7.3 The Provider shall:

(a) process Personal Data only in accordance with your instructions as documented in these Terms;

(b) ensure that persons authorised to process Personal Data have committed themselves to confidentiality;

(c) implement appropriate technical and organisational measures to ensure a level of security appropriate to the risk;

(d) assist you in responding to requests from data subjects exercising their rights under data protection law;

(e) delete or return all Personal Data at the end of the provision of services, unless required by law to retain it.

7.4 You acknowledge that by uploading Content containing Personal Data relating to third parties, you assume responsibility as Data Controller for ensuring that such processing is lawful and that appropriate notices have been provided to and consents obtained from those third parties where required.

7.5 The Provider's full Privacy Policy, which forms part of these Terms, is available at [Privacy Policy Link] and provides additional detail regarding data collection, use, storage, and disclosure practices.

7.6 In the event of a Personal Data breach, the Provider shall notify you without undue delay after becoming aware of such breach, providing sufficient information to allow you to meet any obligations to report or inform data subjects of the breach.`
  },
  {
    title: "8. Intellectual Property Rights",
    content: `8.1 The Service and its entire contents, features, and functionality (including but not limited to all information, software, code, text, displays, images, video, audio, design, selection, and arrangement thereof) are owned by the Provider, its licensors, or other providers of such material and are protected by United Kingdom and international copyright, trademark, patent, trade secret, and other intellectual property or proprietary rights laws.

8.2 Subject to your compliance with these Terms, the Provider grants you a limited, non-exclusive, non-transferable, non-sublicensable, revocable licence to access and use the Service for your personal, non-commercial purposes.

8.3 You must not:

(a) reproduce, distribute, modify, create derivative works of, publicly display, publicly perform, republish, download, store, or transmit any of the material on the Platform, except as incidental to normal web browsing;

(b) modify copies of any materials from the Platform or delete or alter any copyright, trademark, or other proprietary rights notices;

(c) access or use the Service for any commercial purposes without the prior written consent of the Provider;

(d) attempt to reverse engineer, decompile, disassemble, or otherwise attempt to derive the source code of any software used in the Service;

(e) use any robot, spider, scraper, or other automated means to access the Service for any purpose;

(f) interfere with or circumvent any security features of the Service.

8.4 Any feedback, comments, or suggestions you provide regarding the Service shall be deemed non-confidential, and the Provider shall be free to use such information on an unrestricted basis without any obligation to you.

8.5 All trademarks, service marks, logos, trade names, and any other proprietary designations of the Provider used herein are trademarks or registered trademarks of the Provider. Any other trademarks are the property of their respective owners.`
  },
  {
    title: "9. Prohibited Uses",
    content: `9.1 You agree not to use the Service:

(a) in any way that violates any applicable federal, state, local, or international law or regulation;

(b) to exploit, harm, or attempt to exploit or harm minors in any way by exposing them to inappropriate content, asking for personally identifiable information, or otherwise;

(c) to transmit or procure the sending of any advertising or promotional material, including any "junk mail", "chain letter", "spam", or any other similar solicitation;

(d) to impersonate or attempt to impersonate the Provider, a Provider employee, another user, or any other person or entity;

(e) to engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which may harm the Provider or users of the Service;

(f) to upload Content obtained through unauthorised access to third-party systems or accounts;

(g) to process data belonging to third parties without their knowledge or consent where such consent is required by law;

(h) to attempt to circumvent, disable, or otherwise interfere with security-related features of the Service;

(i) to use the Service in any manner that could disable, overburden, damage, or impair the Platform;

(j) to introduce any viruses, trojan horses, worms, logic bombs, or other material that is malicious or technologically harmful;

(k) to attempt to gain unauthorised access to any portions of the Service, other accounts, computer systems, or networks connected to the Service;

(l) to collect or harvest any personally identifiable information from other users of the Service;

(m) to use the Service for any purpose that is unlawful or prohibited by these Terms.

9.2 The Provider reserves the right to investigate and prosecute violations of any of the above and to cooperate with law enforcement authorities in prosecuting users who violate these Terms.`
  },
  {
    title: "10. Third-Party Services and Links",
    content: `10.1 The Service may contain links to third-party websites, services, or resources that are not owned or controlled by the Provider. The Provider has no control over and assumes no responsibility for the content, privacy policies, or practices of any third-party websites or services.

10.2 You acknowledge and agree that the Provider shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, goods, or services available on or through any such websites or services.

10.3 The Service relies on conversation data exported from third-party AI platforms. You acknowledge that:

(a) the format, structure, and content of such exports are determined by those third parties;

(b) the Provider makes no representations regarding the completeness or accuracy of third-party exports;

(c) changes to third-party export formats may affect the functionality of the Service;

(d) your use of third-party AI platforms is governed by their respective terms of service and privacy policies.

10.4 The inclusion of any link to a third-party website or service does not imply endorsement by the Provider of the linked website or service, its content, or its operator.

10.5 You are encouraged to review the terms and conditions and privacy policies of any third-party websites or services that you visit or use.`
  },
  {
    title: "11. Disclaimers and Limitation of Liability",
    content: `11.1 THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. THE PROVIDER DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.

11.2 The Provider does not warrant that:

(a) the Service will meet your requirements or expectations;

(b) the Service will be uninterrupted, timely, secure, or error-free;

(c) the results obtained from the use of the Service will be accurate, reliable, or complete;

(d) the quality of any products, services, information, or other material obtained through the Service will meet your expectations;

(e) any errors in the Service will be corrected.

11.3 You acknowledge and agree that:

(a) privacy risk scores and assessments are estimates based on algorithmic analysis and should not be relied upon as definitive evaluations;

(b) carbon footprint calculations are approximations based on published research and may not reflect actual environmental impacts;

(c) the detection of personal information may not be exhaustive, and the Service may fail to identify certain types of sensitive data;

(d) the Service is not a substitute for professional legal, privacy, or security advice.

11.4 IN NO EVENT SHALL THE PROVIDER, ITS DIRECTORS, EMPLOYEES, PARTNERS, AGENTS, SUPPLIERS, OR AFFILIATES BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING WITHOUT LIMITATION LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM:

(a) YOUR ACCESS TO OR USE OF OR INABILITY TO ACCESS OR USE THE SERVICE;

(b) ANY CONDUCT OR CONTENT OF ANY THIRD PARTY ON THE SERVICE;

(c) ANY CONTENT OBTAINED FROM THE SERVICE;

(d) UNAUTHORISED ACCESS, USE, OR ALTERATION OF YOUR TRANSMISSIONS OR CONTENT.

11.5 THE TOTAL LIABILITY OF THE PROVIDER FOR ANY CLAIMS ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE AMOUNT YOU HAVE PAID TO THE PROVIDER FOR USE OF THE SERVICE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR ONE HUNDRED POUNDS (£100), WHICHEVER IS GREATER.

11.6 Some jurisdictions do not allow the exclusion of certain warranties or the limitation or exclusion of liability for incidental or consequential damages. Accordingly, some of the above limitations may not apply to you.`
  },
  {
    title: "12. Indemnification",
    content: `12.1 You agree to defend, indemnify, and hold harmless the Provider, its affiliates, licensors, and service providers, and its and their respective officers, directors, employees, contractors, agents, licensors, suppliers, successors, and assigns from and against any claims, liabilities, damages, judgments, awards, losses, costs, expenses, or fees (including reasonable legal fees) arising out of or relating to:

(a) your violation of these Terms;

(b) your violation of any third-party right, including without limitation any intellectual property right, publicity right, confidentiality right, property right, or privacy right;

(c) your violation of any applicable law, rule, or regulation;

(d) any Content you upload, submit, store, or otherwise make available through the Service;

(e) any claim that Content you provided caused damage to a third party;

(f) your use or misuse of the Service;

(g) your negligent or wrongful conduct.

12.2 The Provider reserves the right, at its own expense, to assume the exclusive defence and control of any matter otherwise subject to indemnification by you, in which event you will cooperate fully with the Provider in asserting any available defences.

12.3 This indemnification obligation will survive the termination or expiration of these Terms and your use of the Service.`
  },
  {
    title: "13. Termination",
    content: `13.1 These Terms are effective unless and until terminated by either you or the Provider.

13.2 You may terminate your use of the Service at any time by discontinuing access to the Platform and deleting any locally stored data.

13.3 The Provider may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach any provision of these Terms.

13.4 Upon termination:

(a) your right to use the Service will immediately cease;

(b) you must immediately discontinue all use of the Service;

(c) the Provider shall have no obligation to maintain or provide any Content or data to you;

(d) the Provider may delete any Content associated with your use of the Service.

13.5 All provisions of these Terms which by their nature should survive termination shall survive termination, including without limitation ownership provisions, warranty disclaimers, indemnification, and limitations of liability.

13.6 Termination of these Terms shall not affect any rights, remedies, obligations, or liabilities of the parties that have accrued up to the date of termination.`
  },
  {
    title: "14. Modifications to Service",
    content: `14.1 The Provider reserves the right to modify or discontinue, temporarily or permanently, the Service (or any part thereof) with or without notice at any time.

14.2 The Provider shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.

14.3 It is your responsibility to review these Terms periodically for changes. Your continued use of the Service following the posting of any changes to these Terms constitutes acceptance of those changes.

14.4 The Provider may from time to time develop and provide updates to the Service, which may include upgrades, bug fixes, patches, other error corrections, and new features. Updates may also modify or delete features and functionality. You agree that the Provider has no obligation to provide any updates or to continue to provide any particular features or functionality.

14.5 Depending on the update, you may not be able to use the Service until you have installed or accepted the latest version of the Service.`
  },
  {
    title: "15. Force Majeure",
    content: `15.1 The Provider shall not be liable for any failure or delay in performing any obligation under these Terms where such failure or delay results from any cause beyond the Provider's reasonable control, including but not limited to:

(a) acts of God, earthquake, flood, fire, storm, or other natural disaster;

(b) epidemic or pandemic;

(c) terrorist attack, civil war, civil commotion, riot, war, threat of or preparation for war, armed conflict, imposition of sanctions, embargo, or breaking off of diplomatic relations;

(d) nuclear, chemical, or biological contamination;

(e) any law or any action taken by a government or public authority;

(f) collapse of buildings, fire, explosion, or accident;

(g) any labour or trade dispute, strikes, industrial action, or lockouts;

(h) interruption or failure of utility service, including but not limited to electric power, gas, or water;

(i) failure of telecommunications networks or internet infrastructure.

15.2 The Provider's performance of its obligations under these Terms shall be deemed suspended for the period that the Force Majeure Event continues, and the Provider shall have an extension of time for performance for the duration of that period.

15.3 The Provider shall use reasonable endeavours to bring the Force Majeure Event to a close or to find a solution by which its obligations under these Terms may be performed despite the Force Majeure Event.`
  },
  {
    title: "16. Governing Law and Jurisdiction",
    content: `16.1 These Terms and any dispute or claim arising out of or in connection with them or their subject matter or formation (including non-contractual disputes or claims) shall be governed by and construed in accordance with the laws of England and Wales.

16.2 Each party irrevocably agrees that the courts of England and Wales shall have exclusive jurisdiction to settle any dispute or claim arising out of or in connection with these Terms or their subject matter or formation (including non-contractual disputes or claims).

16.3 Nothing in this clause shall limit the Provider's right to take proceedings against you in any other court of competent jurisdiction, nor shall the taking of proceedings in any one or more jurisdictions preclude the taking of proceedings in any other jurisdictions, whether concurrently or not, to the extent permitted by the law of such other jurisdiction.

16.4 If you are a consumer, you will benefit from any mandatory provisions of the law of the country in which you are resident. Nothing in these Terms, including this governing law clause, affects your rights as a consumer to rely on such mandatory provisions of local law.`
  },
  {
    title: "17. Dispute Resolution",
    content: `17.1 In the event of any dispute, claim, question, or disagreement arising from or relating to these Terms or the breach thereof, the parties shall use their best efforts to settle the dispute, claim, question, or disagreement.

17.2 To this effect, the parties shall consult and negotiate with each other in good faith and, recognising their mutual interests, attempt to reach a just and equitable solution satisfactory to both parties.

17.3 If the parties do not reach such solution within a period of thirty (30) days, then, upon notice by either party to the other, all disputes, claims, questions, or differences shall be finally settled by the courts of England and Wales in accordance with Clause 16.

17.4 Notwithstanding the foregoing, either party may seek injunctive or other equitable relief from any court of competent jurisdiction to prevent the actual or threatened infringement, misappropriation, or violation of a party's intellectual property rights or other proprietary rights.

17.5 You agree that any dispute resolution proceedings will be conducted only on an individual basis and not in a class, consolidated, or representative action.`
  },
  {
    title: "18. Privacy Analysis and Reporting",
    content: `18.1 The Service analyses uploaded Content to generate privacy reports, risk assessments, and related analytical outputs ("Reports").

18.2 Reports are generated using algorithmic analysis and pattern recognition technologies. The accuracy and completeness of Reports depend on various factors including:

(a) the quality and format of uploaded Content;

(b) the comprehensiveness of the analytical algorithms;

(c) the inherent limitations of automated text analysis;

(d) the nature and variety of personal information contained within the Content.

18.3 You acknowledge that Reports:

(a) may not identify all instances of personal information within your Content;

(b) may incorrectly identify certain text as personal information (false positives);

(c) may fail to identify certain personal information (false negatives);

(d) are provided for informational purposes only and should not be relied upon as comprehensive privacy audits.

18.4 Privacy risk scores are calculated based on proprietary algorithms that consider factors including data sensitivity categories, volume of personal information, and potential identifiability. These scores represent estimates and should not be interpreted as definitive privacy risk assessments.

18.5 Carbon footprint calculations are based on published research regarding the energy consumption and environmental impact of AI systems. These calculations are approximations and may not reflect actual environmental impacts associated with your specific AI usage.

18.6 The Provider makes no representations regarding the suitability of Reports for any particular purpose, including but not limited to regulatory compliance, legal proceedings, or professional advice.`
  },
  {
    title: "19. Public Exhibition and Display Rights",
    content: `19.1 As part of its educational and artistic mission, the Service incorporates a public exhibition component designed to raise awareness about data privacy and the nature of information shared with AI systems.

19.2 By uploading Content and agreeing to these Terms, you grant the Provider a worldwide, non-exclusive, royalty-free, perpetual, irrevocable licence to:

(a) create anonymised, aggregated, or derivative works from your Content for public display and exhibition purposes;

(b) display excerpts, patterns, statistics, or visualisations derived from your Content in physical gallery spaces, digital exhibitions, educational presentations, and online platforms;

(c) use anonymised representations of your conversation data in promotional materials, academic publications, and public awareness campaigns;

(d) incorporate themes, topics, emotional patterns, and behavioural insights derived from your Content into artistic installations and interactive displays.

19.3 The Provider will employ reasonable technical measures to anonymise Content before public exhibition, including but not limited to:

(a) removal of names and specific identifying information;

(b) generalisation of location data;

(c) aggregation of individual data points with those of other users;

(d) application of differential privacy techniques where appropriate.

19.4 You acknowledge that despite anonymisation efforts:

(a) certain unique conversation patterns or unusual topics may be potentially re-identifiable;

(b) individuals with knowledge of your AI usage patterns might recognise derived content;

(c) complete anonymisation cannot be guaranteed for all types of content.

19.5 The licence granted under this clause survives termination of these Terms and cannot be revoked once Content has been incorporated into exhibition materials.

19.6 If you do not wish to participate in the public exhibition component, you should not upload Content to the Service. Use of the Service constitutes acceptance of these exhibition and display terms.

19.7 The Provider reserves the right to select, curate, and edit Content for exhibition purposes at its sole discretion.`
  },
  {
    title: "20. Educational and Research Purposes",
    content: `20.1 The Service is developed and operated in part for educational and research purposes, including raising public awareness about data privacy, AI systems, and surveillance capitalism.

20.2 Anonymised and aggregated data derived from user Content may be used for:

(a) academic research and publication;

(b) development of educational materials and curricula;

(c) public policy advocacy and awareness campaigns;

(d) improvement of privacy-enhancing technologies;

(e) statistical analysis of AI usage patterns and privacy behaviours.

20.3 The Provider may collaborate with academic institutions, research organisations, and civil society groups to further the educational objectives of the Service.

20.4 You acknowledge that your use of the Service contributes to a broader public interest mission focused on privacy awareness and education.

20.5 Research outputs and educational materials may be published, presented, or distributed through various channels including academic journals, conferences, public exhibitions, media outlets, and online platforms.

20.6 Individual user data will not be identified in research outputs without explicit additional consent.`
  },
  {
    title: "21. Cookie Policy and Tracking Technologies",
    content: `21.1 The Platform uses cookies and similar tracking technologies to enhance your experience and collect certain information about your use of the Service.

21.2 Types of cookies used:

(a) Strictly Necessary Cookies: Essential for the operation of the Platform and cannot be disabled without affecting functionality;

(b) Performance Cookies: Collect information about how visitors use the Platform, enabling us to improve functionality;

(c) Functional Cookies: Remember choices you make to provide enhanced features and personalisation;

(d) Analytics Cookies: Help us understand how users interact with the Platform through anonymous data collection.

21.3 You may control cookie settings through your browser preferences. However, disabling certain cookies may affect the functionality of the Service.

21.4 By continuing to use the Platform, you consent to the use of cookies as described in this policy.

21.5 For more detailed information about our use of cookies and tracking technologies, please refer to our Cookie Policy.

21.6 Third-party services integrated into the Platform may set their own cookies. The Provider has no control over these third-party cookies, and their use is governed by the respective third parties' privacy policies.`
  },
  {
    title: "22. Accessibility",
    content: `22.1 The Provider is committed to ensuring the Service is accessible to users with disabilities in accordance with the Web Content Accessibility Guidelines (WCAG) 2.1 and applicable accessibility laws.

22.2 If you experience any difficulty accessing or using any part of the Service, or if you have suggestions for improving accessibility, please contact us using the details provided in Clause 27.

22.3 The Provider will make reasonable efforts to accommodate accessibility requests and to improve the accessibility of the Service over time.

22.4 Certain features of the Service, including data visualisations and interactive elements, may have inherent accessibility limitations. Alternative representations of analytical results may be available upon request.

22.5 Third-party content and services linked from the Platform may not meet the same accessibility standards, and the Provider assumes no responsibility for the accessibility of third-party content.`
  },
  {
    title: "23. Children's Privacy",
    content: `23.1 The Service is not intended for children under the age of thirteen (13) or the applicable age of digital consent in your jurisdiction.

23.2 The Provider does not knowingly collect personal information from children. If you are a parent or guardian and believe that your child has provided personal information to the Service, please contact us immediately.

23.3 If the Provider becomes aware that it has collected personal information from a child without parental consent, it will take steps to delete such information promptly.

23.4 Users who upload Content containing conversations with or about children should exercise particular caution and ensure that such uploads comply with applicable child protection laws.

23.5 The Provider reserves the right to refuse service, terminate access, or remove Content that appears to involve the exploitation or endangerment of minors.`
  },
  {
    title: "24. International Use",
    content: `24.1 The Service is operated from the United Kingdom. If you access the Service from outside the United Kingdom, you do so at your own risk and are responsible for compliance with local laws.

24.2 The Provider makes no representation that the Service is appropriate or available for use in locations outside the United Kingdom. Those who choose to access the Service from other locations do so on their own initiative and are responsible for compliance with applicable local laws.

24.3 You may not use the Service or export Content in violation of United Kingdom export laws and regulations.

24.4 If you are located in the European Economic Area, your use of the Service is also governed by the EU General Data Protection Regulation (GDPR) to the extent applicable.

24.5 Transfer of data to or from jurisdictions outside the United Kingdom may be subject to additional data protection requirements, and you consent to such transfers as necessary for the provision of the Service.`
  },
  {
    title: "25. Entire Agreement",
    content: `25.1 These Terms, together with the Privacy Policy and any other documents incorporated by reference, constitute the entire agreement between you and the Provider regarding your use of the Service.

25.2 These Terms supersede all prior and contemporaneous understandings, agreements, representations, and warranties, both written and oral, regarding the Service.

25.3 No waiver of any term of these Terms shall be deemed a further or continuing waiver of such term or any other term, and the Provider's failure to assert any right or provision under these Terms shall not constitute a waiver of such right or provision.

25.4 If any provision of these Terms is held to be invalid, illegal, or unenforceable by a court of competent jurisdiction, such provision shall be limited or eliminated to the minimum extent necessary so that these Terms shall otherwise remain in full force and effect.

25.5 The Provider may assign its rights and obligations under these Terms without restriction. You may not assign or transfer these Terms, by operation of law or otherwise, without the Provider's prior written consent.

25.6 These Terms do not create any third-party beneficiary rights.`
  },
  {
    title: "26. Severability",
    content: `26.1 If any provision of these Terms is found by any court or administrative body of competent jurisdiction to be invalid or unenforceable, such invalidity or unenforceability shall not affect the other provisions of these Terms, which shall remain in full force and effect.

26.2 If any provision of these Terms is so found to be invalid or unenforceable but would be valid or enforceable if some part of the provision were deleted, the provision in question shall apply with such modification as may be necessary to make it valid and enforceable.

26.3 The parties agree that if any provision is deemed invalid or unenforceable, they will negotiate in good faith to replace such provision with a valid and enforceable provision that achieves, to the greatest extent possible, the economic, legal, and commercial objectives of the original provision.`
  },
  {
    title: "27. Contact Information",
    content: `27.1 If you have any questions about these Terms, please contact us at:

You Agreed Project
School of Media and Communication
University of Leeds
Leeds, LS2 9JT
United Kingdom

Email: contact@youagreed.co.uk

27.2 For data protection enquiries or to exercise your rights under applicable data protection law, please contact our Data Protection Contact at the address above or via email.

27.3 We will endeavour to respond to all enquiries within a reasonable timeframe, typically within thirty (30) days of receipt.

27.4 For urgent matters relating to security vulnerabilities or data breaches, please clearly mark your communication as urgent.`
  },
  {
    title: "28. Acknowledgement",
    content: `28.1 BY USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ THESE TERMS OF SERVICE, UNDERSTAND THEM, AND AGREE TO BE BOUND BY THEIR TERMS AND CONDITIONS.

28.2 YOU FURTHER ACKNOWLEDGE THAT THESE TERMS OF SERVICE, TOGETHER WITH THE PRIVACY POLICY, REPRESENT THE COMPLETE AND EXCLUSIVE STATEMENT OF THE AGREEMENT BETWEEN YOU AND THE PROVIDER AND SUPERSEDE ANY PRIOR OR CONTEMPORANEOUS AGREEMENTS, PROPOSALS, OR REPRESENTATIONS, WRITTEN OR ORAL, CONCERNING THE SUBJECT MATTER OF THESE TERMS.

28.3 You acknowledge that you have had the opportunity to review these Terms, to seek independent legal advice if desired, and that you are entering into this Agreement freely and voluntarily.

28.4 You acknowledge that the Provider has made no representations or warranties other than those expressly set forth in these Terms.

28.5 You acknowledge that your use of the Service indicates your acceptance of all terms and conditions contained herein, including but not limited to the provisions regarding public exhibition and display of anonymised Content as set forth in Clause 19.`
  },
  {
    title: "29. Effective Date",
    content: `29.1 These Terms of Service are effective as of 1 January 2025 and shall remain in effect until terminated in accordance with their provisions.

29.2 Previous versions of these Terms, if any, are superseded by this version.

29.3 The date of last revision is displayed at the bottom of this document.

Last Updated: 1 January 2025
Version: 1.0`
  }
];

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function TermsPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasScrolled, setHasScrolled] = useState(false);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Track scroll for progress indicator
  const progressWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen bg-[#050508] text-white selection:bg-white/20"
      onScroll={() => setHasScrolled(true)}
    >
      {/* ═══════════════════════════════════════════════════════════════════
          ATMOSPHERIC BACKGROUND
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, hsl(240, 30%, 4%) 0%, hsl(250, 40%, 5%) 50%, hsl(260, 35%, 4%) 100%)',
          }}
        />
        
        <GradientOrb 
          className="w-[600px] h-[600px] -top-[200px] -right-[200px]"
          colors={[COLORS.blue, COLORS.skyBlue]}
        />
        <GradientOrb 
          className="w-[500px] h-[500px] bottom-[10%] -left-[150px]"
          colors={[COLORS.purple, COLORS.softPink]}
          delay={7}
        />

        {/* Subtle grid */}
        <div 
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(ellipse at 50% 30%, black 20%, transparent 70%)',
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SCROLL PROGRESS BAR
      ═══════════════════════════════════════════════════════════════════ */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-white/[0.05]">
        <motion.div 
          className="h-full"
          style={{ 
            width: progressWidth,
            background: `linear-gradient(90deg, ${COLORS.blue}, ${COLORS.skyBlue})`,
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          NAVIGATION
      ═══════════════════════════════════════════════════════════════════ */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="sticky top-0 z-40 px-6 py-4 backdrop-blur-2xl bg-[#050508]/80 border-b border-white/[0.04]"
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.skyBlue})`,
                boxShadow: `0 4px 16px ${COLORS.blue}30`,
              }}
            >
              <span className="text-white font-semibold text-sm">Y</span>
            </div>
            <span className="text-white/60 font-medium text-sm">You Agreed</span>
          </Link>
          
          <div className="text-white/30 text-xs tracking-wide uppercase">
            Terms of Service
          </div>
        </div>
      </motion.nav>

      {/* ═══════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════ */}
      <header className="relative z-10 pt-20 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <span 
              className="inline-block px-3 py-1.5 rounded-full text-[10px] font-medium tracking-widest uppercase
                bg-white/[0.04] border border-white/[0.06] text-white/40 mb-6"
            >
              Legal Agreement
            </span>
            
            <h1 className="text-4xl md:text-5xl font-semibold tracking-[-0.02em] leading-[1.1] mb-6">
              <span 
                style={{
                  background: `linear-gradient(135deg, ${COLORS.white} 0%, ${COLORS.purple} 100%)`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Terms of Service
              </span>
            </h1>
            
            <p className="text-white/35 text-sm leading-relaxed max-w-xl">
              Please read these terms carefully before using the You Agreed service. 
              By accessing or using the service, you agree to be bound by these terms.
            </p>

            <div className="mt-8 flex items-center gap-4 text-xs text-white/25">
              <span>Effective: 1 January 2025</span>
              <span className="w-1 h-1 rounded-full bg-current" />
              <span>Version 1.0</span>
              <span className="w-1 h-1 rounded-full bg-current" />
              <span>~15 min read</span>
            </div>
          </motion.div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════
          TERMS CONTENT
      ═══════════════════════════════════════════════════════════════════ */}
      <main className="relative z-10 px-6 pb-24">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="space-y-12"
          >
            {termsContent.map((section, index) => (
              <motion.section
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="scroll-mt-24"
              >
                <h2 className="text-lg font-medium text-white/80 mb-4 tracking-tight">
                  {section.title}
                </h2>
                <div 
                  className="text-white/40 text-[13px] leading-[1.8] whitespace-pre-wrap font-light"
                  style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}
                >
                  {section.content}
                </div>
              </motion.section>
            ))}
          </motion.div>

          {/* ═══════════════════════════════════════════════════════════════════
              ACTION BUTTONS
          ═══════════════════════════════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mt-20 pt-12 border-t border-white/[0.06]"
          >
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link href="/">
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3.5 rounded-full text-sm font-medium
                    bg-white/[0.04] border border-white/[0.08] text-white/60
                    transition-colors duration-300 min-w-[160px]"
                >
                  Decline
                </motion.button>
              </Link>
              
              <Link href="/upload">
                <motion.button
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: `0 16px 40px ${COLORS.blue}30`,
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3.5 rounded-full text-sm font-semibold min-w-[160px]"
                  style={{
                    background: `linear-gradient(135deg, ${COLORS.blue}, ${COLORS.skyBlue})`,
                    boxShadow: `0 8px 24px ${COLORS.blue}20`,
                  }}
                >
                  I Agree
                </motion.button>
              </Link>
            </div>

            <p className="text-center text-white/20 text-xs mt-6 max-w-md mx-auto">
              By clicking "I Agree", you acknowledge that you have read and understood 
              all terms and conditions outlined above.
            </p>
          </motion.div>

          {/* ═══════════════════════════════════════════════════════════════════
              FOOTER
          ═══════════════════════════════════════════════════════════════════ */}
          <footer className="mt-20 pt-8 border-t border-white/[0.04] flex flex-col items-center gap-4">
            <div className="flex items-center gap-3 text-white/15 text-xs tracking-wide">
              <span>University of Leeds</span>
              <span className="w-0.5 h-0.5 rounded-full bg-current" />
              <span>COMM3705</span>
              <span className="w-0.5 h-0.5 rounded-full bg-current" />
              <span>2024–2025</span>
            </div>
            
            <div 
              className="w-6 h-6 rounded-md flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${COLORS.blue}10, ${COLORS.skyBlue}10)`,
                border: `1px solid ${COLORS.blue}15`,
              }}
            >
              <span className="text-white/20 font-semibold text-[10px]">Y</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}