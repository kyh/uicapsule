import React from "react";
import { motion } from "framer-motion";
import { Container, View, Text, Link, Image } from "@uicapsule/components";

const AboutRoute = () => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <View padding={{ s: [22, 0], l: [35, 0] }} gap={12}>
        <Container width="830px">
          <Image
            src="/img/landing/about/logo.webp"
            alt="Reshaped logo on gradient background"
          />
        </Container>
        <Container width="600px">
          <View gap={6}>
            <Text variant="display-3">Timeless design system </Text>
            <Text variant="featured-3" color="neutral-faded">
              What began as a small package in 2020 grew into a mature library
              that lets you kick-start any project in minutes and scale it as
              you grow.
            </Text>
            <Text variant="featured-3" color="neutral-faded">
              Each of us has spent 10 years building and contributing to design
              systems for startups and corporations with hundreds of designers
              and developers. We&apos;ve learned that trends come and go, but
              core challenges stay. So we&apos;ve chosen to focus on things that
              will be relevant years from now and have created our own approach
              that works at any scale. We&apos;ve packed our expertise into a
              white-label design system that we use ourselves and now make
              available for others — that&apos;s how Reshaped was born.
            </Text>
            <Text variant="featured-3" color="neutral-faded">
              No matter what it will grow into, we&apos;ll stay design system
              freaks that pay attention to every little detail and keep
              challenging industry standards.
            </Text>
            <Text variant="featured-3" color="neutral-faded">
              Sincerely yours,
              <br />
              <Link href="https://twitter.com/blvdmitry">Dmitry</Link>
              &nbsp;and&nbsp;
              <Link href="https://twitter.com/hi_drozdenko">Oleksii</Link>
            </Text>
          </View>
        </Container>
      </View>
    </motion.div>
  );
};

export default AboutRoute;
