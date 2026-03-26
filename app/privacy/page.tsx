'use client';

import { useState } from 'react';
import LayoutWrapper from '../components/layout/layout-wrapper';

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  const sections = [
    {
      id: 'information-collection',
      title: 'Information We Collect',
      content: `We collect personal information you provide directly to us when you create an account, book services, or communicate with us. This includes your name, email address, phone number, physical address, vehicle details, and payment information. We also automatically collect information about your usage of our services, including service history, preferences, and location data when you use our app.`
    },
    {
      id: 'information-use',
      title: 'How We Use Your Information',
      content: `We use your personal information to provide and improve our car washing and cleaning services. This includes processing your bookings, scheduling appointments, sending service confirmations and reminders, providing customer support, and personalizing your experience. We may also use your information to send you promotional offers and updates about our services, provided you have consented to receive such communications.`
    },
    {
      id: 'information-sharing',
      title: 'Information Sharing and Disclosure',
      content: `We do not sell, trade, or rent your personal information to third parties. We may share your information with trusted service providers who assist us in operating our app, conducting business, or serving our users, provided they agree to maintain the confidentiality of your information. We may also disclose your information when required by law, to protect our rights, or to ensure the safety of our users.`
    },
    {
      id: 'data-security',
      title: 'Data Security',
      content: `We implement robust security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. Our security practices include encryption of sensitive data, secure server infrastructure, regular security audits, and access controls. While we strive to protect your information, please be aware that no method of transmission over the internet or electronic storage is completely secure.`
    },
    {
      id: 'your-rights',
      title: 'Your Rights and Choices',
      content: `You have the right to access, update, or delete your personal information at any time. You may also opt out of receiving promotional communications from us by adjusting your preferences in your account settings or following the unsubscribe instructions in those communications. You can control how your location data is used and manage other privacy settings through your device settings and app preferences.`
    },
    {
      id: 'cookies',
      title: 'Cookies and Similar Technologies',
      content: `We use cookies and similar technologies to enhance your experience with our app. Cookies help us understand how you use our services, remember your preferences, and improve our features. You can control cookies through your browser settings, but disabling certain cookies may affect your ability to use our services effectively.`
    },
    {
      id: 'children',
      title: 'Children\'s Privacy',
      content: `Our services are not intended for children under the age of 16. We do not knowingly collect personal information from children under 16. If we become aware that we have collected personal information from a child under 16, we will take immediate steps to delete such information and terminate the child\'s account.`
    },
    {
      id: 'changes',
      title: 'Changes to This Policy',
      content: `We may update this privacy policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. When we make material changes, we will post the updated policy on this page and update the "Last Updated" date. We will also notify you through our app or via email if the changes significantly affect your privacy rights. Your continued use of our services after the changes take effect constitutes your acceptance of the updated policy.`
    },
    {
      id: 'contact',
      title: 'Contact Us',
      content: `If you have questions about this privacy policy or concerns about how we handle your personal information, please contact us at:\n\nSandpiper Car Washing & Cleaning Services\nEmail: privacy@sandpiper.com\nPhone: +1 (800) 555-0123\nAddress: 123 Service Street, Suite 100, City, State 12345\n\nWe are committed to resolving any privacy concerns you may have in a timely and satisfactory manner.`
    }
  ];

  return (
    <LayoutWrapper>
      <div className="min-h-screen bg-background pt-4 pb-4">
        <div className="container mx-auto px-3 sm:px-4 max-w-4xl">
          <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 shadow-sm border border-gray-100">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
              <p className="text-xs sm:text-sm text-gray-600">Last Updated: January 1, 2026</p>
            </div>

            <div className="prose max-w-none mb-6 sm:mb-8 md:mb-10">
              <p className="text-sm sm:text-base text-gray-700 mb-4 sm:mb-6">
                At Sandpiper Car Washing & Cleaning Services, we are committed to protecting your privacy and safeguarding your personal information.
                This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our mobile application and services.
              </p>

              <div className="bg-blue-50 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl mb-4 sm:mb-6 md:mb-8">
                <h2 className="text-base sm:text-lg md:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">Important Notice</h2>
                <p className="text-xs sm:text-sm text-gray-700">
                  By using our app, you consent to the collection and use of your personal information as described in this Privacy Policy.
                  Please read this policy carefully. If you do not agree with our practices, please do not use our services.
                </p>
              </div>

              <p className="text-xs sm:text-sm text-gray-700 mb-6 sm:mb-8">
                This Privacy Policy applies to all users of our app, including customers who book services,
                service providers who deliver them, and any other individuals who interact with our platform.
              </p>
            </div>

            <div className="space-y-3 sm:space-y-4">
              {sections.map((section) => (
                <div key={section.id} className="border border-gray-200 rounded-lg sm:rounded-xl overflow-hidden shadow-sm">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full text-left p-3 sm:p-4 md:p-6 bg-gray-50 hover:bg-gray-100 transition-colors flex items-center justify-between"
                  >
                    <span className="font-semibold text-gray-900 text-sm sm:text-base md:text-lg">{section.title}</span>
                    <svg
                      className={`w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-500 transition-transform duration-200 ${activeSection === section.id ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {activeSection === section.id && (
                    <div className="p-3 sm:p-4 md:p-6 bg-white border-t border-gray-200">
                      <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">{section.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 sm:mt-8 md:mt-10 p-4 sm:p-6 bg-gradient-to-r from-blue-50 to-primary/10 rounded-lg sm:rounded-xl border border-blue-200">
              <h3 className="font-bold text-base sm:text-lg md:text-xl text-gray-900 mb-2 sm:mb-3">Acceptance of This Policy</h3>
              <p className="text-xs sm:text-sm text-gray-700 mb-3 sm:mb-4">
                By accessing or using our app, you acknowledge that you have read, understood, and agree to be bound by this Privacy Policy
                and our Terms of Service. If you do not agree to this policy, please do not use our services.
              </p>
              <p className="text-xs text-gray-600 italic">
                This policy is effective as of January 1, 2026, and will remain in effect except with respect to any changes in its provisions
                in the future, which will be in effect immediately after being posted on this page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </LayoutWrapper>
  );
}