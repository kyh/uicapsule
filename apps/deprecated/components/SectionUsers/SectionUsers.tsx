import React from "react";
import { Container, Text, View, Actionable } from "@uicapsule/components";
import AffinityLogo from "./logos/Affinity";
import CrollaLowisLogo from "./logos/CrollaLowis";
import FuturiceLogo from "./logos/Futurice";
import MadMobileLogo from "./logos/MadMobile";
import InteractiveSolutionsLogo from "./logos/InteractiveSolutions";
import DeadHappyLogo from "./logos/DeadHappy";
import DecheaLogo from "./logos/Dechea";
import XLabLogo from "./logos/XLab";
import PhysitrackLogo from "./logos/Physitrack";
import s from "./SectionUsers.module.css";

const logos = [
  {
    href: "https://www.affinity.co",
    logo: <AffinityLogo />,
  },
  {
    href: "https://www.crolla-lowis.de",
    logo: <CrollaLowisLogo />,
  },
  {
    href: "https://futurice.com",
    logo: <FuturiceLogo />,
  },
  {
    href: "https://madmobile.com",
    logo: <MadMobileLogo />,
  },
  {
    href: "https://interactivesolutions.se",
    logo: <InteractiveSolutionsLogo />,
  },
  {
    href: "https://deadhappy.com",
    logo: <DeadHappyLogo />,
  },
  {
    href: "https://www.dechea.com",
    logo: <DecheaLogo />,
  },
  {
    href: "https://www.xlab.be/en/",
    logo: <XLabLogo />,
  },
  {
    href: "https://www.physitrack.com",
    logo: <PhysitrackLogo />,
  },
];

const SectionUsers = () => {
  return (
    <Container width="840px">
      <View gap={13}>
        <Text variant="featured-3" align="center" color="neutral-faded">
          Trusted by professionals from
        </Text>
        <View
          direction="row"
          align="center"
          justify="center"
          gap={{ s: 8, l: 14 }}
        >
          {logos.map((item) => (
            <Actionable
              key={item.href}
              href={item.href}
              attributes={{ target: "_blank" }}
              className={s.logo}
            >
              {item.logo}
            </Actionable>
          ))}
        </View>
      </View>
    </Container>
  );
};

export default SectionUsers;
