import React from "react";

import {
  Feed,
  FeedContent,
  FeedDescription,
  FeedIndicator,
  FeedItem,
  FeedLabel,
  FeedList,
  FeedListItem,
  FeedTitle,
} from "./feed";

const BriefcaseIcon = () => (
  <svg
    className="size-6 shrink-0 text-foreground"
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 12h.01" />
    <path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    <path d="M22 13a18.15 18.15 0 0 1-20 0" />
    <rect width="20" height="14" x="2" y="6" rx="2" />
  </svg>
);

const Preview = () => {
  return (
    <Feed>
      <FeedItem>
        <FeedIndicator>
          <BriefcaseIcon />
        </FeedIndicator>
        <FeedContent>
          <FeedLabel>2023 - Present</FeedLabel>
          <FeedTitle>Web Designer & Web Developer</FeedTitle>
          <FeedDescription>
            The company has high expectations and using OKRs there is a mutual understanding of
            expectations and performance.
          </FeedDescription>
          <FeedList>
            <FeedListItem>Designed template UIs and design systems in Figma.</FeedListItem>
            <FeedListItem>
              Converted UIs into responsive HTML and CSS with a mobile-first approach.
            </FeedListItem>
            <FeedListItem>Created custom illustrations and item description banners.</FeedListItem>
            <FeedListItem>
              Provided detailed documentation and customer support on GitHub.
            </FeedListItem>
          </FeedList>
        </FeedContent>
      </FeedItem>

      <FeedItem>
        <FeedIndicator>
          <BriefcaseIcon />
        </FeedIndicator>
        <FeedContent>
          <FeedLabel>2021 - 2023</FeedLabel>
          <FeedTitle>Senior Software Engineer at Mailchimp</FeedTitle>
          <FeedDescription>
            This is an excellent company and they reward their employees. It&apos;s becoming a big
            company but it&apos;s still private, so the culture is as good as it gets at 1,000+
            employees if you ask me.
          </FeedDescription>
          <div className="mt-3">
            <a
              className="block rounded-lg border border-layer-line bg-layer hover:shadow-2xs focus:outline-hidden"
              href="#"
            >
              <div className="relative flex items-center overflow-hidden">
                <img
                  className="absolute inset-0 h-full w-32 rounded-s-lg object-cover sm:w-48"
                  src="https://images.unsplash.com/photo-1661956600655-e772b2b97db4?q=80&w=560&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Blog Image"
                />
                <div className="ms-32 grow p-4 sm:ms-48">
                  <div className="flex min-h-24 flex-col justify-center">
                    <h3 className="text-sm font-semibold text-foreground">Studio by Mailchimp</h3>
                    <p className="mt-1 text-sm text-muted-foreground-2">
                      Produce professional, reliable streams easily leveraging Mailchimp&apos;s
                      innovative broadcast studio.
                    </p>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </FeedContent>
      </FeedItem>

      <FeedItem>
        <FeedIndicator>
          <BriefcaseIcon />
        </FeedIndicator>
        <FeedContent>
          <FeedLabel>2011 - 2021</FeedLabel>
          <FeedTitle>Junior Software Engineer at Slack</FeedTitle>
          <FeedDescription>
            Work in Slack is one of the beautiful experience I can do in my entire life. There are a
            lot of interesting thing to learn and manager respect your time and your personality.
          </FeedDescription>
        </FeedContent>
      </FeedItem>

      <FeedItem>
        <FeedIndicator>
          <BriefcaseIcon />
        </FeedIndicator>
        <FeedContent>
          <FeedLabel>2010 - 2011</FeedLabel>
          <FeedTitle>Freelance Graphic Designer</FeedTitle>
          <FeedList>
            <FeedListItem>
              Worked with a diverse range of clients, delivering tailored design solutions.
            </FeedListItem>
            <FeedListItem>
              Developed and maintained strong client relationships through effective communication
              and project management.
            </FeedListItem>
            <FeedListItem>
              Utilized tools such as Notion for project tracking, Mailchimp for email marketing
              designs, Slack for team collaboration, and GitHub for version control and project
              sharing.
            </FeedListItem>
          </FeedList>
        </FeedContent>
      </FeedItem>
    </Feed>
  );
};

export default Preview;
