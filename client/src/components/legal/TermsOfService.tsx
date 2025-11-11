import './TermsOfService.css';

/**
 * Terms of Service page with comprehensive terms addressing content moderation,
 * user safety, private rooms, and community guidelines
 */
const TermsOfService = () => {
  return (
    <div className='terms-container'>
      <div className='terms-content'>
        <header className='terms-header'>
          <h1 className='terms-title'>Terms of Service</h1>
          <p className='terms-subtitle'>Effective Date: November 10, 2025</p>
        </header>

        <div className='terms-sections'>
          <section className='terms-section'>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing and using this Stack Overflow-style platform ("Service"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section className='terms-section'>
            <h2>2. User Accounts and Registration</h2>
            <p>
              You must provide accurate and complete registration information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
            <ul>
              <li>Users must be at least 13 years old to create an account</li>
              <li>One account per person is permitted</li>
              <li>Account sharing is prohibited</li>
              <li>You may delete your account at any time</li>
            </ul>
          </section>

          <section className='terms-section'>
            <h2>3. Content Policy and Community Guidelines</h2>
            <h3>3.1 Acceptable Content</h3>
            <p>Users may post questions, answers, comments, and other content related to programming and technology topics.</p>
            
            <h3>3.2 Prohibited Content</h3>
            <p>The following types of content are strictly prohibited:</p>
            <ul>
              <li>Harassment, bullying, or personal attacks</li>
              <li>Spam, promotional content, or advertisements</li>
              <li>Hateful, discriminatory, or offensive language</li>
              <li>Copyright or trademark infringement</li>
              <li>Sharing of personal information (doxxing)</li>
              <li>Malicious code or security vulnerabilities</li>
              <li>Off-topic or irrelevant content</li>
              <li>Multiple duplicate questions or answers</li>
            </ul>
          </section>

          <section className='terms-section'>
            <h2>4. Content Moderation and Enforcement</h2>
            <p>
              We employ both automated systems and human moderators to maintain community standards:
            </p>
            <ul>
              <li>Content may be flagged by users and reviewed by moderators</li>
              <li>Violations may result in content removal, warnings, or account suspension</li>
              <li>Repeat offenders may face permanent account termination</li>
              <li>Appeals process available for moderation decisions</li>
              <li>Community voting helps identify quality content</li>
            </ul>
          </section>

          <section className='terms-section'>
            <h2>5. Private Rooms and Communities</h2>
            <h3>5.1 Private Communities</h3>
            <p>
              Users can create private communities with restricted access:
            </p>
            <ul>
              <li>Community creators act as moderators</li>
              <li>Invitation-only or approval-based membership</li>
              <li>Community-specific rules may apply</li>
              <li>Content within private communities is still subject to our Terms of Service</li>
            </ul>

            <h3>5.2 Direct Messaging</h3>
            <p>
              Private messaging between users is available with the following guidelines:
            </p>
            <ul>
              <li>No spam or unsolicited commercial messages</li>
              <li>Harassment via direct messages is prohibited</li>
              <li>Users can block or report inappropriate messages</li>
              <li>Messages may be reviewed if reported for violations</li>
            </ul>
          </section>

          <section className='terms-section'>
            <h2>6. Gaming Features</h2>
            <p>
              Our platform includes gaming features such as Connect Four:
            </p>
            <ul>
              <li>Games are for entertainment purposes only</li>
              <li>No wagering or gambling is permitted</li>
              <li>Fair play is expected - cheating or exploitation is prohibited</li>
              <li>Gaming-related harassment will result in restrictions</li>
            </ul>
          </section>

          <section className='terms-section'>
            <h2>7. User Safety and Security</h2>
            <h3>7.1 Account Security</h3>
            <ul>
              <li>Use strong, unique passwords</li>
              <li>Enable two-factor authentication when available</li>
              <li>Report suspicious account activity immediately</li>
              <li>Do not share login credentials</li>
            </ul>

            <h3>7.2 Personal Safety</h3>
            <ul>
              <li>Never share personal information publicly</li>
              <li>Be cautious about meeting users in person</li>
              <li>Report threatening or concerning behavior</li>
              <li>Use blocking features to avoid unwanted contact</li>
            </ul>
          </section>

          <section className='terms-section'>
            <h2>8. Intellectual Property</h2>
            <p>
              By posting content, you grant us a non-exclusive license to use, modify, and distribute your content. You retain ownership of your original content but are responsible for ensuring you have the right to share any content you post.
            </p>
          </section>

          <section className='terms-section'>
            <h2>9. Limitation of Liability</h2>
            <p>
              The Service is provided "as is" without warranties. We are not liable for any damages arising from your use of the Service, including but not limited to data loss, security breaches, or interactions with other users.
            </p>
          </section>

          <section className='terms-section'>
            <h2>10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. Users will be notified of significant changes, and continued use constitutes acceptance of updated terms.
            </p>
          </section>

          <section className='terms-section'>
            <h2>11. Contact Information</h2>
            <p>
              For questions about these terms or to report violations, contact our support team through the platform's reporting system or email us at legal@stackoverflowclone.com.
            </p>
          </section>
        </div>

        <footer className='terms-footer'>
          <p>
            Last updated: November 10, 2025
          </p>
          <p>
            By using this service, you acknowledge that you have read and understood these Terms of Service.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default TermsOfService;