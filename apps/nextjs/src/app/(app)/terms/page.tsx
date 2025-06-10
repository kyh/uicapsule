const Page = () => {
  return (
    <div className="flex flex-col gap-10 p-8 md:p-20">
      <h1 className="text-3xl leading-snug lg:text-5xl">
        Terms and conditions
      </h1>
      <div className="flex flex-col gap-5 text-base leading-loose">
        <p>{`Please read these Terms and Conditions ("Terms," "Terms and Conditions") carefully before using the [Your E-commerce Website Name] website (the "Service") operated by [Your Company Name] ("us," "we," or "our").`}</p>
        <p>
          Your access to and use of the Service is conditioned on your
          acceptance of and compliance with these Terms. These Terms apply to
          all visitors, users, and others who access or use the Service. By
          accessing or using the Service, you agree to be bound by these Terms.
          If you disagree with any part of the terms, then you may not access
          the Service.
        </p>

        <p>
          <strong>Purchases</strong>
        </p>
        <p>{`If you wish to purchase any product or service made available through the Service ("Purchase"), you may be asked to supply certain information relevant to your Purchase, including, without limitation, your name, shipping address, billing information, and contact information.`}</p>

        <p>
          <strong>Subscriptions</strong>
        </p>
        <p>{`Some parts of the Service are billed on a subscription basis ("Subscription(s)"). You will be billed in advance on a recurring and periodic basis. Your subscription will automatically renew at the end of each billing cycle unless you cancel it or we terminate it. You may cancel your subscription at any time by contacting our support team.`}</p>

        <p>
          <strong>Content</strong>
        </p>
        <p>{`Our Service allows you to post, link, store, share, and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.`}</p>
        <p>
          By posting Content on or through the Service, you represent and
          warrant that: (a) the Content is yours (you own it) and/or you have
          the right to use it and the right to grant us the rights and license
          as provided in these Terms, and (b) that the posting of your Content
          on or through the Service does not violate the privacy rights,
          publicity rights, copyrights, contract rights, or any other rights of
          any person or entity.
        </p>

        <p>
          <strong>Intellectual Property</strong>
        </p>
        <p>
          The Service and its original content, features, and functionality are
          and will remain the exclusive property of [Your Company Name] and its
          licensors. The Service is protected by copyright, trademark, and other
          laws of both the [Country] and foreign countries. Our trademarks and
          trade dress may not be used in connection with any product or service
          without the prior written consent of [Your Company Name].
        </p>

        <p>
          <strong>Termination</strong>
        </p>
        <p>
          We may terminate or suspend access to our Service immediately, without
          prior notice or liability, for any reason whatsoever, including
          without limitation if you breach the Terms.
        </p>
        <p>
          All provisions of the Terms which by their nature should survive
          termination shall survive termination, including, without limitation,
          ownership provisions, warranty disclaimers, indemnity, and limitations
          of liability.
        </p>

        <p>
          <strong>Governing Law</strong>
        </p>
        <p>
          These Terms shall be governed and construed in accordance with the
          laws of [Country], without regard to its conflict of law provisions.
        </p>
        <p>
          Our failure to enforce any right or provision of these Terms will not
          be considered a waiver of those rights. If any provision of these
          Terms is held to be invalid or unenforceable by a court, the remaining
          provisions of these Terms will remain in effect. These Terms
          constitute the entire agreement between us regarding our Service and
          supersede and replace any prior agreements we might have had between
          us regarding the Service.
        </p>

        <p>
          <strong>Changes</strong>
        </p>
        <p>{`We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is a material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.`}</p>
        <p>
          By continuing to access or use our Service after those revisions
          become effective, you agree to be bound by the revised Terms. If you
          do not agree to the new Terms, please stop using the Service.
        </p>

        <p>
          <strong>Contact Us</strong>
        </p>
        <p>
          If you have any questions about these Terms, please contact us at
          [Your Contact Information].
        </p>
      </div>
    </div>
  );
};

export default Page;
