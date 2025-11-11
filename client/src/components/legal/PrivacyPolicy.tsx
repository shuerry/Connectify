import './PrivacyPolicy.css';

/**
 * Privacy Policy page with comprehensive privacy information addressing
 * data collection, usage, storage, and user rights
 */
const PrivacyPolicy = () => {
  return (
    <div className='privacy-container'>
      <div className='privacy-content'>
        <header className='privacy-header'>
          <h1 className='privacy-title'>Privacy Policy</h1>
          <p className='privacy-subtitle'>Effective Date: November 10, 2025</p>
        </header>

        <div className='privacy-sections'>
          <section className='privacy-section'>
            <h2>1. Information We Collect</h2>
            <h3>1.1 Account Information</h3>
            <ul>
              <li>Username and email address</li>
              <li>Password (encrypted and securely stored)</li>
              <li>Profile information you choose to provide</li>
              <li>Account preferences and settings</li>
            </ul>

            <h3>1.2 Content and Activity</h3>
            <ul>
              <li>Questions, answers, and comments you post</li>
              <li>Voting and reputation activity</li>
              <li>Collections and saved content</li>
              <li>Community participation and memberships</li>
              <li>Direct messages and communications</li>
              <li>Gaming activity and statistics</li>
            </ul>

            <h3>1.3 Technical Information</h3>
            <ul>
              <li>IP address and location data</li>
              <li>Browser type and version</li>
              <li>Device information and operating system</li>
              <li>Usage patterns and session data</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className='privacy-section'>
            <h2>2. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul>
              <li>Provide and maintain the service</li>
              <li>Authenticate your identity and prevent fraud</li>
              <li>Enable communication between users</li>
              <li>Personalize your experience and recommendations</li>
              <li>Moderate content and enforce community guidelines</li>
              <li>Analyze usage patterns and improve our service</li>
              <li>Send important notifications and updates</li>
              <li>Respond to support requests and feedback</li>
            </ul>
          </section>

          <section className='privacy-section'>
            <h2>3. Information Sharing and Disclosure</h2>
            <h3>3.1 Public Information</h3>
            <p>The following information is publicly visible:</p>
            <ul>
              <li>Your username and public profile information</li>
              <li>Questions, answers, and comments you post</li>
              <li>Your reputation score and badges</li>
              <li>Public community memberships</li>
              <li>Gaming achievements and statistics</li>
            </ul>

            <h3>3.2 Private Information</h3>
            <p>We keep private:</p>
            <ul>
              <li>Your email address and contact information</li>
              <li>Direct messages and private communications</li>
              <li>Private community content</li>
              <li>Account settings and preferences</li>
              <li>IP addresses and technical data</li>
            </ul>

            <h3>3.3 Third-Party Sharing</h3>
            <p>We may share information with:</p>
            <ul>
              <li>Service providers who help operate our platform</li>
              <li>Law enforcement when required by legal obligation</li>
              <li>Other users when you explicitly choose to share</li>
              <li>Analytics services (with anonymized data only)</li>
            </ul>
          </section>

          <section className='privacy-section'>
            <h2>4. Data Storage and Security</h2>
            <h3>4.1 Security Measures</h3>
            <ul>
              <li>Passwords are encrypted using industry-standard methods</li>
              <li>Data transmission is protected with SSL/TLS encryption</li>
              <li>Regular security audits and monitoring</li>
              <li>Access controls and authentication systems</li>
              <li>Secure data centers and infrastructure</li>
            </ul>

            <h3>4.2 Data Retention</h3>
            <ul>
              <li>Account data is kept while your account is active</li>
              <li>Public posts may remain visible after account deletion</li>
              <li>Direct messages are deleted after account termination</li>
              <li>Log data is retained for up to 12 months</li>
              <li>Backup data is automatically purged after 90 days</li>
            </ul>
          </section>

          <section className='privacy-section'>
            <h2>5. Cookies and Tracking</h2>
            <p>We use cookies and similar technologies for:</p>
            <ul>
              <li>Authentication and session management</li>
              <li>Remembering your preferences and settings</li>
              <li>Analytics and performance monitoring</li>
              <li>Security and fraud prevention</li>
              <li>Personalized content recommendations</li>
            </ul>
            <p>
              You can control cookie settings in your browser, but some features may not work properly if cookies are disabled.
            </p>
          </section>

          <section className='privacy-section'>
            <h2>6. Your Privacy Rights</h2>
            <h3>6.1 Access and Control</h3>
            <p>You have the right to:</p>
            <ul>
              <li>View and download your personal data</li>
              <li>Update or correct your information</li>
              <li>Delete your account and associated data</li>
              <li>Control privacy settings and visibility</li>
              <li>Opt out of certain communications</li>
              <li>Request data portability</li>
            </ul>

            <h3>6.2 Communication Preferences</h3>
            <ul>
              <li>Notification settings for questions and answers</li>
              <li>Email communication preferences</li>
              <li>Direct message and mention notifications</li>
              <li>Community and gaming updates</li>
            </ul>
          </section>

          <section className='privacy-section'>
            <h2>7. Children's Privacy</h2>
            <p>
              Our service is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we discover that we have collected information from a child under 13, we will delete it immediately.
            </p>
          </section>

          <section className='privacy-section'>
            <h2>8. International Data Transfers</h2>
            <p>
              Your data may be processed and stored in countries other than your own. We ensure appropriate safeguards are in place to protect your information according to this privacy policy.
            </p>
          </section>

          <section className='privacy-section'>
            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify users of significant changes through email or platform notifications. Your continued use of the service after changes constitute acceptance of the updated policy.
            </p>
          </section>

          <section className='privacy-section'>
            <h2>10. Contact Us</h2>
            <p>
              For questions about this privacy policy or to exercise your privacy rights, contact us at:
            </p>
            <ul>
              <li>Email: privacy@stackoverflowclone.com</li>
              <li>Through the platform's contact form</li>
              <li>Via the support ticket system</li>
            </ul>
          </section>
        </div>

        <footer className='privacy-footer'>
          <p>
            Last updated: November 10, 2025
          </p>
          <p>
            We are committed to protecting your privacy and being transparent about our data practices.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default PrivacyPolicy;